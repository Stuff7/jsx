use tree_sitter::{LanguageError, QueryError};

use std::{
  fmt::{self, Debug},
  io,
  path::StripPrefixError,
  str::Utf8Error,
};

#[derive(thiserror::Error)]
pub enum ParserError {
  #[error("Failed to parse")]
  Parse,
  #[error("[{ln}:{col}] Fatal: {msg}")]
  ParseMsg { ln: usize, col: usize, msg: &'static str },
  #[error("Missing directory path")]
  MissingDir,
  #[error(transparent)]
  Fmt(#[from] fmt::Error),
  #[error(transparent)]
  Io(#[from] io::Error),
  #[error(transparent)]
  Language(#[from] LanguageError),
  #[error(transparent)]
  Query(#[from] QueryError),
  #[error(transparent)]
  Utf8(#[from] Utf8Error),
  #[error(transparent)]
  StripPrefix(#[from] StripPrefixError),
}

impl Debug for ParserError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{self}")
  }
}

impl ParserError {
  pub fn msg(msg: &'static str, node: tree_sitter::Node<'_>) -> Self {
    let range = node.range().start_point;
    Self::ParseMsg {
      msg,
      ln: range.row,
      col: range.column,
    }
  }
}
