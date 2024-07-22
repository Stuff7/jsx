(
  (function_declaration
    name: (identifier) @jsx_ident
    parameters: (formal_parameters
      (identifier)
      (identifier)
      (rest_pattern)
    )
    body: (statement_block
      (expression_statement
        (string
          (string_fragment) @_directive
        )
      )
    )
  )
  (#eq? @_directive "use JSX")
)
