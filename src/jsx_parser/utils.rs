use super::{Child, VAR_PREF};
use crate::{error::ParserError, jsx_parser::JsxTemplate};
use std::{borrow::Cow, collections::HashSet, fmt::Write};
use tree_sitter::Node;

pub(super) fn is_reactive_kind(kind: &str) -> bool {
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

pub(super) fn is_static_kind(kind: &str) -> bool {
  matches!(
    kind,
    "string_fragment" | "number" | "property_identifier" | "jsx_namespace_name" | "false" | "true"
  )
}

pub(super) fn wrap_reactive_value<'a>(kind: &str, value: &'a str) -> Cow<'a, str> {
  if is_reactive_kind(kind) {
    Cow::Owned(format!("() => {value}"))
  }
  else {
    Cow::Borrowed(value)
  }
}

#[derive(Default)]
pub struct GlobalState {
  pub(super) events: HashSet<Box<str>>,
  pub(super) imports: HashSet<&'static str>,
  pub(super) templates: HashSet<usize>,
  pub(super) is_component_child: bool,
}

impl GlobalState {
  pub fn generate_setup_js(&mut self, templates: &[JsxTemplate]) -> Result<String, ParserError> {
    let mut setup = String::with_capacity(self.imports.len() * 128);
    for import in &self.imports {
      writeln!(setup, "import {{ {import} as {VAR_PREF}{import} }} from \"jsx/runtime\";")?;
    }
    writeln!(setup)?;
    self.imports.clear();

    for templ_id in &self.templates {
      let templ = templates[*templ_id].generate_template_string(templates)?;
      writeln!(setup, "const {VAR_PREF}templ{} = {VAR_PREF}template(`{templ}`);", templ_id)?;
    }
    writeln!(setup)?;
    self.templates.clear();

    for event in &self.events {
      let var = generate_event_var(event);
      writeln!(setup, "window.{var} = {VAR_PREF}createGlobalEvent(\"{event}\");")?;
    }

    Ok(setup)
  }
}

pub(super) fn generate_event_var(event_name: &str) -> String {
  format!("{VAR_PREF}global_event_{event_name}")
}

pub(super) fn escape_jsx_text(children: &[Child], idx: &mut usize) -> Result<String, ParserError> {
  let mut text = format!("\"{}", children[*idx].value.trim_start());
  *idx += 1;

  while let Some(child) = children.get(*idx) {
    match child.kind {
      "jsx_text" => {
        write!(text, "{}", child.value.replace('"', r#"\""#))?;
      }
      "html_character_reference" => {
        match child.value {
          "&nbsp;" => write!(text, "\\xA0"),
          "&lt;" => write!(text, "<"),
          "&gt;" => write!(text, ">"),
          "&#39;" => write!(text, "`"),
          "&quot;" => write!(text, "\\\""),
          "&amp;" => write!(text, "&"),
          v => write!(text, "{v}"),
        }?;
      }
      _ => break,
    }
    *idx += 1;
  }

  text.truncate(text.trim_end().len());
  write!(text, "\"")?;

  Ok(text)
}

pub(super) fn is_jsx_text(kind: &str) -> bool {
  matches!(kind, "jsx_text" | "html_character_reference")
}

pub(super) fn is_jsx_element(kind: &str) -> bool {
  matches!(kind, "jsx_element" | "jsx_self_closing_element")
}

pub(super) fn replace_jsx<'a>(
  node: Node<'_>,
  templates: &[JsxTemplate],
  value: &'a str,
  state: &mut GlobalState,
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
    let parts = elem.parts(templates, state)?;
    v.replace_range(elem.start - range.start..elem.end - range.start, &parts.create_fn);
  }

  Ok(if let Some(v) = v { Cow::Owned(v) } else { Cow::Borrowed(value) })
}
