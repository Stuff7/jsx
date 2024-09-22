mod dir;
mod error;
mod jsx_parser;

use error::ParserError;
use jsx_parser::{GlobalState, JsxParser, JsxTemplate};
use std::{fs, io::Read};

fn main() -> Result<(), ParserError> {
  let path = std::env::args().nth(1).ok_or(ParserError::MissingDir)?;
  let paths = dir::RecursiveDirIterator::new(path)?.filter(|p| {
    let Some(ext) = p.extension().and_then(|n| n.to_str())
    else {
      return false;
    };
    matches!(ext, "js" | "jsx" | "ts" | "tsx")
  });

  let mut parser = JsxParser::new()?;
  let mut source = Vec::new();
  let mut state = GlobalState::default();

  for path in paths {
    let mut file = fs::OpenOptions::new().read(true).write(true).open(path)?;
    file.read_to_end(&mut source)?;

    let tree = parser.tree(&source)?;
    let matches = parser.parse(tree.root_node(), &source)?;

    let templates = matches
      .enumerate()
      .map(|(i, m)| JsxTemplate::parse(i, m.captures, &source))
      .collect::<Result<Box<_>, ParserError>>()?;

    for template in &templates {
      if template.is_root {
        println!("====================================================");
        let parts = template.parts(&templates, &mut state)?;
        println!("{}\n\n{};\n\n", parts.imports, parts.create_fn);
      }
    }
    println!("{}", state.get_imports()?);

    source.clear();
  }

  Ok(())
}
