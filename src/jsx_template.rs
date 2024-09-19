mod dir;
mod error;

use error::ParserError;
use std::{
  fmt::Debug,
  fs::{self},
  io::Read,
  path::PathBuf,
};
use tree_sitter::{Parser, Query, QueryCapture, QueryCursor, QueryMatches, Tree};

fn main() -> Result<(), ParserError> {
  let path = std::env::args().nth(1).ok_or(ParserError::MissingDir)?;
  let paths = dir::RecursiveDirIterator::new(path)?.filter(|p| p.extension().is_some_and(|n| n == "js"));
  parse(paths)?;

  Ok(())
}

struct JsxParser {
  parser: Parser,
  query: Query,
  cursor: QueryCursor,
}

impl JsxParser {
  fn new() -> Result<Self, ParserError> {
    let javascript = tree_sitter_javascript::language();
    let mut parser = Parser::new();
    parser.set_language(&javascript)?;

    Ok(Self {
      parser,
      query: Query::new(&javascript, Q_JSX_TEMPLATE)?,
      cursor: QueryCursor::new(),
    })
  }

  fn tree<'a>(&'a mut self, source: &'a [u8]) -> Result<Tree, ParserError> {
    self.parser.parse(source, None).ok_or(ParserError::Parse)
  }

  fn parse<'a>(&'a mut self, tree: &'a Tree, source: &'a [u8]) -> Result<QueryMatches<&'a [u8], &'a [u8]>, ParserError> {
    Ok(self.cursor.matches(&self.query, tree.root_node(), source))
  }
}

pub fn parse<I: Iterator<Item = PathBuf>>(paths: I) -> Result<(), ParserError> {
  let mut parser = JsxParser::new()?;
  let mut source = Vec::new();
  let paths: Box<[_]> = paths.collect();

  for path in paths.iter() {
    let mut file = fs::OpenOptions::new().read(true).write(true).open(path)?;
    file.read_to_end(&mut source)?;

    let tree = parser.tree(&source)?;
    let matches = parser.parse(&tree, &source)?;

    let templates = matches
      .map(|m| JsxTemplate::parse(m.captures, &source))
      .collect::<Result<Vec<_>, ParserError>>()?;

    for template in &templates {
      if template.is_root {
        println!("{}", template.to_string(&templates)?);
        println!("{template:#?}\n\n");
      }
    }
  }

  Ok(())
}

const Q_JSX_TEMPLATE: &str = include_str!("../queries/jsx_template.scm");

#[derive(Debug)]
struct Prop<'a> {
  kind: &'a str,
  key: &'a str,
  value: Option<&'a str>,
}

#[derive(Debug)]
struct Child<'a> {
  start: usize,
  end: usize,
  kind: &'a str,
  value: &'a str,
}

#[derive(Debug)]
struct JsxTemplate<'a> {
  start: usize,
  end: usize,
  tag: &'a str,
  is_self_closing: bool,
  is_root: bool,
  props: Vec<Prop<'a>>,
  children: Vec<Child<'a>>,
}

impl<'a> JsxTemplate<'a> {
  fn parse(captures: &'a [QueryCapture<'a>], source: &'a [u8]) -> Result<Self, ParserError> {
    enum CaptureIdx {
      Tag,
      Key,
      Value,
      Children,
      Element,
    }

    let mut ret = Self {
      start: 0,
      end: 0,
      tag: "",
      is_self_closing: false,
      is_root: false,
      props: Vec::new(),
      children: Vec::new(),
    };

    for cap in captures {
      match cap.index {
        x if x == CaptureIdx::Tag as u32 => {
          ret.tag = cap.node.utf8_text(source)?;
        }
        x if x == CaptureIdx::Key as u32 => {
          ret.props.push(Prop {
            kind: cap.node.kind(),
            key: cap.node.utf8_text(source)?,
            value: None,
          });
        }
        x if x == CaptureIdx::Value as u32 => {
          if let Some(p) = ret.props.last_mut() {
            p.kind = cap.node.kind();
            p.value = Some(cap.node.utf8_text(source)?);
          }
        }
        x if x == CaptureIdx::Children as u32 => ret.children.push(Child {
          start: cap.node.start_byte(),
          end: cap.node.end_byte(),
          kind: cap.node.kind(),
          value: cap.node.utf8_text(source)?,
        }),
        x if x == CaptureIdx::Element as u32 => {
          ret.start = cap.node.start_byte();
          ret.end = cap.node.end_byte();
          ret.is_self_closing = cap.node.kind() == "jsx_self_closing_element";
          ret.is_root = !cap
            .node
            .parent()
            .is_some_and(|n| matches!(n.kind(), "jsx_element" | "jsx_self_closing_element"));
        }
        _ => (),
      }
    }

    Ok(ret)
  }

  fn to_string(&self, templates: &[JsxTemplate]) -> Result<String, ParserError> {
    use std::fmt::Write;
    let mut f = String::new();
    write!(f, "<{}", self.tag)?;

    for prop in &self.props {
      if !matches!(prop.kind, "string_fragment" | "number" | "property_identifier" | "false" | "true")
        || prop.key.starts_with('$')
        || prop.key.contains(':')
      {
        continue;
      }
      write!(f, " {}", prop.key)?;
      if let Some(v) = prop.value {
        write!(f, "=\"{v}\"")?;
      }
    }

    if self.is_self_closing {
      write!(f, "/>")?;
      return Ok(f);
    }

    write!(f, ">")?;
    for child in &self.children {
      match child.kind {
        "jsx_self_closing_element" | "jsx_element" => {
          let Some(elem) = templates.iter().find(|t| *t == child)
          else {
            continue;
          };

          if elem.tag.chars().next().is_some_and(|c| c.is_ascii_uppercase()) {
            write!(f, "<!>")?;
          }
          else {
            write!(f, "{}", elem.to_string(templates)?)?;
          }

          continue;
        }
        "jsx_text" => write!(f, "{}", child.value)?,
        _ => write!(f, "<!>")?,
      }
    }
    write!(f, "</{}>", self.tag)?;

    Ok(f)
  }
}

impl<'a> PartialEq<Child<'a>> for JsxTemplate<'a> {
  fn eq(&self, other: &Child) -> bool {
    other.start == self.start && other.end == self.end
  }
}
