mod gen;
mod gen_tests;
mod html_entities;
mod utils;
mod utils_tests;

use crate::error::ParserError;
use std::fmt::{Debug, Write};
use tree_sitter::{Language, Node, Parser, Query, QueryCapture, QueryCursor, QueryMatches, Tree};
pub use utils::GlobalState;
use utils::{is_jsx_element, is_reactive_kind, is_void_element};

pub const VAR_PREF: &str = "_jsx$";
const Q_JSX_TEMPLATE: &str = include_str!("../../queries/jsx_template.scm");

pub struct JsxParser {
  parser: Parser,
  query: Query,
  cursor: QueryCursor,
}

impl JsxParser {
  pub fn new() -> Result<Self, ParserError> {
    let javascript: Language = tree_sitter_javascript::LANGUAGE.into();
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

#[derive(Debug, Default)]
pub struct JsxTemplate<'a> {
  id: usize,
  pub start: usize,
  pub end: usize,
  tag: &'a str,
  is_self_closing: bool,
  pub is_root: bool,
  conditional: Option<Prop<'a>>,
  transition: Option<(Box<str>, Prop<'a>)>,
  props: Vec<Prop<'a>>,
  children: Vec<Child<'a>>,
}

impl<'a> JsxTemplate<'a> {
  fn is_component(&self) -> bool {
    self.tag.chars().next().is_some_and(|c| c.is_ascii_uppercase())
  }

  pub fn source<'b>(&self, source: &'b [u8]) -> Result<&'b str, ParserError> {
    Ok(std::str::from_utf8(&source[self.start..self.end])?)
  }

  pub fn parse(id: usize, captures: &'a [QueryCapture<'a>], source: &'a [u8]) -> Result<Self, ParserError> {
    enum CaptureIdx {
      Tag,
      Key,
      Value,
      Children,
      Element,
    }

    let mut ret = Self::default();

    for cap in captures {
      match cap.index {
        x if x == CaptureIdx::Tag as u32 => {
          ret.tag = cap.node.utf8_text(source)?;
          if ret.is_self_closing {
            ret.is_self_closing = is_void_element(ret.tag);
          }
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
          let (is_conditional, transition) = if let Some(p) = ret.props.last_mut() {
            p.kind = cap.node.kind();
            p.value = Some(cap.node.utf8_text(source)?);
            p.node = cap.node;
            (
              p.key == "$if",
              p.key.strip_prefix("$transition").map(|t| t.strip_prefix(':').unwrap_or("jsx")),
            )
          }
          else {
            (false, None)
          };

          if is_conditional {
            ret.conditional = ret.props.pop();
          }
          else if let Some(transition_name) = transition {
            ret.transition = ret.props.pop().map(|prop| (transition_name.into(), prop));
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

    if ret.tag.is_empty() {
      ret.tag = "template";
    }

    Ok(ret)
  }

  fn write_fn(&self, ret: &mut TemplateParts, var_idx: &mut usize, templates: &[JsxTemplate], state: &mut GlobalState) -> Result<(), ParserError> {
    let (elem_vars, elem_hooks) = self.generate_fn(var_idx, templates, state)?;
    write!(ret.create_fn, "(() => {{\n{elem_vars}\n{elem_hooks}\nreturn {VAR_PREF}el0;\n}})()")?;

    Ok(())
  }

  pub fn parts(&self, templates: &[JsxTemplate], state: &mut GlobalState) -> Result<TemplateParts, ParserError> {
    let mut ret = TemplateParts { create_fn: String::new() };

    if self.tag == "template" {
      write!(ret.create_fn, "[")?;
      let mut idx = 0;
      while let Some(c) = self.children.get(idx) {
        state.is_template_child = is_jsx_element(c.kind);
        let Some(value) = self.child_as_value(&mut idx, c, templates, state)?
        else {
          continue;
        };

        if is_reactive_kind(c.kind) {
          write!(ret.create_fn, "() => {value}, ")?;
        }
        else {
          write!(ret.create_fn, "{value}, ")?;
        }
      }
      writeln!(ret.create_fn, "]")?;
    }
    else {
      let mut var_idx = 0;
      self.write_fn(&mut ret, &mut var_idx, templates, state)?;
    }

    Ok(ret)
  }
}
