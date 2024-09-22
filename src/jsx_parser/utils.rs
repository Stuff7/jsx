use super::VAR_PREF;
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
}

impl GlobalState {
  pub fn get_imports(&mut self) -> Result<String, ParserError> {
    let mut imports = String::with_capacity(self.imports.len() * 128);
    for import in &self.imports {
      writeln!(imports, "import {{ {import} as {VAR_PREF}{import} }} from \"jsx/runtime\"")?;
    }
    self.imports.clear();

    Ok(imports)
  }
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
