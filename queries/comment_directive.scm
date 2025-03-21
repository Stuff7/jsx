(
  (comment) @_comment .
  (lexical_declaration
    (variable_declarator
      value: (string
       (string_fragment) @path
      )
    )
  )
  (#eq? @_comment "// jsx: string import")
)
