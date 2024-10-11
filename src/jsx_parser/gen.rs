use tree_sitter::Node;

use super::{
  utils::{
    generate_event_var, is_jsx_element, is_jsx_text, is_reactive_kind, is_static_kind, merge_jsx_text, replace_jsx, wrap_reactive_value, GlobalState,
  },
  Child, JsxTemplate, VAR_PREF,
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

    if self.is_self_closing && self.tag != "slot" {
      write!(f, "/>")?;
      return Ok(f);
    }

    write!(f, ">")?;
    let mut idx = 0;
    while let Some(child) = self.children.get(idx) {
      if is_jsx_element(child.kind) {
        let Some(elem) = templates.iter().find(|t| *t == child)
        else {
          idx += 1;
          continue;
        };

        if elem.is_component() || elem.conditional.is_some() || elem.transition.is_some() {
          write!(f, "<!>")?;
        }
        else {
          write!(f, "{}", elem.generate_template_string(templates)?)?;
        }
      }
      else if is_jsx_text(child.kind) {
        let text = merge_jsx_text(&self.children, &mut idx, false)?;
        if text.is_empty() {
          continue;
        }
        write!(f, "{}", text)?;
        idx -= 1;
      }
      else {
        write!(f, "<!>")?;
      }
      idx += 1;
    }
    write!(f, "</{}>", self.tag)?;

    Ok(f)
  }

  pub(super) fn child_as_value(
    &'a self,
    idx: &mut usize,
    child: &'a Child,
    templates: &[JsxTemplate],
    state: &mut GlobalState,
  ) -> Result<Option<Cow<str>>, ParserError> {
    Ok(if is_jsx_text(child.kind) {
      let escaped = merge_jsx_text(&self.children, idx, true)?;
      (escaped != "\"\"").then_some(Cow::Owned(escaped))
    }
    else {
      *idx += 1;
      state.is_component_child = true;
      let ret = replace_jsx(child.node, templates, child.value, state)?;
      state.is_component_child = false;
      Some(ret)
    })
  }

  pub(super) fn generate_component_call(&self, templates: &[JsxTemplate], state: &mut GlobalState) -> Result<(String, String), ParserError> {
    let mut s = String::new();

    if !self.children.is_empty() {
      write!(s, "window.$$slots = {{")?;
      let mut default_slot: Option<Vec<Cow<str>>> = None;
      let mut idx = 0;

      while let Some(child) = self.children.get(idx) {
        let Some(value) = self.child_as_value(&mut idx, child, templates, state)?
        else {
          continue;
        };

        if is_jsx_element(child.kind) {
          let Some(elem) = templates.iter().find(|t| *t == child)
          else {
            continue;
          };

          let Some(slot) = elem.props.iter().find(|p| p.key == "slot")
          else {
            let slot = default_slot.get_or_insert_with(|| Vec::with_capacity(10));
            slot.push(value);
            continue;
          };

          write!(
            s,
            "{}: {}, ",
            slot
              .value
              .ok_or_else(|| ParserError::msg("\"slot\" attribute must have a value", child.node))?,
            value
          )?;
        }
        else if is_reactive_kind(child.kind) {
          let slot = default_slot.get_or_insert_with(|| Vec::with_capacity(10));
          slot.push(Cow::Owned(format!("() => {}", value)));
        }
        else {
          let slot = default_slot.get_or_insert_with(|| Vec::with_capacity(10));
          slot.push(value);
        }
      }
      if let Some(slot) = default_slot {
        write!(s, "default: [{}]", slot.join(","))?;
      }
      write!(s, "}};")?;
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

  pub(super) fn replace_slot(
    &self,
    elem_vars: &mut String,
    elem_setup: &mut String,
    var: &str,
    state: &mut GlobalState,
    slots_defined: &mut bool,
    node: Option<&Node>,
  ) -> Result<(), ParserError> {
    let name = self
      .props
      .iter()
      .find_map(|p| {
        (p.key == "name").then(|| {
          p.value.ok_or_else(|| {
            if let Some(node) = node {
              ParserError::msg("\"name\" attribute in slot must have a value", *node)
            }
            else {
              ParserError::Parse
            }
          })
        })
      })
      .transpose()?
      .unwrap_or("default");

    state.imports.insert("insertChild");
    if !*slots_defined {
      writeln!(elem_vars, "const $$slots = window.$$slots;")?;
      *slots_defined = true;
    }
    writeln!(elem_setup, "{VAR_PREF}insertChild({var}, $$slots[\"{name}\"]);")?;

    Ok(())
  }

  pub(super) fn generate_fn(&self, var_idx: &mut usize, templates: &[JsxTemplate], state: &mut GlobalState) -> Result<(String, String), ParserError> {
    let mut elem_vars = String::new();
    let mut var = format!("{VAR_PREF}el{}", *var_idx);

    if self.is_component() {
      let is_component_child = state.is_component_child;
      let (s, f) = self.generate_component_call(templates, state)?;

      if self.is_root || is_component_child {
        writeln!(elem_vars, "const {var} = {f};")?;
        return Ok((s, elem_vars));
      }

      return Ok((s, f));
    }

    let mut elem_setup = String::new();

    let mut slots_defined = false;
    // TODO: slots within deep components <CompA><CompB><slot /></CompB></CompA>
    if self.tag == "slot" {
      self.replace_slot(&mut elem_vars, &mut elem_setup, &var, state, &mut slots_defined, None)?;
    }

    if self.is_root && !state.parsing_special_root {
      if let Some(cond) = &self.conditional {
        state.parsing_special_root = true;
        state.imports.insert("conditionalRender");
        let parts = self.parts(templates, state)?;
        writeln!(
          elem_vars,
          "const {var} = {VAR_PREF}conditionalRender(document.createComment(\"\"), {}, {});",
          &parts.create_fn[..parts.create_fn.len() - 2],
          wrap_reactive_value(cond.kind, cond.value.unwrap_or("true"))
        )?;
        state.parsing_special_root = false;

        return Ok((elem_setup, elem_vars));
      }
      else if let Some((name, prop)) = &self.transition {
        state.parsing_special_root = true;
        state.imports.insert("createTransition");
        let parts = self.parts(templates, state)?;
        writeln!(
          elem_vars,
          "const {var} = {VAR_PREF}createTransition(document.createComment(\"\"), {}, {}, \"{name}\");",
          &parts.create_fn[..parts.create_fn.len() - 2],
          wrap_reactive_value(prop.kind, prop.value.unwrap_or("true"))
        )?;
        state.parsing_special_root = false;

        return Ok((elem_setup, elem_vars));
      }
    }

    if self.is_root || state.is_component_child || self.conditional.is_some() || self.transition.is_some() || state.is_template_child {
      state.imports.insert("template");
      state.templates.insert(self.id);
      writeln!(
        elem_vars,
        "const {var} = {VAR_PREF}templ{}(); // root[{}]/component[{}]/conditional[{}]/transition[{}]/template-child[{}]",
        self.id,
        self.is_root,
        state.is_component_child,
        self.conditional.is_some(),
        self.transition.is_some(),
        state.is_template_child
      )?;
      state.is_template_child = false;
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

      if prop.key.contains(':') {
        if let Some(event_name) = prop.key.strip_prefix("on:") {
          state.imports.insert("addLocalEvent");
          writeln!(elem_setup, "{VAR_PREF}addLocalEvent({var}, \"{event_name}\", {value});")?;
        }
        else if let Some(event_name) = prop.key.strip_prefix("g:on") {
          if state.events.insert(event_name.into()) {
            state.imports.insert("createGlobalEvent");
            state.imports.insert("addGlobalEvent");
          }

          writeln!(
            elem_setup,
            "{VAR_PREF}addGlobalEvent(window.{}, {var}, {value});",
            generate_event_var(event_name),
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
      }
      else if prop.key == "$ref" {
        writeln!(elem_setup, "{value} = {var};")?;
      }
      else if let Some(key) = prop.key.strip_prefix('$') {
        state.imports.insert("trackAttribute");
        writeln!(
          elem_setup,
          "{VAR_PREF}trackAttribute({var}, \"{}\", {});",
          key,
          wrap_reactive_value(prop.kind, &value)
        )?;
      }
      else {
        state.imports.insert("setAttribute");
        writeln!(elem_setup, "{VAR_PREF}setAttribute({var}, \"{}\", {});", prop.key, &value)?;
      }
    }

    let mut first = true;
    let mut idx = 0;
    state.is_component_child = false;
    while let Some(child) = self.children.get(idx) {
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
            idx += 1;
            continue;
          };

          if elem.is_component() {
            let (slots, call) = elem.generate_component_call(templates, state)?;
            state.imports.insert("insertChild");
            writeln!(elem_setup, "{slots};\n{VAR_PREF}insertChild({var}, {call});",)?;
          }
          else if elem.tag == "slot" {
            elem.replace_slot(&mut elem_vars, &mut elem_setup, &var, state, &mut slots_defined, Some(&child.node))?;
          }
          else if let Some(cond) = &elem.conditional {
            state.imports.insert("conditionalRender");
            let parts = elem.parts(templates, state)?;
            writeln!(
              elem_setup,
              "{VAR_PREF}conditionalRender({var}, {}, {});",
              &parts.create_fn[..parts.create_fn.len() - 2],
              wrap_reactive_value(cond.kind, cond.value.unwrap_or("true"))
            )?;
          }
          else if let Some((name, cond)) = &elem.transition {
            state.imports.insert("createTransition");
            let parts = elem.parts(templates, state)?;
            writeln!(
              elem_setup,
              "{VAR_PREF}createTransition({var}, {}, {}, \"{name}\");",
              &parts.create_fn[..parts.create_fn.len() - 2],
              wrap_reactive_value(cond.kind, cond.value.unwrap_or("true"))
            )?;
          }
          else {
            let (vars, setup) = elem.generate_fn(var_idx, templates, state)?;
            write!(elem_vars, "{}", vars)?;
            write!(elem_setup, "{}", setup)?;
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
            writeln!(elem_setup, "{VAR_PREF}insertChild({var}, () => {});", value)?;
          }
          else {
            state.imports.insert("insertChild");
            writeln!(elem_setup, "{VAR_PREF}insertChild({var}, {});", value)?;
          }
        }
        _ => {
          while let Some(child) = self.children.get(idx) {
            if is_jsx_text(child.kind) {
              idx += 1;
              continue;
            }
            else {
              idx -= 1;
              break;
            }
          }
        }
      }
      idx += 1;
    }

    Ok((elem_vars, elem_setup))
  }
}
