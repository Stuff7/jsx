(
  (call_expression
   function: (identifier) @_func
   arguments:
     (arguments
       (_)
       (_)
       [
         (identifier)
         (member_expression)
         (subscript_expression)
         (template_string)
         (unary_expression)
         (binary_expression)
         (parenthesized_expression)
       ]* @param
     )
  )

  (#eq? @_func "jsx")
)
