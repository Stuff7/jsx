(
  (call_expression
   function: (identifier) @_func
   arguments:
     (arguments
       (_)
       (object
         (pair
           key: (_) @key
           value: [
             (identifier)
             (member_expression)
             (subscript_expression)
             (template_string)
             (unary_expression)
             (binary_expression)
             (parenthesized_expression)
           ] @value
         )
       )
     )
  )

  (#eq? @_func "jsx")
)
