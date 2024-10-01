use std::error::Error;
use std::fs::{read, OpenOptions};
use std::io::Write;
use std::path::Path;
use std::{char, env};

fn main() -> Result<(), Box<dyn Error>> {
  println!("cargo::rerun-if-changed=html_entities.json");

  let outdir = Path::new(&env::var("OUT_DIR")?).join("html_entities.rs");
  let mut file = OpenOptions::new().append(true).create(true).open(outdir)?;
  file.set_len(0)?;
  write!(
    file,
    r#"
pub fn parse_html_escape_sequence<W: std::fmt::Write>(html: &str, buf: &mut W) -> Result<(), std::fmt::Error> {{
  if let Some(code) = html.strip_prefix("&#") {{
    let code = &code[..code.len() - 1];

    let dec = if let Some(hex) = code.strip_prefix("x") {{
      u32::from_str_radix(hex, 16).unwrap_or('�' as u32)
    }}
    else {{
      code.parse::<u32>().unwrap_or('�' as u32)
    }};

    write!(buf, "{{}}", char::from_u32(dec).unwrap_or('�'))
  }}
  else {{
    match html {{"#
  )?;
  parse_arms(&mut file)?;
  write!(
    file,
    r#"
      v => write!(buf, "{{v}}"),
    }}
  }}
}}"#
  )?;

  Ok(())
}

fn parse_arms<W: Write>(s: &mut W) -> Result<(), Box<dyn Error>> {
  enum Step {
    FindArm,
    BuildArm,
    FindValue,
    BuildValue,
  }

  let data = read("html_entities.json")?;
  let mut step = Step::FindArm;
  let mut arm = 0..0;
  let mut value = String::with_capacity(8);
  let mut i = 0;

  while let Some(b) = data.get(i).copied() {
    match step {
      Step::FindArm => {
        if b == b'"' {
          arm.start = i;
          step = Step::BuildArm;
        }
      }
      Step::BuildArm => {
        if b == b'"' {
          arm.end = i + 1;
          step = Step::FindValue;
        }
      }
      Step::FindValue => {
        let Some(v) = data.get(i..i + 13)
        else {
          break;
        };

        if v == b"\"codepoints\":" {
          i += 14;
          while let Some(b) = data.get(i).copied() {
            if b == b'[' {
              step = Step::BuildValue;
              break;
            }
            i += 1;
          }
        }
      }
      Step::BuildValue => {
        if b.is_ascii_digit() {
          let mut start = i;
          let mut escaped = None;
          while let Some(b) = data.get(i).copied() {
            if !b.is_ascii_digit() {
              if b == b',' || b == b']' {
                let codepoint = std::str::from_utf8(&data[start..i])?.parse()?;

                escaped = match codepoint {
                  0x005C => Some("\\\\"),      // Backslash
                  0x007B => Some("{{"),        // Left curly brace
                  0x007D => Some("}}"),        // Right curly brace
                  0x0022 => Some("\\\""),      // Double quote
                  0x000A => Some("\\n"),       // Newline
                  0x00A0 => Some("\\\\xA0"),   // Non-Breaking Space
                  0x1680 => Some("\\\\x1680"), // Ogham Space Mark
                  0x2000 => Some("\\\\x2000"), // En Quad
                  0x2001 => Some("\\\\x2001"), // Em Quad
                  0x2002 => Some("\\\\x2002"), // En Space
                  0x2003 => Some("\\\\x2003"), // Em Space
                  0x2004 => Some("\\\\x2004"), // Three-Per-Em Space
                  0x2005 => Some("\\\\x2005"), // Four-Per-Em Space
                  0x2006 => Some("\\\\x2006"), // Six-Per-Em Space
                  0x2007 => Some("\\\\x2007"), // Figure Space
                  0x2008 => Some("\\\\x2008"), // Punctuation Space
                  0x2009 => Some("\\\\x2009"), // Thin Space
                  0x200A => Some("\\\\x200A"), // Hair Space
                  0x200B => Some("\\\\x200B"), // Zero Width Space
                  0x202F => Some("\\\\x202F"), // Narrow No-Break Space
                  0x205F => Some("\\\\x205F"), // Medium Mathematical Space
                  0x3000 => Some("\\\\x3000"), // Ideographic Space
                  0xFEFF => Some("\\\\xFEFF"), // Zero Width No-Break Space (Word Joiner)
                  _ => None,
                };

                if escaped.is_some() {
                  break;
                }

                use std::fmt::Write;
                write!(value, "{}", char::from_u32(codepoint).unwrap())?;
              }

              if b == b']' {
                break;
              }

              start = i + 1;
            }
            i += 1;
          }

          writeln!(
            s,
            "{} => write!(buf, \"{}\"),",
            std::str::from_utf8(&data[arm.clone()])?,
            escaped.unwrap_or(&value),
          )?;
          while let Some(b) = data.get(i) {
            if *b == b'}' {
              break;
            }
            i += 1;
          }
          step = Step::FindArm;
          value.clear();
        }
      }
    }
    i += 1;
  }

  Ok(())
}
