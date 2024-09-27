mod dir;
mod error;

use error::ParserError;
use std::{
  fs,
  io::{Read, Seek, SeekFrom, Write},
  path::{Path, PathBuf},
};
use tree_sitter::{Language, Parser, Query, QueryCursor};

const Q_IMPORTS: &str = include_str!("../queries/ts_imports.scm");

fn main() -> Result<(), ParserError> {
  let dist_dir = PathBuf::from(std::env::args().nth(1).ok_or(ParserError::MissingDir)?);
  let mut parser = ImportParser::new()?;

  let mut paths = dir::RecursiveDirIterator::new(&dist_dir)?.filter(|p| p.extension().is_some_and(|n| n == "js"));
  while let Some(r) = parser.next(&dist_dir, &mut paths) {
    if parser.outbuf.is_empty() {
      continue;
    }

    let (mut file, _) = r?;
    file.seek(SeekFrom::Start(0))?;
    file.write_all(&parser.outbuf)?;
  }

  let types_dir = Path::new("js");
  let types_outdir = dist_dir.join("types");
  fs::create_dir_all(&types_outdir)?;

  let mut paths = dir::RecursiveDirIterator::new(types_dir)?.filter(|p| p.extension().is_some_and(|n| n == "ts" || n == "tsx"));
  while let Some(r) = parser.next(types_dir, &mut paths) {
    let (_, path) = r?;
    let path = path.strip_prefix(types_dir)?;
    let outdir = types_outdir.join(path);

    fs::create_dir_all(outdir.parent().expect("Type file should have a parent"))?;
    fs::write(
      types_outdir.join(path),
      if parser.outbuf.is_empty() { &parser.source } else { &parser.outbuf },
    )?;
  }

  for f in fs::read_dir(".")? {
    let path = f?.path();

    if !path.extension().is_some_and(|ext| ext == "ts") {
      continue;
    }

    fs::copy(&path, dist_dir.join(&path))?;
  }

  Ok(())
}

struct ImportParser {
  parser: Parser,
  query: Query,
  cursor: QueryCursor,
  source: Vec<u8>,
  outbuf: Vec<u8>,
}

impl ImportParser {
  fn new() -> Result<Self, ParserError> {
    let javascript: Language = tree_sitter_javascript::LANGUAGE.into();

    let mut parser = Parser::new();
    parser.set_language(&javascript)?;

    Ok(Self {
      parser,
      query: Query::new(&javascript, Q_IMPORTS)?,
      cursor: QueryCursor::new(),
      source: Vec::new(),
      outbuf: Vec::new(),
    })
  }

  #[allow(clippy::needless_borrows_for_generic_args)]
  fn next<I: Iterator<Item = PathBuf>>(&mut self, parent: &Path, paths: &mut I) -> Option<Result<(fs::File, PathBuf), ParserError>> {
    self.source.clear();
    self.outbuf.clear();

    paths.next().map(|path| {
      let mut file = fs::OpenOptions::new().read(true).write(true).open(&path)?;

      file.read_to_end(&mut self.source)?;
      let tree = self.parser.parse(&self.source, None).ok_or(ParserError::Parse)?;
      let root = tree.root_node();
      let matches = self.cursor.matches(&self.query, root, self.source.as_slice());

      let mut last_idx = 0;

      for cap in matches.flat_map(|m| m.captures) {
        let range = cap.node.range();

        self.outbuf.extend_from_slice(&self.source[last_idx..range.start_byte]);
        last_idx = range.end_byte;

        let import = parent.join(&cap.node.utf8_text(&self.source)?[2..]);
        let parent = path.parent().expect("Query matched a directory");

        let mut relative = make_relative(&import, parent);
        relative.set_extension("js");

        self.outbuf.extend_from_slice(relative.as_os_str().as_encoded_bytes());
      }

      if !self.outbuf.is_empty() && last_idx < self.source.len() {
        self.outbuf.extend_from_slice(&self.source[last_idx..]);
      }

      Ok((file, path))
    })
  }
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
