mod dir;
mod error;
mod jsx_parser;

use error::ParserError;
use jsx_parser::{GlobalState, JsxParser, JsxTemplate};
use std::{env, fs, io::Read, path::PathBuf, time::Instant};

fn main() -> Result<(), ParserError> {
  let args = CliArgs::read()?;
  let paths = dir::RecursiveDirIterator::new(&args.dir)?.filter(|p| {
    let Some(ext) = p.extension().and_then(|n| n.to_str())
    else {
      return false;
    };
    matches!(ext, "js" | "jsx" | "ts" | "tsx")
  });

  let t = Instant::now();
  let mut parser = JsxParser::new()?;
  let mut source = Vec::new();
  let mut outbuf = Vec::new();
  let mut state = GlobalState::new(args.import_path);

  for path in paths {
    let mut file = fs::OpenOptions::new().read(true).write(true).open(&path)?;
    file.read_to_end(&mut source)?;

    let tree = parser.tree(&source)?;
    let matches = parser.parse(tree.root_node(), &source)?;

    let templates = matches
      .enumerate()
      .map(|(i, m)| JsxTemplate::parse(i, m.captures, &source))
      .collect::<Result<Box<_>, ParserError>>()?;

    let template_parts = templates
      .iter()
      .enumerate()
      .rev()
      .filter_map(|(i, template)| {
        (template.is_root
          && !templates.iter().rev().take(templates.len() - 1 - i).any(|t| {
            let range = t.start..t.end + 1;
            range.contains(&template.start) && range.contains(&template.end)
          }))
        .then_some(template.parts(&templates, &mut state).map(|parts| (template, parts)))
      })
      .collect::<Result<Box<_>, _>>()?;

    let mut src_idx = 0;
    if source.len() > outbuf.capacity() {
      outbuf.reserve(source.len() - outbuf.capacity());
    }
    outbuf.extend_from_slice(state.generate_setup_js(&templates)?.as_bytes());

    for (template, parts) in template_parts.iter().rev() {
      outbuf.extend_from_slice(&source[src_idx..template.start]);
      outbuf.extend_from_slice(parts.create_fn.as_bytes());
      src_idx = template.end;
    }

    if src_idx < source.len() {
      outbuf.extend_from_slice(&source[src_idx..]);
    }

    let outpath = args.outdir.join(path.strip_prefix(&args.dir).expect("path is not child of input dir"));
    fs::create_dir_all(outpath.parent().expect("no input dir"))?;
    fs::write(outpath, &outbuf)?;

    outbuf.clear();
    source.clear();
  }
  println!("// Done in {:?}", t.elapsed());

  Ok(())
}

#[derive(Debug)]
pub struct CliArgs {
  pub dir: String,
  pub import_path: Option<String>,
  pub outdir: PathBuf,
}

impl CliArgs {
  pub fn read() -> Result<Self, ParserError> {
    Ok(Self {
      dir: env::args().nth(1).ok_or(ParserError::MissingDir)?,
      import_path: Self::find_flag("-import"),
      outdir: PathBuf::from(Self::find_flag("-out").unwrap_or("build".into())),
    })
  }

  fn find_flag(name: &str) -> Option<String> {
    let mut found = false;
    env::args().find(|arg| {
      let ret = found;
      found = arg == name;
      ret
    })
  }
}
