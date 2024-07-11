(
  (call_expression
   function: (identifier) @_func
   arguments:
     [
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
               (ternary_expression)
               (update_expression)
               (unary_expression)
               (binary_expression)
               (parenthesized_expression)
             ] @value
           )
         )
       )
       (arguments
         (_)
         (_ ",")*
         [
           (identifier)
           (member_expression)
           (subscript_expression)
           (template_string)
           (ternary_expression)
           (update_expression)
           (unary_expression)
           (binary_expression)
           (parenthesized_expression)
         ] @param
       )
     ]
  )

  (#eq? @_func "jsx")
)
