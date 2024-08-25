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
             (#not-match? @key "on:.*")
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
               (call_expression
                 function: (_) @_call_expr
                 (#not-eq? @_call_expr "jsx")
               )
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
           (call_expression
             function: (_) @_call_expr
             (#not-eq? @_call_expr "jsx")
           )
         ] @param
       )
     ]
  )

  (#eq? @_func "jsx")
)
