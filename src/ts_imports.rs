mod dir;
mod error;

use std::{
  fs::{self},
  io::{Read, Seek, SeekFrom, Write},
  os::unix::ffi::OsStrExt,
  path::{Path, PathBuf},
};
use tree_sitter::{Parser, Query, QueryCursor};

fn main() -> Result<(), error::AppError> {
  let path = PathBuf::from(std::env::args().nth(1).ok_or(error::AppError::MissingDir)?);
  let paths = dir::RecursiveDirIterator::new(&path)?.filter(|p| p.extension().is_some_and(|n| n == "js"));
  parse(path, paths)?;

  Ok(())
}

const Q_IMPORTS: &str = include_str!("../queries/ts_imports.scm");

pub fn parse<I: Iterator<Item = PathBuf>>(parent: PathBuf, paths: I) -> Result<(), error::ParserError> {
  let javascript = tree_sitter_javascript::language();
  let mut parser = Parser::new();

  parser.set_language(&javascript)?;

  let query = Query::new(&javascript, Q_IMPORTS)?;

  let mut cursor = QueryCursor::new();

  let mut source = Vec::new();
  let mut outbuf = Vec::new();

  for path in paths {
    let mut file = fs::OpenOptions::new().read(true).write(true).open(&path)?;

    file.read_to_end(&mut source)?;
    let tree = parser.parse(&source, None).ok_or(error::ParserError::Parse)?;
    let root = tree.root_node();
    let matches = cursor.matches(&query, root, source.as_slice());

    let mut last_idx = 0;

    for cap in matches.flat_map(|m| m.captures) {
      let range = cap.node.range();

      outbuf.extend_from_slice(&source[last_idx..range.start_byte]);
      last_idx = range.end_byte;

      let import = parent.join(&cap.node.utf8_text(&source)?[2..]);
      let parent = path.parent().expect("Query matched a directory");

      let mut relative = make_relative(&import, parent);
      relative.set_extension("js");

      outbuf.extend_from_slice(relative.as_os_str().as_bytes());
    }

    if !outbuf.is_empty() {
      if last_idx < source.len() {
        outbuf.extend_from_slice(&source[last_idx..]);
      }
      file.seek(SeekFrom::Start(0))?;
      file.write_all(&outbuf)?;
    }

    outbuf.clear();
    source.clear();
  }

  Ok(())
}

fn make_relative(path: &Path, relative_to: &Path) -> PathBuf {
  let mut path_components = path.components().peekable();
  let mut relative_to_components = relative_to.components().peekable();

  let mut relative_path = PathBuf::new();

  while path_components.peek() == relative_to_components.peek() {
    path_components.next();
    relative_to_components.next();
  }

  for _ in relative_to_components {
    relative_path.push("..");
  }

  if relative_path.as_os_str().is_empty() {
    relative_path.push(".");
  }

  for comp in path_components {
    relative_path.push(comp);
  }

  relative_path
}
