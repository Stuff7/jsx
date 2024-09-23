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

    for (i, template) in templates.iter().enumerate().rev() {
      if template.is_root {
        if templates.iter().rev().take(templates.len() - 1 - i).any(|t| {
          let range = t.start..t.end + 1;
          range.contains(&template.start) && range.contains(&template.end)
        }) {
          continue;
        }

        println!("==================={} - {}====================", template.start, template.end);
        println!("{}\n\n", template.source(&source)?);
        let parts = template.parts(&templates, &mut state)?;
        println!("{}\n\n{};\n\n", parts.imports, parts.create_fn);
      }
    }
    println!("{}", state.generate_setup_js(&templates)?);

    source.clear();
  }

  Ok(())
}
