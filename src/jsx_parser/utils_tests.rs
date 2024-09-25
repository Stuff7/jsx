#[cfg(test)]
mod tests {
  use super::super::utils::fold_whitespace;

  #[test]
  fn test_fold_basic_whitespace() {
    let mut input = String::from("   Hello    World   ");
    fold_whitespace(None, &mut input);
    assert_eq!(input, "Hello World", "Output: {input:?}");
  }

  #[test]
  fn test_fold_with_range() {
    let mut input = String::from("   Hello    World   ");
    fold_whitespace(Some(1..input.len() - 1), &mut input);
    assert_eq!(input, " Hello World ", "Output: {input:?}");
  }

  #[test]
  fn test_fold_newlines() {
    let mut input = String::from("Hello\n\n\nWorld");
    fold_whitespace(None, &mut input);
    assert_eq!(input, "Hello World", "Output: {input:?}");
  }

  #[test]
  fn test_fold_tabs_and_spaces() {
    let mut input = String::from("Hello\t\t  \tWorld\t\t!");
    fold_whitespace(None, &mut input);
    assert_eq!(input, "Hello World !", "Output: {input:?}");
  }

  #[test]
  fn test_fold_mixed_whitespace() {
    let mut input = String::from(" \t Hello   \n World\t  \r\n !\t ok \n ");
    fold_whitespace(None, &mut input);
    assert_eq!(input, "Hello World ! ok", "Output: {input:?}");
  }

  #[test]
  fn test_leading_trailing_whitespace() {
    let mut input = String::from("   \n\n   Hello World   \n\n   ");
    fold_whitespace(None, &mut input);
    assert_eq!(input, "Hello World", "Output: {input:?}");
  }

  #[test]
  fn test_only_whitespace() {
    let mut input = String::from("     \t\n    \r\n  ");
    fold_whitespace(None, &mut input);
    assert_eq!(input, "", "Output: {input:?}");
  }

  #[test]
  fn test_empty_string() {
    let mut input = String::from("");
    fold_whitespace(None, &mut input);
    assert_eq!(input, "", "Output: {input:?}");
  }

  #[test]
  fn test_single_word() {
    let mut input = String::from("Hello");
    fold_whitespace(None, &mut input);
    assert_eq!(input, "Hello", "Output: {input:?}");
  }

  #[test]
  fn test_multiple_spaces_between_words() {
    let mut input = String::from("Hello     World");
    fold_whitespace(None, &mut input);
    assert_eq!(input, "Hello World", "Output: {input:?}");
  }

  #[test]
  fn test_no_whitespace() {
    let mut input = String::from("HelloWorld!");
    fold_whitespace(None, &mut input);
    assert_eq!(input, "HelloWorld!", "Output: {input:?}");
  }

  #[test]
  fn test_whitespace_around_punctuation() {
    let mut input = String::from("Hello   ,   World   !   ");
    fold_whitespace(None, &mut input);
    assert_eq!(input, "Hello , World !", "Output: {input:?}");
  }

  #[test]
  fn test_unicode_whitespace() {
    let mut input = String::from("   Hello\u{00A0}World"); // Non-breaking space
    fold_whitespace(None, &mut input);
    assert_eq!(input, "Hello World", "Output: {input:?}");
  }

  #[test]
  fn test_consecutive_newlines_tabs_spaces() {
    let mut input = String::from("\n\n\t\t   Hello\n\n\t  World\t \t\n");
    fold_whitespace(None, &mut input);
    assert_eq!(input, "Hello World", "Output: {input:?}");
  }

  #[test]
  fn test_large_whitespace_block() {
    let mut input = "  ".repeat(1000) + "Hello   World  " + &"  ".repeat(1000);
    fold_whitespace(None, &mut input);
    assert_eq!(input, "Hello World", "Output: {input:?}");
  }

  #[test]
  fn test_text_with_various_spaces_between_sentences() {
    let mut input = String::from("This    is     a    test.     Fold    it     well.");
    fold_whitespace(None, &mut input);
    assert_eq!(input, "This is a test. Fold it well.", "Output: {input:?}");
  }

  #[test]
  fn test_non_ascii_characters() {
    let mut input = String::from("   こんにちは   世界   ");
    fold_whitespace(None, &mut input);
    assert_eq!(input, "こんにちは 世界", "Output: {input:?}");
  }

  #[test]
  fn test_whitespace_between_digits() {
    let mut input = String::from("1  2  3    4    5");
    fold_whitespace(None, &mut input);
    assert_eq!(input, "1 2 3 4 5", "Output: {input:?}");
  }
}
