mod dir;
mod error;

use error::ParserError;
use std::{
  borrow::Cow,
  fmt::{Debug, Write},
  fs::{self},
  io::Read,
  path::PathBuf,
};
use tree_sitter::{Node, Parser, Query, QueryCapture, QueryCursor, QueryMatches, Tree};

fn main() -> Result<(), ParserError> {
  let path = std::env::args().nth(1).ok_or(ParserError::MissingDir)?;
  let paths =
    dir::RecursiveDirIterator::new(path)?.filter(|p| p.extension().is_some_and(|n| matches!(n.to_str().unwrap(), "js" | "jsx" | "ts" | "tsx")));
  parse(paths)?;

  Ok(())
}

pub fn parse<I: Iterator<Item = PathBuf>>(paths: I) -> Result<(), ParserError> {
  let mut parser = JsxParser::new()?;
  let mut source = Vec::new();
  let paths: Box<[_]> = paths.collect();

  for path in paths.iter() {
    let mut file = fs::OpenOptions::new().read(true).write(true).open(path)?;
    file.read_to_end(&mut source)?;

    let tree = parser.tree(&source)?;
    let matches = parser.parse(tree.root_node(), &source)?;

    let templates = matches
      .enumerate()
      .map(|(i, m)| JsxTemplate::parse(i, m.captures, &source))
      .collect::<Result<Vec<_>, ParserError>>()?;

    for template in &templates {
      if template.is_root {
        println!("====================================================");
        let parts = template.parts(&templates)?;
        println!("{};\n\n{};\n\n", parts.imports, parts.create_fn);
      }
    }
  }

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

  fn parse<'a>(&'a mut self, node: Node<'a>, source: &'a [u8]) -> Result<QueryMatches<&'a [u8], &'a [u8]>, ParserError> {
    Ok(self.cursor.matches(&self.query, node, source))
  }
}

const VAR_PREF: &str = "_jsx$";
const Q_JSX_TEMPLATE: &str = include_str!("../queries/jsx_template.scm");

#[derive(Debug)]
struct Prop<'a> {
  kind: &'a str,
  key: &'a str,
  value: Option<&'a str>,
  node: Node<'a>,
}

#[derive(Debug)]
struct Child<'a> {
  start: usize,
  end: usize,
  kind: &'a str,
  value: &'a str,
  node: Node<'a>,
}

#[derive(Debug)]
struct JsxTemplate<'a> {
  id: usize,
  start: usize,
  end: usize,
  tag: &'a str,
  is_self_closing: bool,
  is_root: bool,
  props: Vec<Prop<'a>>,
  children: Vec<Child<'a>>,
}

impl<'a> JsxTemplate<'a> {
  fn is_component(&self) -> bool {
    self.tag.chars().next().is_some_and(|c| c.is_ascii_uppercase())
  }

  fn parse(id: usize, captures: &'a [QueryCapture<'a>], source: &'a [u8]) -> Result<Self, ParserError> {
    enum CaptureIdx {
      Tag,
      Key,
      Value,
      Children,
      Element,
    }

    let mut ret = Self {
      id: 0,
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
            node: cap.node,
          });
        }
        x if x == CaptureIdx::Value as u32 => {
          if let Some(p) = ret.props.last_mut() {
            p.kind = cap.node.kind();
            p.value = Some(cap.node.utf8_text(source)?);
            p.node = cap.node;
          }
        }
        x if x == CaptureIdx::Children as u32 => ret.children.push(Child {
          start: cap.node.start_byte(),
          end: cap.node.end_byte(),
          kind: cap.node.kind(),
          value: if cap.node.kind() == "jsx_expression" {
            cap.node.named_child(0).unwrap().utf8_text(source)?
          }
          else {
            cap.node.utf8_text(source)?
          },
          node: cap.node,
        }),
        x if x == CaptureIdx::Element as u32 => {
          ret.start = cap.node.start_byte();
          ret.end = cap.node.end_byte();
          ret.is_self_closing = cap.node.kind() == "jsx_self_closing_element";
          ret.is_root = !cap
            .node
            .parent()
            .is_some_and(|n| matches!(n.kind(), "jsx_element" | "jsx_self_closing_element"));
          ret.id = id;
        }
        _ => (),
      }
    }

    Ok(ret)
  }

  fn generate_template_string(&self, templates: &[JsxTemplate]) -> Result<String, ParserError> {
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

    let mut first_txt = false;
    write!(f, ">")?;
    for child in &self.children {
      match child.kind {
        "jsx_self_closing_element" | "jsx_element" => {
          let Some(elem) = templates.iter().find(|t| *t == child)
          else {
            continue;
          };

          if elem.is_component() {
            write!(f, "<!>")?;
          }
          else {
            write!(f, "{}", elem.generate_template_string(templates)?)?;
          }
        }
        "jsx_text" => {
          if first_txt {
            write!(f, "{}", child.value)?
          }
          else {
            first_txt = true;
            write!(f, "{}", child.value.trim_start())?
          }
        }
        _ => write!(f, "<!>")?,
      }
    }
    write!(f, "</{}>", self.tag)?;

    Ok(f)
  }

  fn generate_component_call(&self, templates: &[JsxTemplate]) -> Result<String, ParserError> {
    let mut f = format!("{}(", self.tag);

    if self.props.is_empty() {
      write!(f, "null")?;
    }
    else {
      write!(f, "{{")?;
      for prop in &self.props {
        if prop.kind == "string_fragment" {
          write!(f, "{}: \"{}\", ", prop.key, prop.value.unwrap())?;
        }
        else if is_reactive_kind(prop.kind) {
          write!(
            f,
            "get {}() {{ return {} }}, ",
            prop.key,
            replace_jsx(prop.node, templates, prop.value.unwrap())?
          )?;
        }
        else if let Some(value) = prop.value {
          write!(f, "{}: {}, ", prop.key, replace_jsx(prop.node, templates, value)?)?;
        }
        else {
          write!(f, "{}: true, ", prop.key)?;
        }
      }
      write!(f, "}}")?;
    }

    for child in &self.children {
      if is_reactive_kind(child.kind) {
        write!(f, ", () => {}", replace_jsx(child.node, templates, child.value)?)?;
      }
      else {
        write!(f, ", {}", replace_jsx(child.node, templates, child.value)?)?;
      }
    }
    write!(f, ")")?;

    Ok(f)
  }

  fn generate_fn(&self, var_idx: &mut usize, templates: &[JsxTemplate]) -> Result<(String, String), ParserError> {
    if self.is_component() {
      return Ok((self.generate_component_call(templates)?, String::new()));
    }

    let mut elem_vars = String::new();
    let mut elem_setup = String::new();
    let mut var = format!("{VAR_PREF}el{}", *var_idx);

    if self.is_root {
      writeln!(elem_vars, "const {var} = {VAR_PREF}templ{}();", self.id)?;
    }

    for prop in &self.props {
      let Some(value) = prop.value
      else {
        continue;
      };
      let value = replace_jsx(prop.node, templates, value)?;

      if let Some(event_name) = prop.key.strip_prefix("on:") {
        writeln!(elem_setup, "{var}.addEventListener(\"{event_name}\", {value});")?;
      }
      else if prop.key == "$ref" {
        writeln!(elem_setup, "{value} = {var};")?;
      }
      else if !matches!(prop.kind, "string_fragment" | "number" | "property_identifier" | "false" | "true") {
        if is_reactive_kind(prop.kind) {
          writeln!(elem_setup, "{VAR_PREF}watchAttribute({var}, \"{}\", () => {value});", prop.key)?;
        }
        else {
          writeln!(elem_setup, "{VAR_PREF}watchAttribute({var}, \"{}\", {value});", prop.key)?;
        }
      }
    }

    let mut first = true;
    for child in &self.children {
      *var_idx += 1;
      let prev_var = var;
      var = format!("{VAR_PREF}el{}", *var_idx);

      if first {
        first = false;
        writeln!(elem_vars, "const {var} = {prev_var}.firstChild; // {}", child.kind)?;
      }
      else {
        writeln!(elem_vars, "const {var} = {prev_var}.nextSibling; // {}", child.kind)?;
      }

      match child.kind {
        "jsx_element" | "jsx_self_closing_element" => {
          let Some(elem) = templates.iter().find(|t| *t == child)
          else {
            continue;
          };

          if elem.is_component() {
            writeln!(elem_setup, "{VAR_PREF}insertChild({}, {var});", elem.generate_component_call(templates)?)?;
          }
          else {
            let (vars, setup) = elem.generate_fn(var_idx, templates)?;
            write!(elem_vars, "{}", vars)?;
            write!(elem_setup, "{}", setup)?;
          }
        }
        "jsx_expression" => {
          let value = replace_jsx(child.node, templates, child.value)?;
          if is_reactive_kind(child.node.named_child(0).unwrap().kind()) {
            writeln!(elem_setup, "{VAR_PREF}insertChild(() => {}, {var});", value)?;
          }
          else {
            writeln!(elem_setup, "{VAR_PREF}insertChild({}, {var});", value)?;
          }
        }
        _ => (),
      }
    }

    Ok((elem_vars, elem_setup))
  }

  fn parts(&self, templates: &[JsxTemplate]) -> Result<TemplateParts, ParserError> {
    let mut var_idx = 0;
    let mut ret = TemplateParts {
      imports: String::new(),
      create_fn: String::new(),
    };

    write!(
      ret.imports,
      "const {VAR_PREF}templ{} = {VAR_PREF}template(`{}`)",
      self.id,
      self.generate_template_string(templates)?
    )?;

    let (elem_vars, elem_hooks) = self.generate_fn(&mut var_idx, templates)?;

    write!(ret.create_fn, "(() => {{\n{elem_vars}\n{elem_hooks}\nreturn {VAR_PREF}el0;\n}})()",)?;

    Ok(ret)
  }
}

impl<'a> PartialEq<Child<'a>> for JsxTemplate<'a> {
  fn eq(&self, other: &Child) -> bool {
    other.start == self.start && other.end == self.end
  }
}

#[derive(Debug)]
struct TemplateParts {
  imports: String,
  create_fn: String,
}

fn is_reactive_kind(kind: &str) -> bool {
  matches!(
    kind,
    "identifier"
      | "member_expression"
      | "subscript_expression"
      | "template_string"
      | "ternary_expression"
      | "update_expression"
      | "unary_expression"
      | "binary_expression"
      | "parenthesized_expression"
      | "object"
      | "array"
      | "call_expression"
  )
}

fn replace_jsx<'a>(node: Node<'_>, templates: &[JsxTemplate], value: &'a str) -> Result<Cow<'a, str>, ParserError> {
  let range = node.start_byte()..node.end_byte() + 1;
  let mut ranges: Vec<std::ops::Range<usize>> = Vec::new();
  let elems = templates
    .iter()
    .rev()
    .filter(|t| range.contains(&t.start) && range.contains(&t.end))
    .filter(|t| {
      let ret = !ranges.iter().any(|r| r.contains(&t.start) && r.contains(&t.end));
      ranges.push(t.start..t.end + 1);
      ret
    });

  let mut v = None;
  for elem in elems {
    let v = v.get_or_insert_with(|| value.to_string());
    let parts = elem.parts(templates)?;
    v.replace_range(elem.start - range.start..elem.end - range.start, &parts.create_fn);
  }

  Ok(if let Some(v) = v { Cow::Owned(v) } else { Cow::Borrowed(value) })
}
