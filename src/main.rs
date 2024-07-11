mod dir;
mod js;

use std::{
  fmt::{Debug, Display},
  io,
};

fn main() -> Result<(), Error> {
  let path = std::env::args().nth(1).ok_or(Error::MissingDir)?;
  let paths = dir::RecursiveDirIterator::new(path)?.filter(|p| p.extension().is_some_and(|n| n == "js"));
  js::parse(paths)?;

  Ok(())
}

enum Error {
  Io(io::Error),
  Parser(js::Error),
  MissingDir,
}

impl std::error::Error for Error {}

impl Debug for Error {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{self}")
  }
}

impl Display for Error {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Io(err) => write!(f, "{err}"),
      Self::Parser(err) => write!(f, "{err}"),
      Self::MissingDir => write!(f, "Missing directory path"),
    }
  }
}

impl From<io::Error> for Error {
  fn from(value: io::Error) -> Self {
    Self::Io(value)
  }
}

impl From<js::Error> for Error {
  fn from(value: js::Error) -> Self {
    Self::Parser(value)
  }
}
