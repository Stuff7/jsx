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
  #[error("Missing directory path")]
  MissingDir,
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
