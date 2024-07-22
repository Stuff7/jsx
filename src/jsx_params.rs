mod dir;
mod error;

use error::ParserError;
use std::{
  fmt::Debug,
  fs::{self},
  io::{self, Read, Seek, Write},
  path::{Path, PathBuf},
};
use tree_sitter::{Parser, Query, QueryCapture, QueryCursor};

fn main() -> Result<(), ParserError> {
  let path = std::env::args().nth(1).ok_or(ParserError::MissingDir)?;
  let paths = dir::RecursiveDirIterator::new(path)?.filter(|p| p.extension().is_some_and(|n| n == "js"));
  parse(paths)?;

  Ok(())
}

const Q_PROPS: &str = include_str!("../queries/jsx_props.scm");

pub fn parse<I: Iterator<Item = PathBuf>>(paths: I) -> Result<(), ParserError> {
  let javascript = tree_sitter_javascript::language();
  let mut parser = Parser::new();

  parser.set_language(&javascript)?;

  let mut source = Vec::new();
  let mut outbuf = Vec::new();

  let paths: Box<[_]> = paths.collect();
  let jsx_ident = find_jsx_ident(&mut source, paths.iter())?;

  let q_src = if let Some(jsx_ident) = jsx_ident {
    &Q_PROPS.replace("jsx", jsx_ident)
  } else {
    Q_PROPS
  };

  source.clear();

  let query = Query::new(&javascript, q_src)?;

  let mut cursor = QueryCursor::new();

  for path in paths.iter() {
    let mut file = fs::OpenOptions::new().read(true).write(true).open(path)?;

    file.read_to_end(&mut source)?;
    let tree = parser.parse(&source, None).ok_or(ParserError::Parse)?;
    let root = tree.root_node();
    let matches = cursor.matches(&query, root, source.as_slice());
    let mut last_idx = 0;

    for m in matches {
      let captures = find_capture_names(m.captures);

      if let Some((key, val)) = captures.obj {
        outbuf.extend_from_slice(&source[last_idx..key.node.range().start_byte]);
        last_idx = val.node.range().end_byte;

        let key_txt = key.node.utf8_text(&source)?;
        let val_txt = val.node.utf8_text(&source)?;
        let (sbo, sbc) = if key.node.kind() == "string" { ("[", "]") } else { ("", "") };
        outbuf.extend_from_slice(format!("get {sbo}{key_txt}{sbc}(){{return {val_txt}}}").as_bytes());

        let node_type = val.node.grammar_name();
        if node_type == "identifier" || node_type == "member_expression" || node_type == "subscript_expression" {
          outbuf.extend_from_slice(format!(",set {sbo}{key_txt}{sbc}(v){{{val_txt}=v}}").as_bytes());
        }
      }

      if let Some(param) = captures.param {
        let range = param.node.range();
        outbuf.extend_from_slice(&source[last_idx..range.start_byte]);
        last_idx = range.end_byte;

        let txt = param.node.utf8_text(&source)?;
        outbuf.extend_from_slice(format!("function(){{return {txt}}}").as_bytes());
      }
    }

    if !outbuf.is_empty() {
      if last_idx < source.len() {
        outbuf.extend_from_slice(&source[last_idx..]);
      }
      file.seek(io::SeekFrom::Start(0))?;
      file.write_all(&outbuf)?;
    }
    outbuf.clear();
    source.clear();
  }

  Ok(())
}

const Q_JSX_IDENT: &str = include_str!("../queries/jsx_ident.scm");

#[allow(clippy::needless_borrows_for_generic_args)]
pub fn find_jsx_ident<P: AsRef<Path>, I: Iterator<Item = P>>(source: &mut Vec<u8>, paths: I) -> Result<Option<&str>, ParserError> {
  let javascript = tree_sitter_javascript::language();
  let mut parser = Parser::new();

  parser.set_language(&javascript)?;

  let query = Query::new(&javascript, Q_JSX_IDENT)?;

  let mut cursor = QueryCursor::new();
  const JSX_IDENT_IDX: u32 = 0;

  for path in paths {
    let mut file = fs::OpenOptions::new().read(true).open(&path)?;

    file.read_to_end(source)?;
    let tree = parser.parse(&source, None).ok_or(ParserError::Parse)?;
    let root = tree.root_node();
    let matches = cursor.matches(&query, root, source.as_slice());

    if let Some(ident) = matches.flat_map(|m| m.captures).find(|c| c.index == JSX_IDENT_IDX) {
      return Ok(Some(ident.node.utf8_text(source)?));
    }

    source.clear();
  }

  Ok(None)
}

#[derive(Debug)]
struct CaptureNames<'a> {
  obj: Option<(&'a QueryCapture<'a>, &'a QueryCapture<'a>)>,
  param: Option<&'a QueryCapture<'a>>,
}

fn find_capture_names<'a>(captures: &'a [QueryCapture<'a>]) -> CaptureNames<'a> {
  const KEY_IDX: u32 = 1;
  const VAL_IDX: u32 = 3;
  const PARAM_IDX: u32 = 4;

  let mut key = None;
  let mut value = None;
  let mut param = None;

  for cap in captures {
    match cap.index {
      KEY_IDX => key = Some(cap),
      VAL_IDX => value = Some(cap),
      PARAM_IDX => param = Some(cap),
      _ => (),
    }
  }

  CaptureNames {
    obj: key.and_then(|k| value.map(|v| (k, v))),
    param,
  }
}
