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

pub fn parse<I: Iterator<Item = PathBuf>>(paths: I) -> Result<(), ParserError> {
  let javascript = tree_sitter_javascript::language();
  let mut parser = Parser::new();

  parser.set_language(&javascript)?;

  let mut source = Vec::new();
  // let mut outbuf = Vec::new();

  let paths: Box<[_]> = paths.collect();

  source.clear();

  let query = Query::new(&javascript, Q_JSX_TEMPLATE)?;

  let mut cursor = QueryCursor::new();

  for path in paths.iter() {
    let mut file = fs::OpenOptions::new().read(true).write(true).open(path)?;

    file.read_to_end(&mut source)?;
    let tree = parser.parse(&source, None).ok_or(ParserError::Parse)?;
    let root = tree.root_node();
    let matches = cursor.matches(&query, root, source.as_slice());

    for m in matches {
      let captures = find_capture_names(m.captures, &source)?;
      println!("CAPS: {:#?}", captures);

      let key_txt = captures.key.map(|v| v.node.utf8_text(&source)).transpose()?.unwrap_or_default();
      let val_txt = captures.value.map(|v| v.node.utf8_text(&source)).transpose()?.unwrap_or_default();
      println!(
        "[{} - {}] <{}> PROP: {key_txt:?} {val_txt:?} CHILDREN: {:?}\n",
        captures.start,
        captures.end,
        captures.tag,
        captures.children.iter().map(|v| v.node.utf8_text(&source)).collect::<Vec<_>>()
      );
    }

    // if !outbuf.is_empty() {
    //   if last_idx < source.len() {
    //     outbuf.extend_from_slice(&source[last_idx..]);
    //   }
    //   file.seek(io::SeekFrom::Start(0))?;
    //   file.write_all(&outbuf)?;
    // }
    // outbuf.clear();
    // source.clear();
  }

  Ok(())
}

const Q_JSX_TEMPLATE: &str = include_str!("../queries/jsx_template.scm");

#[derive(Debug)]
struct CaptureNames<'a> {
  tag: &'a str,
  key: Option<&'a QueryCapture<'a>>,
  value: Option<&'a QueryCapture<'a>>,
  children: Vec<&'a QueryCapture<'a>>,
  start: usize,
  end: usize,
}

fn find_capture_names<'a>(captures: &'a [QueryCapture<'a>], source: &'a [u8]) -> Result<CaptureNames<'a>, ParserError> {
  enum CaptureIdx {
    Tag,
    Key,
    Value,
    Children,
    Element,
  }

  let mut tag = "";
  let mut key = None;
  let mut value = None;
  let mut children = Vec::new();
  let mut start = 0;
  let mut end = 0;

  for cap in captures {
    match cap.index {
      x if x == CaptureIdx::Tag as u32 => tag = cap.node.utf8_text(source)?,
      x if x == CaptureIdx::Key as u32 => key = Some(cap),
      x if x == CaptureIdx::Value as u32 => value = Some(cap),
      x if x == CaptureIdx::Children as u32 => children.push(cap),
      x if x == CaptureIdx::Element as u32 => {
        start = cap.node.start_byte();
        end = cap.node.end_byte();
      }
      _ => (),
    }
  }

  Ok(CaptureNames {
    tag,
    key,
    value,
    children,
    start,
    end,
  })
}
