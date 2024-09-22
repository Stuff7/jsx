mod gen;
mod utils;

use crate::error::ParserError;
use std::fmt::{Debug, Write};
use tree_sitter::{Node, Parser, Query, QueryCapture, QueryCursor, QueryMatches, Tree};
pub use utils::GlobalState;

pub const VAR_PREF: &str = "_jsx$";
const Q_JSX_TEMPLATE: &str = include_str!("../../queries/jsx_template.scm");

pub struct JsxParser {
  parser: Parser,
  query: Query,
  cursor: QueryCursor,
}

impl JsxParser {
  pub fn new() -> Result<Self, ParserError> {
    let javascript = tree_sitter_javascript::language();
    let mut parser = Parser::new();
    parser.set_language(&javascript)?;

    Ok(Self {
      parser,
      query: Query::new(&javascript, Q_JSX_TEMPLATE)?,
      cursor: QueryCursor::new(),
    })
  }

  pub fn tree<'a>(&'a mut self, source: &'a [u8]) -> Result<Tree, ParserError> {
    self.parser.parse(source, None).ok_or(ParserError::Parse)
  }

  pub fn parse<'a>(&'a mut self, node: Node<'a>, source: &'a [u8]) -> Result<QueryMatches<&'a [u8], &'a [u8]>, ParserError> {
    Ok(self.cursor.matches(&self.query, node, source))
  }
}

#[derive(Debug)]
pub struct TemplateParts {
  pub imports: String,
  pub create_fn: String,
}

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

impl<'a> PartialEq<Child<'a>> for JsxTemplate<'a> {
  fn eq(&self, other: &Child) -> bool {
    other.start == self.start && other.end == self.end
  }
}

#[derive(Debug)]
pub struct JsxTemplate<'a> {
  id: usize,
  pub start: usize,
  pub end: usize,
  tag: &'a str,
  is_self_closing: bool,
  pub is_root: bool,
  props: Vec<Prop<'a>>,
  children: Vec<Child<'a>>,
}

impl<'a> JsxTemplate<'a> {
  fn is_component(&self) -> bool {
    self.tag.chars().next().is_some_and(|c| c.is_ascii_uppercase())
  }

  pub fn parse(id: usize, captures: &'a [QueryCapture<'a>], source: &'a [u8]) -> Result<Self, ParserError> {
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
            cap
              .node
              .named_child(0)
              .ok_or_else(|| ParserError::empty_jsx_expression(cap.node))?
              .utf8_text(source)?
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

  pub fn parts(&self, templates: &[JsxTemplate], state: &mut GlobalState) -> Result<TemplateParts, ParserError> {
    let mut var_idx = 0;
    let mut ret = TemplateParts {
      imports: String::new(),
      create_fn: String::new(),
    };
    let templ = self.generate_template_string(templates)?;
    let (elem_vars, elem_hooks, globals) = self.generate_fn(&mut var_idx, templates, state)?;

    state.imports.insert("template");
    write!(
      ret.imports,
      "const {VAR_PREF}templ{} = {VAR_PREF}template(`{templ}`);\n{globals}",
      self.id
    )?;

    write!(ret.create_fn, "(() => {{\n{elem_vars}\n{elem_hooks}\nreturn {VAR_PREF}el0;\n}})()",)?;

    Ok(ret)
  }
}
