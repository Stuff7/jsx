mod dir;
mod error;

use error::ParserError;
use std::{
  borrow::Cow,
  collections::HashSet,
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
  let mut global_events = HashSet::new();
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
        let parts = template.parts(&templates, &mut global_events)?;
        println!("{}\n\n{};\n\n", parts.imports, parts.create_fn);
      }
    }

    source.clear();
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

    let mut classes: Option<Vec<&str>> = None;
    let mut styles: Option<Vec<Box<str>>> = None;

    for prop in &self.props {
      if !is_static_kind(prop.kind) || prop.key.starts_with('$') {
        continue;
      }

      if prop.key.starts_with("class:") {
        let class = prop.key.trim_start_matches("class:");
        let classes = classes.get_or_insert_with(|| Vec::with_capacity(10));
        classes.push(class);
      }
      else if prop.key.starts_with("style:") {
        let property = prop.key.trim_start_matches("style:");
        let styles = styles.get_or_insert_with(|| Vec::with_capacity(16));
        styles.push(format!("{property}:{};", prop.value.unwrap()).into());
      }
      else if prop.key.starts_with("var:") {
        let custom_property = prop.key.trim_start_matches("var:");
        let styles = styles.get_or_insert_with(|| Vec::with_capacity(16));
        styles.push(format!("--{custom_property}:{};", prop.value.unwrap()).into());
      }
      else {
        write!(f, " {}", prop.key)?;
        if let Some(v) = prop.value {
          write!(f, "=\"{v}\"")?;
        }
      }
    }

    if let Some(classes) = classes.take() {
      write!(f, " class=\"{}\"", classes.join(" "))?;
    }
    if let Some(styles) = styles.take() {
      write!(f, " style=\"{}\"", styles.join(""))?;
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

  fn generate_component_call(&self, templates: &[JsxTemplate], global_events: &mut HashSet<Box<str>>) -> Result<String, ParserError> {
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
            replace_jsx(prop.node, templates, prop.value.unwrap(), global_events)?
          )?;
        }
        else if let Some(value) = prop.value {
          write!(f, "{}: {}, ", prop.key, replace_jsx(prop.node, templates, value, global_events)?)?;
        }
        else {
          write!(f, "{}: true, ", prop.key)?;
        }
      }
      write!(f, "}}")?;
    }

    if !self.children.is_empty() {
      write!(f, ", {{")?;
      let mut default_slot: Option<Vec<Cow<str>>> = None;
      for child in &self.children {
        if matches!(child.kind, "jsx_element" | "jsx_self_closing_element") {
          let Some(elem) = templates.iter().find(|t| *t == child)
          else {
            continue;
          };
          let Some(slot) = elem.props.iter().find(|p| p.key == "slot")
          else {
            let slot = default_slot.get_or_insert_with(|| Vec::with_capacity(10));
            slot.push(replace_jsx(child.node, templates, child.value, global_events)?);
            continue;
          };
          write!(
            f,
            "{}: {}, ",
            slot.value.unwrap(),
            replace_jsx(child.node, templates, child.value, global_events)?
          )?;
        }
        else if is_reactive_kind(child.kind) {
          let slot = default_slot.get_or_insert_with(|| Vec::with_capacity(10));
          slot.push(Cow::Owned(format!(
            "() => {}",
            replace_jsx(child.node, templates, child.value, global_events)?
          )));
        }
        else {
          let slot = default_slot.get_or_insert_with(|| Vec::with_capacity(10));
          slot.push(replace_jsx(child.node, templates, child.value, global_events)?);
        }
      }
      if let Some(slot) = default_slot {
        write!(f, "default: [{}]", slot.join(","))?;
      }
      write!(f, "}}")?;
    }
    write!(f, ")")?;

    Ok(f)
  }

  fn generate_fn(
    &self,
    var_idx: &mut usize,
    templates: &[JsxTemplate],
    global_events: &mut HashSet<Box<str>>,
  ) -> Result<(String, String, String), ParserError> {
    if self.is_component() {
      return Ok((self.generate_component_call(templates, global_events)?, String::new(), String::new()));
    }

    let mut globals = String::new();
    let mut elem_vars = String::new();
    let mut elem_setup = String::new();
    let mut var = format!("{VAR_PREF}el{}", *var_idx);

    if self.is_root {
      writeln!(elem_vars, "const {var} = {VAR_PREF}templ{}();", self.id)?;
    }

    for prop in &self.props {
      if is_static_kind(prop.kind) {
        continue;
      }

      let Some(value) = prop.value
      else {
        continue;
      };
      let value = replace_jsx(prop.node, templates, value, global_events)?;

      if let Some(event_name) = prop.key.strip_prefix("on:") {
        writeln!(elem_setup, "{var}.addEventListener(\"{event_name}\", {value});")?;
      }
      if let Some(event_name) = prop.key.strip_prefix("g:on") {
        let events_var = format!("{VAR_PREF}global_event_{event_name}");
        if global_events.insert(event_name.into()) {
          writeln!(globals, "window.{events_var} = {VAR_PREF}createGlobalEvent(\"{event_name}\");")?;
        }
        writeln!(
          elem_setup,
          "{VAR_PREF}addGlobalEvent(window.{events_var}, {var}, \"{event_name}\", {value});"
        )?;
      }
      else if prop.key.starts_with("class:") {
        let class = prop.key.trim_start_matches("class:");
        writeln!(
          elem_setup,
          "{VAR_PREF}trackClass({var}, \"{class}\", {});",
          wrap_reactive_value(prop.kind, &value)
        )?;
      }
      else if prop.key.starts_with("style:") {
        let property = prop.key.trim_start_matches("style:");
        writeln!(
          elem_setup,
          "{VAR_PREF}trackCssProperty({var}, \"{property}\", {});",
          wrap_reactive_value(prop.kind, &value)
        )?;
      }
      else if prop.key.starts_with("var:") {
        let custom_property = prop.key.trim_start_matches("var:");
        writeln!(
          elem_setup,
          "{VAR_PREF}trackCssProperty({var}, \"--{custom_property}\", {});",
          wrap_reactive_value(prop.kind, &value)
        )?;
      }
      else if prop.key == "$ref" {
        writeln!(elem_setup, "{value} = {var};")?;
      }
      else {
        writeln!(
          elem_setup,
          "{VAR_PREF}trackAttribute({var}, \"{}\", {});",
          prop.key,
          wrap_reactive_value(prop.kind, &value)
        )?;
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
            writeln!(
              elem_setup,
              "{VAR_PREF}insertChild({}, {var});",
              elem.generate_component_call(templates, global_events)?
            )?;
          }
          else if elem.tag == "slot" {
            let name = elem
              .props
              .iter()
              .find_map(|p| (p.key == "name").then(|| p.value.unwrap()))
              .unwrap_or("default");
            writeln!(elem_setup, "{VAR_PREF}insertChild($$slots[\"{name}\"], {var})")?;
          }
          else {
            let (vars, setup, g) = elem.generate_fn(var_idx, templates, global_events)?;
            write!(elem_vars, "{}", vars)?;
            write!(elem_setup, "{}", setup)?;
            write!(globals, "{}", g)?;
          }
        }
        "jsx_expression" => {
          let value = replace_jsx(child.node, templates, child.value, global_events)?;
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

    Ok((elem_vars, elem_setup, globals))
  }

  fn parts(&self, templates: &[JsxTemplate], global_events: &mut HashSet<Box<str>>) -> Result<TemplateParts, ParserError> {
    let mut var_idx = 0;
    let mut ret = TemplateParts {
      imports: String::new(),
      create_fn: String::new(),
    };
    let templ = self.generate_template_string(templates)?;
    let (elem_vars, elem_hooks, globals) = self.generate_fn(&mut var_idx, templates, global_events)?;

    write!(
      ret.imports,
      "const {VAR_PREF}templ{} = {VAR_PREF}template(`{templ}`);\n{globals}",
      self.id
    )?;

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

fn is_static_kind(kind: &str) -> bool {
  matches!(
    kind,
    "string_fragment" | "number" | "property_identifier" | "jsx_namespace_name" | "false" | "true"
  )
}

fn wrap_reactive_value<'a>(kind: &str, value: &'a str) -> Cow<'a, str> {
  if is_reactive_kind(kind) {
    Cow::Owned(format!("() => {value}"))
  }
  else {
    Cow::Borrowed(value)
  }
}

fn replace_jsx<'a>(
  node: Node<'_>,
  templates: &[JsxTemplate],
  value: &'a str,
  global_events: &mut HashSet<Box<str>>,
) -> Result<Cow<'a, str>, ParserError> {
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
    let parts = elem.parts(templates, global_events)?;
    v.replace_range(elem.start - range.start..elem.end - range.start, &parts.create_fn);
  }

  Ok(if let Some(v) = v { Cow::Owned(v) } else { Cow::Borrowed(value) })
}
