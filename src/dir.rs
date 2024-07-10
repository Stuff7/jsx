use std::fs::{self, ReadDir};
use std::io;
use std::path::{Path, PathBuf};

pub struct RecursiveDirIterator {
  stack: Vec<ReadDir>,
}

impl RecursiveDirIterator {
  pub fn new<P: AsRef<Path>>(root: P) -> io::Result<Self> {
    let root_read_dir = fs::read_dir(root)?;
    Ok(RecursiveDirIterator { stack: vec![root_read_dir] })
  }
}

impl Iterator for RecursiveDirIterator {
  type Item = PathBuf;

  fn next(&mut self) -> Option<Self::Item> {
    while let Some(current_read_dir) = self.stack.last_mut() {
      let Some(res) = current_read_dir.next()
      else {
        self.stack.pop();
        continue;
      };

      let path = res.ok()?.path();

      if path.is_dir() {
        self.stack.push(fs::read_dir(&path).ok()?);
      }
      else if path.is_file() {
        return Some(path);
      }
    }

    None
  }
}
