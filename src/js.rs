use std::{
  fmt::Display,
  fs::{self},
  io::{self, Read},
  path::PathBuf,
};
use tree_sitter::{LanguageError, Parser, Query, QueryCursor, QueryError};

pub fn parse<I: Iterator<Item = PathBuf>>(paths: I) -> Result<(), Error> {
  let javascript = tree_sitter_javascript::language();
  let mut parser = Parser::new();

  parser.set_language(&javascript)?;

  let query = Query::new(&javascript, Q_PROPS)?;

  const KEY_IDX: usize = 1;
  const VAL_IDX: usize = 2;

  let mut cursor = QueryCursor::new();

  let mut source = Vec::with_capacity(1_000_000);
  let mut outbuf = Vec::with_capacity(1_500_000);

  for path in paths {
    let mut file = fs::OpenOptions::new().read(true).write(true).open(&path)?;
    let file_size = file.metadata().map(|m| m.len()).unwrap_or(0) as usize;

    if file_size > source.capacity() {
      source.resize(file_size, 0);
      outbuf.resize(file_size + file_size / 2, 0);
    }

    file.read_to_end(&mut source)?;
    let tree = parser.parse(&source, None).ok_or(Error::Parse)?;
    let root = tree.root_node();
    let matches = cursor.matches(&query, root, source.as_slice());
    let mut last_idx = 0;

    for m in matches {
      let key = m.captures[KEY_IDX];
      let val = m.captures[VAL_IDX];

      outbuf.extend_from_slice(&source[last_idx..key.node.range().start_byte]);
      last_idx = val.node.range().end_byte;

      let key_txt = key.node.utf8_text(&source)?;
      let val_txt = val.node.utf8_text(&source)?;
      let (sbo, sbc) = if key.node.kind() == "string" { ("[", "]") } else { ("", "") };
      outbuf.extend_from_slice(format!("get {sbo}{key_txt}{sbc}() {{ return {val_txt} }}").as_bytes());
    }

    if !outbuf.is_empty() {
      if last_idx < source.len() {
        outbuf.extend_from_slice(&source[last_idx..]);
      }
      println!("\x1b[38;5;228m{path:?}\x1b[0m\n{}\n", std::str::from_utf8(&outbuf)?);
    }
    outbuf.clear();
    source.clear();
  }

  Ok(())
}

const Q_PROPS: &str = r#"(
  (call_expression
   function: (identifier) @_func
   arguments:
     (arguments
       (_)
       (object
         (pair
           key: (_) @key
           value: [
             (identifier)
             (member_expression)
             (subscript_expression)
             (template_string)
             (unary_expression)
             (binary_expression)
             (parenthesized_expression)
           ] @value
         )
       )
     )
  )

  (#eq? @_func "jsx")
)"#;

const Q_CHILDREN: &str = r#"(
  (call_expression
   function: (identifier) @_func
   arguments:
     (arguments
       (_)
       (_)
       [
         (identifier)
         (member_expression)
         (subscript_expression)
         (template_string)
         (unary_expression)
         (binary_expression)
         (parenthesized_expression)
       ]* @param
     )
  )

  (#eq? @_func "jsx")
)"#;

#[derive(Debug)]
pub enum Error {
  Io(io::Error),
  Language(LanguageError),
  Query(QueryError),
  Utf8(std::str::Utf8Error),
  Parse,
}

impl std::error::Error for Error {}

impl Display for Error {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Io(err) => write!(f, "{}", err),
      Self::Language(err) => write!(f, "{}", err),
      Self::Query(err) => write!(f, "{}", err),
      Self::Utf8(err) => write!(f, "{}", err),
      Self::Parse => write!(f, "Failed to parse"),
    }
  }
}

impl From<LanguageError> for Error {
  fn from(value: LanguageError) -> Self {
    Self::Language(value)
  }
}

impl From<QueryError> for Error {
  fn from(value: QueryError) -> Self {
    Self::Query(value)
  }
}

impl From<io::Error> for Error {
  fn from(value: io::Error) -> Self {
    Self::Io(value)
  }
}

impl From<std::str::Utf8Error> for Error {
  fn from(value: std::str::Utf8Error) -> Self {
    Self::Utf8(value)
  }
}
