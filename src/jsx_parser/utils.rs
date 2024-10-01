use super::{html_entities::parse_html_escape_sequence, Child, VAR_PREF};
use crate::{error::ParserError, jsx_parser::JsxTemplate};
use core::str;
use std::{borrow::Cow, collections::HashSet, fmt::Write, ops::Range};
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

pub(super) fn merge_jsx_text(children: &[Child], idx: &mut usize, escape: bool) -> Result<String, ParserError> {
  let offset;
  let surround;
  if escape {
    offset = 1;
    surround = "\"";
  }
  else {
    offset = 0;
    surround = "";
  }

  let mut text = String::from(surround);

  let prev_child = (*idx > 0).then(|| children.get(*idx - 1)).flatten();
  if escape {
    while let Some(child) = children.get(*idx) {
      match child.kind {
        "jsx_text" => {
          write!(text, "{}", child.value.replace('"', r#"\""#))?;
        }
        "html_character_reference" => {
          parse_html_escape_sequence(child.value, &mut text)?;
        }
        _ => break,
      }
      *idx += 1;
    }
  }
  else {
    while let Some(child) = children.get(*idx) {
      if matches!(child.kind, "jsx_text" | "html_character_reference") {
        write!(text, "{}", child.value.replace('"', r#"\""#))?;
      }
      else {
        break;
      }
      *idx += 1;
    }
  }
  let next_child = children.get(*idx);

  let bytes = &text.as_bytes()[offset..];
  let mut append_space = false;
  {
    let start = if (prev_child.is_none() || prev_child.is_some_and(|c| !is_jsx_text(c.kind))) && bytes.first().is_some_and(|b| *b == b' ') {
      offset + 1
    }
    else {
      offset
    };

    if (next_child.is_none() || next_child.is_some_and(|c| !is_jsx_text(c.kind))) && children[*idx - 1].kind == "jsx_text" {
      append_space = bytes
        .iter()
        .rposition(|b| !b.is_ascii_whitespace())
        .and_then(|pos| bytes.get(pos + 1))
        .is_some_and(|b| *b == b' ');
    }

    fold_whitespace(Some(start..text.len()), &mut text)
  };

  if append_space {
    write!(text, " {surround}")?;
  }
  else {
    write!(text, "{surround}")?;
  }

  Ok(text)
}

fn utf8_bytes_to_u32(bytes: &[u8]) -> Result<u32, ParserError> {
  Ok(str::from_utf8(bytes).map(|s| s.chars().next().unwrap() as u32)?)
}

pub(super) fn fold_whitespace(range: Option<Range<usize>>, s: &mut String) {
  #[derive(Debug)]
  enum Step {
    Start,
    Space,
    Alpha,
  }

  let mut step = Step::Start;
  let mut a = 0;
  let mut w = 0;
  let mut n = 0;
  let initial_len = s.len();
  let mut len = s.len();

  let bytes = unsafe {
    if let Some(range) = range {
      &mut s.as_bytes_mut()[range]
    }
    else {
      s.as_bytes_mut()
    }
  };
  let mut i = 0;

  while let Some(byte) = bytes.get(i) {
    let (is_whitespace, offset) = match byte.leading_ones() as usize {
      0 => (byte.is_ascii_whitespace(), 1),
      n => {
        (
          matches!(
            utf8_bytes_to_u32(&bytes[i..i + n]).expect("String is not valid UTF-8"),
            0x00A0  // Non-Breaking Space
            | 0x1680  // Ogham Space Mark
            | 0x2000  // En Quad
            | 0x2001  // Em Quad
            | 0x2002  // En Space
            | 0x2003  // Em Space
            | 0x2004  // Three-Per-Em Space
            | 0x2005  // Four-Per-Em Space
            | 0x2006  // Six-Per-Em Space
            | 0x2007  // Figure Space
            | 0x2008  // Punctuation Space
            | 0x2009  // Thin Space
            | 0x200A  // Hair Space
            | 0x200B  // Zero Width Space
            | 0x202F  // Narrow No-Break Space
            | 0x205F  // Medium Mathematical Space
            | 0x3000  // Ideographic Space
            | 0xFEFF // Zero Width No-Break Space (Word Joiner)
          ),
          n,
        )
      }
    };

    if is_whitespace {
      if matches!(step, Step::Alpha) {
        w = usize::saturating_sub(w, 1);
        bytes.copy_within(a..i, n);
        n += i - a;
        len -= w;
        w = 0;
      }

      w += offset;
      step = Step::Space;
    }
    else {
      match step {
        Step::Start => {
          n += offset;
        }
        Step::Space => {
          if n == 0 {
            a = i;
            w += 1;
          }
          else {
            a = i - 1;
            bytes[a] = b' ';
          };
          step = Step::Alpha;
        }
        Step::Alpha => {
          step = Step::Alpha;
        }
      }
    }

    i += offset;
  }

  if !matches!(step, Step::Start) {
    w = usize::saturating_sub(w, 1);

    if a != 0 && matches!(step, Step::Alpha) {
      bytes.copy_within(a..i, n);
      if i < initial_len - 1 {
        bytes[n + (i - a)] = unsafe { *bytes.as_ptr().add(i) };
      }
    }
    else {
      bytes[n] = b' ';
    }

    if bytes.last().is_some_and(|b| b.is_ascii_whitespace()) {
      len -= w + 1;
    }
    else {
      len -= w;
    }
  }

  if len > 0 && len < initial_len {
    let len = bytes.len() - (initial_len - len);
    // Trying to truncate in a char boundary will crash
    if bytes[len].leading_ones() > 0 {
      bytes[len] = 0;
    }
  }

  s.truncate(len);
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
