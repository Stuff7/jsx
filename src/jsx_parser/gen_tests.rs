#[cfg(test)]
mod tests {
  use crate::jsx_parser::{utils::merge_jsx_text, JsxParser, JsxTemplate, ParserError};

  macro_rules! parse_templates {
    (let $name: ident = $src: expr) => {
      let source = $src;
      let mut parser = JsxParser::new().expect("JsxParser should be created");

      let tree = parser.tree(source).expect("Tree should parse");
      let matches = parser.parse(tree.root_node(), source).expect("Tree root node should parse");

      let $name = matches
        .enumerate()
        .map(|(i, m)| JsxTemplate::parse(i, m.captures, source))
        .collect::<Result<Box<_>, ParserError>>()
        .expect("Templates should parse");
    };
  }

  #[test]
  fn test_basic_text_escaping() {
    parse_templates!(
      let templates = br#"<SomeComponent>Basic text without special characters</SomeComponent>"#
    );

    assert_eq!(templates[0].tag, "SomeComponent");
    assert_eq!(templates[0].children.len(), 1);

    let mut idx = 0;
    let text = merge_jsx_text(&templates[0].children, &mut idx, true).expect("Text should parse");
    assert_eq!(text, "\"Basic text without special characters\"");

    let mut idx = 0;
    let text = merge_jsx_text(&templates[0].children, &mut idx, false).expect("Text should parse");
    assert_eq!(text, "Basic text without special characters");
  }

  #[test]
  fn test_space_before_and_after() {
    parse_templates!(
      let templates = br#"<SomeComponent> Text  between  spaces </SomeComponent>"#
    );

    assert_eq!(templates[0].tag, "SomeComponent");
    assert_eq!(templates[0].children.len(), 1);

    let mut idx = 0;
    let text = merge_jsx_text(&templates[0].children, &mut idx, true).expect("Text should parse");
    assert_eq!(text, "\" Text between spaces \"");

    let mut idx = 0;
    let text = merge_jsx_text(&templates[0].children, &mut idx, false).expect("Text should parse");
    assert_eq!(text, " Text between spaces ");
  }

  #[test]
  fn test_text_with_html_entities() {
    parse_templates!(
      let templates = br#"<SomeComponent>Text with &nbsp; entities &amp; symbols &lt; &gt;</SomeComponent>"#
    );

    assert_eq!(templates[0].tag, "SomeComponent");
    assert_eq!(templates[0].children.len(), 8);

    let mut idx = 0;
    let text = merge_jsx_text(&templates[0].children, &mut idx, true).expect("Text should parse");
    assert_eq!(text, "\"Text with \\xA0 entities & symbols < >\"");

    let mut idx = 0;
    let text = merge_jsx_text(&templates[0].children, &mut idx, false).expect("Text should parse");
    assert_eq!(text, "Text with &nbsp; entities &amp; symbols &lt; &gt;");
  }

  #[test]
  fn test_text_with_newlines_and_multiple_spaces() {
    parse_templates!(
      let templates = br#"
      <SomeComponent>
        Text with    
        multiple       spaces
      </SomeComponent>
    "# 
    );

    assert_eq!(templates[0].tag, "SomeComponent");
    assert_eq!(templates[0].children.len(), 1);

    let mut idx = 0;
    let text = merge_jsx_text(&templates[0].children, &mut idx, true).expect("Text should parse");
    assert_eq!(text, "\"Text with multiple spaces\"");

    let mut idx = 0;
    let text = merge_jsx_text(&templates[0].children, &mut idx, false).expect("Text should parse");
    assert_eq!(text, "Text with multiple spaces");
  }

  #[test]
  fn test_spaces_before_and_after_elements() {
    parse_templates!(
      let templates = br#"
      <SomeComponent>
        Text before <span>inner text</span> text after
      </SomeComponent>
    "# 
    );

    assert_eq!(templates[0].tag, "span");
    assert_eq!(templates[1].tag, "SomeComponent");
    assert_eq!(templates[1].children.len(), 3);

    let mut idx = 0;
    let text = merge_jsx_text(&templates[1].children, &mut idx, true).expect("Text should parse");
    assert_eq!(text, "\"Text before \"");

    idx += 1;
    let text = merge_jsx_text(&templates[1].children, &mut idx, true).expect("Text should parse");
    assert_eq!(text, "\" text after\"");

    idx = 0;
    let text = merge_jsx_text(&templates[0].children, &mut idx, true).expect("Text should parse");
    assert_eq!(text, "\"inner text\"");

    let mut idx = 0;
    let text = merge_jsx_text(&templates[1].children, &mut idx, false).expect("Text should parse");
    assert_eq!(text, "Text before ");

    idx += 1;
    let text = merge_jsx_text(&templates[1].children, &mut idx, false).expect("Text should parse");
    assert_eq!(text, " text after");

    idx = 0;
    let text = merge_jsx_text(&templates[0].children, &mut idx, false).expect("Text should parse");
    assert_eq!(text, "inner text");
  }

  #[test]
  fn test_no_spaces_around_elements() {
    parse_templates!(
      let templates = br#"
      <SomeComponent>
        Text before<span>inner text</span>text after
      </SomeComponent>
    "# 
    );

    assert_eq!(templates[0].tag, "span");
    assert_eq!(templates[0].children.len(), 1);
    assert_eq!(templates[1].tag, "SomeComponent");
    assert_eq!(templates[1].children.len(), 3);

    let mut idx = 0;
    let text = merge_jsx_text(&templates[0].children, &mut idx, true).expect("Text should parse");
    assert_eq!(text, "\"inner text\"");

    idx = 0;
    let text = merge_jsx_text(&templates[1].children, &mut idx, true).expect("Text should parse");
    assert_eq!(text, "\"Text before\"");

    idx += 1;
    let text = merge_jsx_text(&templates[1].children, &mut idx, true).expect("Text should parse");
    assert_eq!(text, "\"text after\"");

    let mut idx = 0;
    let text = merge_jsx_text(&templates[0].children, &mut idx, false).expect("Text should parse");
    assert_eq!(text, "inner text");

    idx = 0;
    let text = merge_jsx_text(&templates[1].children, &mut idx, false).expect("Text should parse");
    assert_eq!(text, "Text before");

    idx += 1;
    let text = merge_jsx_text(&templates[1].children, &mut idx, false).expect("Text should parse");
    assert_eq!(text, "text after");
  }

  #[test]
  fn test_only_whitespace_nodes() {
    parse_templates!(
      let templates = br#"<SomeComponent>      </SomeComponent>"#
    );

    assert_eq!(templates[0].tag, "SomeComponent");
    assert_eq!(templates[0].children.len(), 1);

    let mut idx = 0;
    let text = merge_jsx_text(&templates[0].children, &mut idx, true).expect("Text should parse");
    assert_eq!(text, "\" \"");

    let mut idx = 0;
    let text = merge_jsx_text(&templates[0].children, &mut idx, false).expect("Text should parse");
    assert_eq!(text, " ");
  }

  #[test]
  fn test_mixed_text_and_elements_with_whitespace() {
    parse_templates!(
      let templates = br#"
      <SomeComponent>
        Outer text  
        <AnotherComponent>   Inner text   </AnotherComponent>
        More outer text
      </SomeComponent>
    "# 
    );

    assert_eq!(templates[0].tag, "AnotherComponent");
    assert_eq!(templates[1].tag, "SomeComponent");
    assert_eq!(templates[1].children.len(), 3);

    let mut idx = 0;
    let text = merge_jsx_text(&templates[1].children, &mut idx, true).expect("Text should parse");
    assert_eq!(text, "\"Outer text \"");

    idx = 0;
    let text = merge_jsx_text(&templates[0].children, &mut idx, true).expect("Text should parse");
    assert_eq!(text, "\" Inner text \"");

    idx += 1;
    let text = merge_jsx_text(&templates[1].children, &mut idx, true).expect("Text should parse");
    assert_eq!(text, "\"More outer text\"");

    let mut idx = 0;
    let text = merge_jsx_text(&templates[1].children, &mut idx, false).expect("Text should parse");
    assert_eq!(text, "Outer text ");

    idx = 0;
    let text = merge_jsx_text(&templates[0].children, &mut idx, false).expect("Text should parse");
    assert_eq!(text, " Inner text ");

    idx += 1;
    let text = merge_jsx_text(&templates[1].children, &mut idx, false).expect("Text should parse");
    assert_eq!(text, "More outer text");
  }

  #[test]
  fn test_unicode_characters_with_spaces() {
    parse_templates!(
      let templates = "<div>  Unicode text  with   emojis 😊 and non-ASCII &#xFFFC; &#120120; characters: äöüß   </div>".as_bytes()
    );

    assert_eq!(templates[0].tag, "div");
    assert_eq!(templates[0].children.len(), 5);

    let mut idx = 0;
    let text = merge_jsx_text(&templates[0].children, &mut idx, true).expect("Text should parse");
    assert_eq!(text, "\" Unicode text with emojis 😊 and non-ASCII ￼ 𝔸 characters: äöüß \"");

    let mut idx = 0;
    let text = merge_jsx_text(&templates[0].children, &mut idx, false).expect("Text should parse");
    assert_eq!(text, " Unicode text with emojis 😊 and non-ASCII &#xFFFC; &#120120; characters: äöüß ");
  }

  #[test]
  fn test_jsx_expressions() {
    parse_templates!(
      let templates = br#"
        <span>
          Some text {someVar} ok {15} {`${6}`} {1e3} {"then"}
          <div>
            <i>lol</i>
            ok
            <input />
          </div>
        </span>
      "#
    );

    assert_eq!(templates[0].tag, "i");
    assert_eq!(templates[0].children.len(), 1);

    assert_eq!(templates[1].tag, "input");

    assert_eq!(templates[2].tag, "div");
    assert_eq!(templates[2].children.len(), 3);

    assert_eq!(templates[3].tag, "span");
    assert_eq!(templates[3].children.len(), 11);

    let mut idx = 0;
    let text = merge_jsx_text(&templates[0].children, &mut idx, true).expect("Text should parse");
    assert_eq!(text, "\"lol\"");

    let mut idx = 1;
    let text = merge_jsx_text(&templates[2].children, &mut idx, true).expect("Text should parse");
    assert_eq!(text, "\"ok\"");

    let mut idx = 0;
    let text = merge_jsx_text(&templates[3].children, &mut idx, true).expect("Text should parse");
    assert_eq!(text, "\"Some text \"");

    idx += 1;
    let text = merge_jsx_text(&templates[3].children, &mut idx, true).expect("Text should parse");
    assert_eq!(text, "\" ok \"");

    let mut idx = 0;
    let text = merge_jsx_text(&templates[0].children, &mut idx, false).expect("Text should parse");
    assert_eq!(text, "lol");

    let mut idx = 1;
    let text = merge_jsx_text(&templates[2].children, &mut idx, false).expect("Text should parse");
    assert_eq!(text, "ok");

    let mut idx = 0;
    let text = merge_jsx_text(&templates[3].children, &mut idx, false).expect("Text should parse");
    assert_eq!(text, "Some text ");

    idx += 1;
    let text = merge_jsx_text(&templates[3].children, &mut idx, false).expect("Text should parse");
    assert_eq!(text, " ok ");
  }
}
