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
  let mut text = String::from("\"");

  let prev_child = (*idx > 0).then(|| children.get(*idx - 1)).flatten();
  while let Some(child) = children.get(*idx) {
    match child.kind {
      "jsx_text" => {
        write!(text, "{} ", child.value.replace('"', r#"\""#))?;
      }
      "html_character_reference" => {
        match child.value {
          "&nbsp;" => write!(text, "\\xA0 "),
          "&lt;" => write!(text, "< "),
          "&gt;" => write!(text, "> "),
          "&#39;" => write!(text, "` "),
          "&quot;" => write!(text, "\\\" "),
          "&amp;" => write!(text, "& "),
          v => write!(text, "{v} "),
        }?;
      }
      _ => break,
    }
    *idx += 1;
  }
  let next_child = children.get(*idx);

  let mut append_space = false;
  let len = {
    let start = if prev_child.is_some_and(|c| is_jsx_element(c.kind)) && text.as_bytes().get(1).is_some_and(|b| *b == b' ') {
      2
    }
    else {
      1
    };

    if next_child.is_some_and(|c| is_jsx_element(c.kind)) {
      let bytes = children[*idx - 1].value.as_bytes();
      append_space = match bytes.iter().rposition(|b| !b.is_ascii_whitespace()) {
        Some(pos) => bytes.get(pos + 1),
        None => bytes.first(),
      }
      .is_some_and(|b| *b == b' ');
    }

    remove_whitespace(&mut text[start..]) + start
  };

  text.truncate(len);
  if append_space {
    write!(text, " \"")?;
  }
  else {
    write!(text, "\"")?;
  }

  Ok(text)
}

pub(super) fn remove_whitespace(s: &mut str) -> usize {
  enum Step {
    Start,
    Space,
    Alpha,
  }

  let mut step = Step::Start;
  let mut a = 0;
  let mut w = 0;
  let mut n = 0;
  let mut len = s.len();

  unsafe {
    let s = s.as_bytes_mut();
    let mut i = 0;

    while let Some(byte) = s.get(i) {
      if byte.is_ascii_whitespace() {
        if matches!(step, Step::Alpha) {
          w = usize::saturating_sub(w, 1);
          s.copy_within(a..i, n);
          n += i - a;
          len -= w;
          w = 0;
        }

        w += 1;
        step = Step::Space;
      }
      else {
        match step {
          Step::Start => {
            n += 1;
          }
          Step::Space => {
            if n == 0 {
              a = i;
              w += 1;
            }
            else {
              a = i - 1;
              s[a] = b' ';
            };
            step = Step::Alpha;
          }
          Step::Alpha => {
            step = Step::Alpha;
          }
        }
      }

      i += 1;
    }

    if !matches!(step, Step::Start) {
      w = usize::saturating_sub(w, 1);

      if a != 0 {
        s.copy_within(a..i, n);
      }

      if s.last().is_some_and(|b| b.is_ascii_whitespace()) {
        len -= w + 1;
      }
      else {
        len -= w;
      }
    }
  }

  len
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
