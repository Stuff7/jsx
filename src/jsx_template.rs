mod dir;
mod error;
mod jsx_parser;

use error::ParserError;
use jsx_parser::{GlobalState, JsParser, JsxTemplate};
use std::{env, fs, io::Read, path::PathBuf, time::Instant};

fn main() -> Result<(), ParserError> {
  let args = CliArgs::read()?;
  let paths = dir::RecursiveDirIterator::new(&args.dir)?.filter(|p| {
    let Some(ext) = p.extension().and_then(|n| n.to_str()) else {
      return false;
    };
    matches!(ext, "js" | "jsx" | "ts" | "tsx")
  });

  let t = Instant::now();

  let mut directive_parser = JsParser::from_query(jsx_parser::Q_COMMENT_DIRECTIVE)?;
  let mut file_buf = Vec::new();
  let mut parsed_buf = Vec::new();

  let mut jsx_parser = JsParser::from_query(jsx_parser::Q_JSX_TEMPLATE)?;
  let mut outbuf = Vec::new();
  let mut state = GlobalState::new(args.import_path);

  for path in paths {
    let source = if args.comment_directives {
      directive_parser.parse_comment_directives(&path, &args.dir, &mut file_buf, &mut parsed_buf)?
    } else {
      let mut file = fs::OpenOptions::new().read(true).write(true).open(&path)?;
      file.read_to_end(&mut file_buf)?;
      &file_buf
    };

    let tree = jsx_parser.tree(source)?;
    let matches = jsx_parser.parse(tree.root_node(), source)?;

    let templates = matches
      .enumerate()
      .map(|(i, m)| JsxTemplate::parse(i, m.captures, source))
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
        .then_some(
          template
            .parts(&templates, &mut state)
            .map(|parts| (template, parts)),
        )
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

    let outpath = args.outdir.join(
      path
        .strip_prefix(&args.dir)
        .expect("path is not child of input dir"),
    );
    fs::create_dir_all(outpath.parent().expect("no input dir"))?;
    fs::write(outpath, &outbuf)?;

    outbuf.clear();
    file_buf.clear();
    parsed_buf.clear();
  }

  println!(
    "\x1b[38;5;159m\x1b[1m  JSX\x1b[22m compiled in \x1b[1m\x1b[38;5;157m{:?}\x1b[0m",
    t.elapsed()
  );

  Ok(())
}

#[derive(Debug)]
pub struct CliArgs {
  pub dir: PathBuf,
  pub import_path: Option<String>,
  pub outdir: PathBuf,
  pub comment_directives: bool,
}

impl CliArgs {
  pub fn read() -> Result<Self, ParserError> {
    Ok(Self {
      dir: PathBuf::from(env::args().nth(1).ok_or(ParserError::MissingDir)?),
      import_path: Self::find_flag("-import"),
      outdir: PathBuf::from(Self::find_flag("-out").unwrap_or("build".into())),
      comment_directives: env::args().any(|arg| arg == "-comment-directives"),
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
