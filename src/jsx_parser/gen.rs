use super::{
  utils::{is_reactive_kind, is_static_kind, replace_jsx, wrap_reactive_value, GlobalState},
  JsxTemplate, VAR_PREF,
};
use crate::error::ParserError;
use std::{borrow::Cow, fmt::Write};

impl<'a> JsxTemplate<'a> {
  pub(super) fn generate_template_string(&self, templates: &[JsxTemplate]) -> Result<String, ParserError> {
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
        styles.push(
          format!(
            "{property}:{};",
            prop
              .value
              .ok_or_else(|| ParserError::msg("\"style:*\" JSX properties must have a value", prop.node))?
          )
          .into(),
        );
      }
      else if prop.key.starts_with("var:") {
        let custom_property = prop.key.trim_start_matches("var:");
        let styles = styles.get_or_insert_with(|| Vec::with_capacity(16));
        styles.push(
          format!(
            "--{custom_property}:{};",
            prop
              .value
              .ok_or_else(|| ParserError::msg("\"var:*\" JSX properties must have a value", prop.node))?
          )
          .into(),
        );
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

  pub(super) fn generate_component_call(&self, templates: &[JsxTemplate], state: &mut GlobalState) -> Result<(String, String), ParserError> {
    let mut s = String::new();

    if !self.children.is_empty() {
      write!(s, "window.$$slots = {{")?;
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
            slot.push(replace_jsx(child.node, templates, child.value, state)?);
            continue;
          };
          write!(
            s,
            "{}: {}, ",
            slot
              .value
              .ok_or_else(|| ParserError::msg("\"slot\" attribute must have a value", child.node))?,
            replace_jsx(child.node, templates, child.value, state)?
          )?;
        }
        else if is_reactive_kind(child.kind) {
          let slot = default_slot.get_or_insert_with(|| Vec::with_capacity(10));
          slot.push(Cow::Owned(format!("() => {}", replace_jsx(child.node, templates, child.value, state)?)));
        }
        else {
          let slot = default_slot.get_or_insert_with(|| Vec::with_capacity(10));
          slot.push(replace_jsx(child.node, templates, child.value, state)?);
        }
      }
      if let Some(slot) = default_slot {
        write!(s, "default: [{}]", slot.join(","))?;
      }
      write!(s, "}}")?;
    }

    let mut f = format!("{}(", self.tag);

    if self.props.is_empty() {
      write!(f, "null")?;
    }
    else {
      write!(f, "{{")?;
      for prop in &self.props {
        if prop.kind == "string_fragment" {
          write!(
            f,
            "{}: \"{}\", ",
            prop.key,
            prop
              .value
              .ok_or_else(|| ParserError::msg("\"string_fragment\" prop kind must have a value", prop.node))?
          )?;
        }
        else if is_reactive_kind(prop.kind) {
          write!(
            f,
            "get {}() {{ return {} }}, ",
            prop.key,
            replace_jsx(
              prop.node,
              templates,
              prop
                .value
                .ok_or_else(|| ParserError::msg("Reactive props must have a value", prop.node))?,
              state
            )?
          )?;
        }
        else if let Some(value) = prop.value {
          write!(f, "{}: {}, ", prop.key, replace_jsx(prop.node, templates, value, state)?)?;
        }
        else {
          write!(f, "{}: true, ", prop.key)?;
        }
      }
      write!(f, "}}")?;
    }
    write!(f, ")")?;

    Ok((s, f))
  }

  pub(super) fn generate_fn(
    &self,
    var_idx: &mut usize,
    templates: &[JsxTemplate],
    state: &mut GlobalState,
  ) -> Result<(String, String, String), ParserError> {
    if self.is_component() {
      let (slots, call) = self.generate_component_call(templates, state)?;
      return Ok((slots, call, String::new()));
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
      let value = replace_jsx(prop.node, templates, value, state)?;

      if let Some(event_name) = prop.key.strip_prefix("on:") {
        writeln!(elem_setup, "{var}.addEventListener(\"{event_name}\", {value});")?;
      }
      if let Some(event_name) = prop.key.strip_prefix("g:on") {
        let events_var = format!("{VAR_PREF}global_event_{event_name}");
        if state.events.insert(event_name.into()) {
          state.imports.insert("createGlobalEvent");
          writeln!(globals, "window.{events_var} = {VAR_PREF}createGlobalEvent(\"{event_name}\");")?;
        }
        state.imports.insert("addGlobalEvent");
        writeln!(
          elem_setup,
          "{VAR_PREF}addGlobalEvent(window.{events_var}, {var}, \"{event_name}\", {value});"
        )?;
      }
      else if prop.key.starts_with("class:") {
        let class = prop.key.trim_start_matches("class:");
        state.imports.insert("trackClass");
        writeln!(
          elem_setup,
          "{VAR_PREF}trackClass({var}, \"{class}\", {});",
          wrap_reactive_value(prop.kind, &value)
        )?;
      }
      else if prop.key.starts_with("style:") {
        let property = prop.key.trim_start_matches("style:");
        state.imports.insert("trackCssProperty");
        writeln!(
          elem_setup,
          "{VAR_PREF}trackCssProperty({var}, \"{property}\", {});",
          wrap_reactive_value(prop.kind, &value)
        )?;
      }
      else if prop.key.starts_with("var:") {
        let custom_property = prop.key.trim_start_matches("var:");
        state.imports.insert("trackCssProperty");
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
        state.imports.insert("trackAttribute");
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
            let (slots, call) = elem.generate_component_call(templates, state)?;
            state.imports.insert("insertChild");
            writeln!(elem_setup, "{slots}\n;{VAR_PREF}insertChild({call}, {var});",)?;
          }
          else if elem.tag == "slot" {
            let name = elem
              .props
              .iter()
              .find_map(|p| {
                (p.key == "name").then(|| {
                  p.value
                    .ok_or_else(|| ParserError::msg("\"name\" attribute in slot must have a value", child.node))
                })
              })
              .transpose()?
              .unwrap_or("default");
            state.imports.insert("insertChild");
            writeln!(elem_setup, "{VAR_PREF}insertChild(window.$$slots[\"{name}\"], {var})")?;
          }
          else {
            let (vars, setup, g) = elem.generate_fn(var_idx, templates, state)?;
            write!(elem_vars, "{}", vars)?;
            write!(elem_setup, "{}", setup)?;
            write!(globals, "{}", g)?;
          }
        }
        "jsx_expression" => {
          let value = replace_jsx(child.node, templates, child.value, state)?;
          if is_reactive_kind(
            child
              .node
              .named_child(0)
              .ok_or_else(|| ParserError::empty_jsx_expression(child.node))?
              .kind(),
          ) {
            state.imports.insert("insertChild");
            writeln!(elem_setup, "{VAR_PREF}insertChild(() => {}, {var});", value)?;
          }
          else {
            state.imports.insert("insertChild");
            writeln!(elem_setup, "{VAR_PREF}insertChild({}, {var});", value)?;
          }
        }
        _ => (),
      }
    }

    Ok((elem_vars, elem_setup, globals))
  }
}
