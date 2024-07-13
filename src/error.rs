use tree_sitter::{LanguageError, QueryError};

use std::{
  fmt::{self, Debug},
  io,
  path::StripPrefixError,
  str::Utf8Error,
};

macro_rules! display_error {
  ($name: ident) => {
    impl Debug for $name {
      fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{self}")
      }
    }
  };
}

#[derive(thiserror::Error)]
pub enum AppError {
  #[error(transparent)]
  Io(#[from] io::Error),
  #[error(transparent)]
  Parser(#[from] ParserError),
  #[error("Missing directory path")]
  MissingDir,
}
display_error!(AppError);

#[derive(thiserror::Error)]
pub enum ParserError {
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
  #[error("Failed to parse")]
  Parse,
}
display_error!(ParserError);
