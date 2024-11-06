[
  (jsx_element
    open_tag: (jsx_opening_element
      name: (_) @tag
      attribute: (jsx_attribute
        [
          (property_identifier)
          (jsx_namespace_name)
        ] @attr
        [
          (jsx_expression (_) @value)
          (string (string_fragment) @value)
        ]*
      )*
    )
    (_)* @children
    close_tag: (_)
  )

  (jsx_element
    open_tag: (jsx_opening_element)
    (_)* @children
    close_tag: (_)
  )

  (jsx_self_closing_element
    name: (_) @tag
    attribute: (jsx_attribute
      [
        (property_identifier)
        (jsx_namespace_name)
      ] @attr
      [
        (jsx_expression (_) @value)
        (string (string_fragment) @value)
      ]*
    )*
  )
] @element
