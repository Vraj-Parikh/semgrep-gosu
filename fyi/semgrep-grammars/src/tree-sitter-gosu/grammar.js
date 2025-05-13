/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

/**
 * Grammar for the Gosu programming language could not work in compiler
 * **********************************************************
 * feature_literal
 */

/**
 * Keyword for the Gosu programming language could not find implementation
 * **********************************************************
 * application,session,request,execution,outer,hide,except,find,where,contains,startswith,exists,length,typeloader,structure
 * where,find -> like c# linq (nothing to add in grammar)
 */

// GOSU does not support _ in digits
// const DIGITS = token(
//   choice("0", seq(/[1-9]/, optional(seq(optional("_"), sep1(/[0-9]+/, /_+/)))))
// );
const DECIMAL_DIGITS = token(sep1(/[0-9]+/, "_"));
const HEX_DIGITS = token(sep1(/[A-Fa-f0-9]+/, "_"));

/* eslint-disable no-multi-spaces */

const PREC = {
  // https://introcs.cs.princeton.edu/java/11precedence/
  COMMENT: 0, // //  /*  */
  ASSIGN: 1, // =  += -=  *=  /=  %=  &=  ^=  |=  <<=  >>=  >>>=
  DECL: 2,
  ELEMENT_VAL: 2,
  TERNARY: 3, // ?:
  OR: 4, // ||
  AND: 5, // &&
  BIT_OR: 6, // |
  BIT_XOR: 7, // ^
  BIT_AND: 8, // &
  EQUALITY: 9, // ==  !=
  GENERIC: 10,
  REL: 10, // <  <=  >  >=  instanceof -> change to typeis for gosu
  SHIFT: 11, // <<  >>  >>>
  ADD: 12, // +  -
  MULT: 13, // *  /  %
  CAST: 14, // (Type)
  OBJ_INST: 14, // new
  UNARY: 15, // ++a  --a  a++  a--  +  -  !  ~
  POSTFIX: 16,
  ARRAY: 17, // [Index]
  OBJ_ACCESS: 17, // .
  PARENS: 17, // (Expression)
  CLASS_LITERAL: 18, // .
};

/* eslint-enable no-multi-spaces */

module.exports = grammar({
  name: "gosu",
  // for automatic semicolon insertion
  externals: ($) => [$._automatic_semicolon],

  extras: ($) => [$.line_comment, $.block_comment, /\s/],

  supertypes: ($) => [
    $.expression,
    $.declaration,
    $.statement,
    $.primary_expression,
    $._literal,
    $._type,
    $._simple_type,
    $._unannotated_type,
    $.module_directive,
  ],

  inline: ($) => [
    $._name,
    $._simple_type,
    $._class_body_declaration,
    $._variable_initializer,
  ],

  conflicts: ($) => [
    [$.modifiers, $.annotated_type, $.receiver_parameter],
    [
      $.modifiers,
      $.annotated_type,
      // $.module_declaration,
      $.package_declaration,
    ],
    // [$._unannotated_type, $.primary_expression, $.inferred_parameters],
    [$._unannotated_type, $.primary_expression],
    [$._unannotated_type, $.primary_expression, $.scoped_type_identifier],
    [$._unannotated_type, $.scoped_type_identifier],
    [$._unannotated_type, $.generic_type],
    // [$.generic_type, $.primary_expression],
    [$.expression, $.statement],
    // Only conflicts in switch expressions
    // [$.lambda_expression, $.primary_expression],
    // [$.inferred_parameters, $.primary_expression],
    [$.argument_list, $.record_pattern_body],
    // [$.yield_statement, $._reserved_identifier],
    // [$.primary_expression, $._variable_declarator_id, $._unannotated_type],
    // [$._variable_declarator_id, $._unannotated_type],
    // [$._variable_declarator_id, $.primary_expression],
    [$.array_initializer, $.map_initializer],
    [$.expression, $.array_access],
    [$.primary_expression, $.type_literal_expression],
    [$.receiver_parameter, $.modifiers],
    [$.annotated_type, $.modifiers],
    [$.block_literal_type, $.array_type],
    [$.element_value_array_initializer, $.map_initializer, $.array_initializer],
    [$.primary_expression, $.method_invocation, $.generic_type],
    [$.field_access, $.method_invocation],
    [$.generic_type, $.method_invocation],
    [$.expression, $.field_access, $.template_expression],
    [$.block, $.map_initializer, $.array_initializer],
    [$.block_definition_expression, $.method_invocation],
  ],

  word: ($) => $.identifier,

  rules: {
    program: ($) => repeat($._toplevel_statement),

    _toplevel_statement: ($) =>
      choice($.statement, $.method_declaration, $.enhancement_declaration),
    // _toplevel_statement: ($) => choice($.statement, field("method declare",$.method_declaration)),

    // Enhancement Declaration
    enhancement_declaration: ($) =>
      seq(
        "enhancement",
        field("enhancement_name", $.identifier),
        optional(field("type_parameters", $.type_parameters)),
        ":",
        field("enhancement_on", $._unannotated_type),
        field("enhancement_block", $.enhancement_body)
      ),
    enhancement_body: ($) =>
      seq(
        "{",
        field("enhancement_functions", repeat($.method_declaration)),
        "}"
      ),
    // Literals
    _literal: ($) =>
      choice(
        $.decimal_integer_literal,
        $.hex_integer_literal,
        $.octal_integer_literal,
        $.binary_integer_literal,
        $.decimal_floating_point_literal,
        $.hex_floating_point_literal,
        $.true,
        $.false,
        $.character_literal,
        $.string_literal,
        $.null_literal,
        $.infinity_literal,
        $.nan_literal
      ),
    infinity_literal: (_) => token("Infinity"),
    nan_literal: (_) => token("NaN"),
    decimal_integer_literal: ($) =>
      token(
        seq(
          DECIMAL_DIGITS,
          optional(choice("l", "L", "s", "S", "bi", "BI", "b", "B"))
        )
      ),
    // decimal_integer_literal: ($) =>
    //   token(
    //     seq(DIGITS, optional(choice("l", "L", "s", "S", "bi", "BI", "b", "B")))
    //   ),

    hex_integer_literal: ($) =>
      token(
        seq(
          choice("0x", "0X"),
          HEX_DIGITS,
          optional(choice("l", "L", "s", "S"))
        )
      ),

    octal_integer_literal: (_) =>
      token(
        seq(
          choice("0o", "0O", "0"),
          sep1(/[0-7]+/, "_"),
          optional(choice("l", "L"))
        )
      ),

    binary_integer_literal: ($) =>
      token(
        seq(
          choice("0b", "0B"),
          sep1(/[01]+/, "_"),
          optional(choice("l", "L", "s", "S", "bi", "BI", "b", "B"))
        )
      ),
    decimal_floating_point_literal: ($) =>
      token(
        choice(
          seq(
            ".",
            DECIMAL_DIGITS,
            optional(choice("f", "F", "d", "D", "bd", "BD"))
          ),
          seq(
            DECIMAL_DIGITS,
            choice(
              seq(
                optional(seq(".", DECIMAL_DIGITS)),
                optional(
                  seq(
                    choice("e", "E"),
                    optional(choice("+", "-")),
                    DECIMAL_DIGITS
                  )
                ),
                optional(choice("f", "F", "d", "D", "bd", "BD"))
              )
            )
          )
        )
      ),
    // decimal_floating_point_literal: ($) =>
    //   token(
    //     choice(
    //       field(
    //         "type1",
    //         seq(
    //           DECIMAL_DIGITS,
    //           ".",
    //           optional(DECIMAL_DIGITS),
    //           optional(seq(/[eE]/, optional(choice("-", "+")), DECIMAL_DIGITS)),
    //           optional(choice("f", "F", "d", "D", "bd", "BD"))
    //         )
    //       ),
    //       field(
    //         "type2",
    //         seq(
    //           ".",
    //           DECIMAL_DIGITS,
    //           optional(seq(/[eE]/, optional(choice("-", "+")), DECIMAL_DIGITS)),
    //           optional(choice("f", "F", "d", "D", "bd", "BD"))
    //         )
    //       ),
    //       field(
    //         "type3",
    //         seq(
    //           // DIGITS, // remove this
    //           DECIMAL_DIGITS,
    //           /[eE]/,
    //           optional(choice("-", "+")),
    //           DECIMAL_DIGITS,
    //           optional(choice("f", "F", "d", "D", "bd", "BD"))
    //         )
    //       ),
    //       field(
    //         "type4",
    //         seq(
    //           // DIGITS, // remove this
    //           DECIMAL_DIGITS,
    //           optional(seq(/[eE]/, optional(choice("-", "+")), DECIMAL_DIGITS)),
    //           choice("f", "F", "d", "D", "bd", "BD")
    //         )
    //       )
    //     )
    //   ),

    hex_floating_point_literal: (_) =>
      token(
        seq(
          choice("0x", "0X"),
          choice(
            seq(HEX_DIGITS, optional(".")),
            seq(optional(HEX_DIGITS), ".", HEX_DIGITS)
          ),
          optional(
            seq(
              /[pP]/,
              optional(choice("-", "+")),
              // DIGITS,
              DECIMAL_DIGITS,
              optional(choice("f", "F", "d", "D", "bd", "BD"))
            )
          )
        )
      ),

    true: (_) => "true",

    false: (_) => "false",

    character_literal: (_) =>
      token(seq("'", repeat1(choice(/[^\\'\n]/, /\\./, /\\\n/)), "'")),

    string_literal: ($) =>
      choice($._string_literal, $._multiline_string_literal),
    _string_literal: ($) =>
      seq(
        '"',
        repeat(
          choice($.string_fragment, $.escape_sequence, $.string_interpolation)
        ),
        '"'
      ),
    _multiline_string_literal: ($) =>
      seq(
        '"""',
        repeat(
          choice(
            alias($._multiline_string_fragment, $.multiline_string_fragment),
            $._escape_sequence,
            $.string_interpolation
          )
        ),
        '"""'
      ),
    // Workaround to https://github.com/tree-sitter/tree-sitter/issues/1156
    // We give names to the token() constructs containing a regexp
    // so as to obtain a node in the CST.

    string_fragment: (_) => token.immediate(prec(1, /[^"\\]+/)),
    _multiline_string_fragment: (_) => choice(/[^"\\]+/, /"([^"\\]|\\")*/),

    string_interpolation: ($) => seq("\\{", $.expression, "}"),

    _escape_sequence: ($) =>
      choice(
        // prec(2, token.immediate(seq("\\", /[^bfnrts'\"\\]/))),
        prec(2, token.immediate(seq("\\", /[^vabtnfr"'\\$<]/))), // changed it according to gosu grammar
        prec(1, $.escape_sequence)
      ),
    escape_sequence: (_) =>
      token.immediate(
        seq(
          "\\",
          choice(
            /[^xu0-7]/, // any character except u, x, 0-7
            /[0-7]{1,3}/, // octal esacape
            /x[0-9a-fA-F]{2}/, // hex esacape
            /u[0-9a-fA-F]{4}/, //unicode esacape
            /u\{[0-9a-fA-F]+\}/ // unicode esacape
          )
        )
      ),

    null_literal: (_) => "null",

    // Expressions

    expression: ($) =>
      choice(
        field("binary_expression", $.binary_expression),
        field("primary_expression", $.primary_expression),
        field("assignment_expression", $.assignment_expression),
        field("typeis_expression", $.typeis_expression),
        field("block_definition_expression", $.block_definition_expression),
        field("ternary_expression", $.ternary_expression),
        field("update_expression", $.update_expression),
        field("unary_expression", $.unary_expression),
        field("cast_expression", $.cast_expression),
        field("switch_expression", $.switch_expression),
        field("type_literal_expression", $.type_literal_expression)
      ),
    type_literal_expression: ($) =>
      seq(choice("typeof", "statictypeof"), $.parenthesized_expression),
    cast_expression: ($) =>
      prec.right(
        PREC.CAST,
        choice(
          seq("(", field("type", $._type), ")", field("value", $.expression)),
          // seq(field("value", $.expression), "as", field("type", $._type)),
          seq(
            field("value", $.expression),
            choice("as", "typeas"),
            field("type", $._type)
          ),
          seq(
            "(",
            sep1(field("type", $._type), "&"),
            ")",
            field(
              "value",
              choice($.primary_expression, $.block_definition_expression)
            )
          )
        )
      ),

    assignment_expression: ($) =>
      prec.right(
        PREC.ASSIGN,
        seq(
          field(
            "left",
            choice(
              $.identifier,
              // $._reserved_identifier,
              $.field_access,
              $.array_access
            )
          ),
          field(
            "operator",
            choice(
              "=",
              "+=",
              "-=",
              "*=",
              "/=",
              "&=",
              "&&=",
              "|=",
              "||=",
              "^=",
              "%=",
              "<<=",
              ">>=",
              ">>>="
            )
          ),
          // added _variable_initializer to include array and map initializer
          field("right", $._variable_initializer)
        )
      ),

    binary_expression: ($) =>
      choice(
        ...[
          [">", PREC.REL],
          ["<", PREC.REL],
          [">=", PREC.REL],
          ["<=", PREC.REL],
          ["==", PREC.EQUALITY],
          ["===", PREC.EQUALITY],
          ["!==", PREC.EQUALITY],
          ["!=", PREC.EQUALITY],
          ["<>", PREC.EQUALITY],
          ["and", PREC.AND],
          ["&&", PREC.AND],
          ["or", PREC.OR],
          ["||", PREC.OR],
          ["+", PREC.ADD],
          ["?+", PREC.ADD],
          ["!+", PREC.ADD],
          ["-", PREC.ADD],
          ["?-", PREC.ADD],
          ["!-", PREC.ADD],
          ["*", PREC.MULT],
          ["?*", PREC.MULT],
          ["!*", PREC.MULT],
          ["/", PREC.MULT],
          ["?/", PREC.MULT],
          ["&", PREC.BIT_AND],
          ["|", PREC.BIT_OR],
          ["^", PREC.BIT_XOR],
          ["%", PREC.MULT],
          ["?%", PREC.MULT],
          ["<<", PREC.SHIFT],
          [">>", PREC.SHIFT],
          [">>>", PREC.SHIFT],
        ].map(([operator, precedence]) =>
          prec.left(
            precedence,
            seq(
              field("left", $.expression),
              // @ts-ignore
              field("operator", operator),
              field("right", $.expression)
            )
          )
        )
      ),

    typeis_expression: ($) =>
      prec(
        PREC.REL,
        seq(
          field("left", $.expression),
          "typeis",
          optional("final"),
          choice(
            seq(
              field("right", $._type),
              // optional(
              //   field("name", choice($.identifier, $._reserved_identifier))
              // )
              optional(field("name", $.identifier))
            ),
            field("pattern", $.record_pattern)
          )
        )
      ),

    // lambda_expression: ($) =>
    // gosu version of lambda expression called block definition (begins with \)
    block_definition_expression: ($) =>
      seq(
        "\\",
        field(
          "parameters",
          commaSep1(seq($.identifier, optional(seq(":", $._unannotated_type))))
          // choice(
          //   seq($.identifier, optional(seq(":", $._unannotated_type))),
          //   $.formal_parameters,
          //   $.inferred_parameters
          //   // $._reserved_identifier
          // )
        ),
        "->",
        field("body", choice($.expression, $.block))
      ),

    // inferred_parameters: ($) =>
    //   seq("(", commaSep1(choice($.identifier, $._reserved_identifier)), ")"),

    // TODO : Add Type for identifier
    inferred_parameters: ($) => seq("(", commaSep1($.identifier), ")"),

    ternary_expression: ($) =>
      prec.right(
        PREC.TERNARY,
        seq(
          field("condition", $.expression),
          "?",
          field("consequence", $.expression),
          ":",
          field("alternative", $.expression)
        )
      ),

    unary_expression: ($) =>
      choice(
        ...[
          ["+", PREC.UNARY],
          ["-", PREC.UNARY],
          ["!", PREC.UNARY],
          ["~", PREC.UNARY],
          // Add Gosu specific unary operators
          ["not", PREC.UNARY],
          ["typeof", PREC.UNARY],
          ["statictypeof", PREC.UNARY],
        ].map(([operator, precedence]) =>
          prec.left(
            precedence,
            // @ts-ignore
            seq(field("operator", operator), field("operand", $.expression))
          )
        ),
        $.postfix_update_expression
      ),

    postfix_update_expression: ($) =>
      prec.left(
        PREC.POSTFIX,
        seq(
          field("operand", $.expression),
          field("operator", choice(token("++"), token("--")))
        )
      ),

    update_expression: ($) =>
      prec.left(
        PREC.UNARY,
        choice(
          // Post (in|de)crement is evaluated before pre (in|de)crement
          seq($.expression, "++"),
          seq($.expression, "--")
        )
      ),

    primary_expression: ($) =>
      choice(
        $._literal,
        $.class_literal,
        $.this,
        // TODO: add support for Gosu's "super" keyword
        // $.super,
        $.identifier,
        // $._reserved_identifier,
        $.parenthesized_expression,
        $.object_creation_expression,
        $.field_access,
        $.array_access,
        $.method_invocation,
        $.method_reference,
        $.array_creation_expression,
        $.template_expression
      ),

    array_creation_expression: ($) =>
      prec.right(
        seq(
          "new",
          repeat($._annotation),
          field("type", $._simple_type),
          choice(
            seq(
              field("dimensions", repeat1($.dimensions_expr)),
              field("dimensions", optional($.dimensions))
            ),
            seq(
              field("dimensions", $.dimensions),
              field("value", $.array_initializer)
            )
          )
        )
      ),

    dimensions_expr: ($) => seq(repeat($._annotation), "[", $.expression, "]"),

    parenthesized_expression: ($) => seq("(", $.expression, ")"),

    class_literal: ($) =>
      prec.dynamic(PREC.CLASS_LITERAL, seq($._unannotated_type, ".", "class")),

    // not available in gosu
    object_creation_expression: ($) =>
      // choice(
      $._unqualified_object_creation_expression,
    // seq(
    //   $.primary_expression,
    //   ".",
    //   $._unqualified_object_creation_expression
    // )
    // ),

    _unqualified_object_creation_expression: ($) =>
      prec.right(
        seq(
          "new",
          choice(
            seq(
              repeat($._annotation),
              field("type_arguments", $.type_arguments),
              repeat($._annotation)
            ),
            repeat($._annotation)
          ),
          field("type", $._simple_type),
          field("arguments", $.argument_list),
          // optional($.class_body)
          // for gosu object initializer or inline class override
          optional(
            seq(
              "{",
              choice(
                field("object_initializer", commaSep($.object_initializer)),
                field("inline_class_override", commaSep($.method_declaration))
              ),
              "}"
            )
          )
          // optional(seq("{", commaSep($.field_declaration), "}"))
        )
      ),
    // inline_class_override: ($) => commaSep($.method_declaration),
    object_initializer: ($) =>
      seq(
        ":",
        // field(
        //   "name",
        //   choice($.identifier, $._reserved_identifier, $.underscore_pattern)
        // ),
        field("name", choice($.identifier, $.underscore_pattern)),
        "=",
        field("value", $._variable_initializer)
        // field(
        //   "value",
        //   choice($.statement, $.array_initializer, $.map_initializer)
        // )
      ),
    field_access: ($) =>
      seq(
        field("object", choice($.primary_expression, $.super)),
        // optional(seq(".", $.super)),
        // ".",
        // indirect member access added for gosu
        field("field_access_operator", choice(".", "?.", "*.")),
        // field("field", choice($.identifier, $._reserved_identifier, $.this))
        field("field", choice($.identifier, $.this))
      ),

    template_expression: ($) =>
      seq(
        field("template_processor", $.primary_expression),
        ".",
        field("template_argument", $.string_literal)
      ),

    array_access: ($) =>
      seq(
        field("array", $.primary_expression),
        // null safe operator for array access added for gosu
        optional("?"),
        "[",
        field("index", $.expression),
        "]"
      ),

    method_invocation: ($) =>
      seq(
        choice(
          // field("name", choice($.identifier, $._reserved_identifier)),
          field("name", $.identifier),
          seq(
            // field("object", choice($.primary_expression, $.super)),
            field("object", choice($._variable_initializer, $.super)),
            ".",
            // optional(seq($.super, ".")),
            // TODO change it
            // field("name", choice($.identifier, $._reserved_identifier))
            field("name", $.identifier)
            // in gosu type arguments are after the method name
            // field("type_arguments", optional($.type_arguments)),
          )
        ),
        optional(field("type_arguments", $.type_arguments)),
        field("arguments", $.argument_list)
        // $._semicolon
      ),

    argument_list: ($) =>
      // seq("(", commaSep(choice($.expression, $.array_initializer)), ")"),
      seq("(", commaSep($._variable_initializer), ")"),

    method_reference: ($) =>
      seq(
        choice($._type, $.primary_expression, $.super),
        "::",
        optional($.type_arguments),
        choice("new", $.identifier)
      ),

    type_arguments: ($) => seq("<", commaSep(choice($._type, $.wildcard)), ">"),

    wildcard: ($) =>
      seq(repeat($._annotation), "?", optional($._wildcard_bounds)),

    _wildcard_bounds: ($) =>
      choice(seq("extends", $._type), seq($.super, $._type)),

    dimensions: ($) =>
      prec.right(repeat1(seq(repeat($._annotation), "[", "]"))),

    switch_expression: ($) =>
      seq(
        "switch",
        field("condition", $.parenthesized_expression),
        field("body", $.switch_block)
      ),

    switch_block: ($) =>
      seq(
        "{",
        choice(repeat($.switch_block_statement_group), repeat($.switch_rule)),
        "}"
      ),

    switch_block_statement_group: ($) =>
      prec.left(seq(repeat1(seq($.switch_label, ":")), repeat($.statement))),

    switch_rule: ($) =>
      seq(
        $.switch_label,
        "->",
        choice($.expression_statement, $.throw_statement, $.block)
      ),

    switch_label: ($) =>
      choice(
        seq(
          "case",
          choice($.pattern, commaSep1($.expression)),
          optional($.guard)
        ),
        "default"
      ),

    pattern: ($) => choice($.type_pattern, $.record_pattern),
    // type_pattern: ($) =>
    //   seq($._unannotated_type, choice($.identifier, $._reserved_identifier)),
    type_pattern: ($) => seq($._unannotated_type, $.identifier),
    record_pattern: ($) =>
      seq(
        // choice($.identifier, $._reserved_identifier, $.generic_type),
        choice($.identifier, $.generic_type),
        $.record_pattern_body
      ),
    record_pattern_body: ($) =>
      seq(
        "(",
        commaSep(choice($.record_pattern_component, $.record_pattern)),
        ")"
      ),
    record_pattern_component: ($) =>
      choice(
        $.underscore_pattern,
        // seq($._unannotated_type, choice($.identifier, $._reserved_identifier))
        seq($._unannotated_type, $.identifier)
      ),

    underscore_pattern: (_) => "_",

    guard: ($) => seq("when", $.expression),

    // Statements

    statement: ($) =>
      choice(
        field("declaration", $.declaration),
        field("expression_statement", $.expression_statement),
        field("labeled_statement", $.labeled_statement),
        field("if_statement", $.if_statement),
        field("while_statement", $.while_statement),
        field("for_statement", $.for_statement),
        field("for_statement_enhanced", $.enhanced_for_statement),
        field("block", $.block),
        field("semicolon", ";"),
        field("assert_statement", $.assert_statement),
        field("do_statement", $.do_statement),
        field("break_statement", $.break_statement),
        field("continue_statement", $.continue_statement),
        field("return_statement", $.return_statement),
        field("yield_statement", $.yield_statement),
        field("switch_expression", $.switch_expression), // switch statements and expressions are identical
        field("synchronized_statement", $.synchronized_statement),
        field("local_variable_declaration", $.local_variable_declaration),
        field(
          "block_literal_variable_declaration",
          $.block_literal_variable_declaration
        ),
        field("throw_statement", $.throw_statement),
        field("try_statement", $.try_statement),
        field("try_with_resources_statement", $.try_with_resources_statement),
        field("eval_statement", $.eval_statement),
        field("using_statement", $.using_statement),
        field("super_statement", $.super_statement)
      ),
    // for parent constructor call
    super_statement: ($) => seq($.super, $.argument_list),
    using_statement: ($) =>
      seq(
        "using",
        "(",
        choice(commaSep1($.localVarStatement), $.expression),
        ")",
        field("using_statement_block", $.block),
        optional($.finally_clause)
      ),
    localVarStatement: ($) =>
      seq(
        "var",
        field("name", choice($.identifier, $.underscore_pattern)),
        choice(
          seq(
            seq(":", $._type),
            // optional(seq("as", optional("readonly"), $.identifier)),
            optional(
              seq(choice("as", "typeas"), optional("readonly"), $.identifier)
            ),
            optional(seq("=", field("value", $.expression)))
          ),
          seq("=", field("value", $.expression))
        )
      ),
    eval_statement: ($) =>
      seq(
        "eval",
        "(",
        choice($.binary_expression, $.unary_expression, $.ternary_expression),
        ")"
      ),
    block: ($) => seq("{", repeat($.statement), "}"),

    expression_statement: ($) =>
      seq(
        field("expression", $.expression),
        // ";"
        $._semicolon
      ),

    labeled_statement: ($) => seq($.identifier, ":", $.statement),

    assert_statement: ($) =>
      choice(
        seq("assert", $.expression, $._semicolon),
        seq("assert", $.expression, ":", $.expression, $._semicolon)
      ),

    do_statement: ($) =>
      seq(
        "do",
        field("body", $.statement),
        "while",
        field("condition", $.parenthesized_expression),
        $._semicolon
      ),

    break_statement: ($) => seq("break", optional($.identifier), $._semicolon),

    continue_statement: ($) =>
      seq("continue", optional($.identifier), $._semicolon),

    return_statement: ($) =>
      seq(
        "return",
        // can return array or map as well along with expression
        optional($._variable_initializer),
        // optional($.expression),
        $._semicolon
        //';',
      ),

    yield_statement: ($) => seq("yield", $.expression, ";"),

    synchronized_statement: ($) =>
      seq("synchronized", $.parenthesized_expression, field("body", $.block)),

    throw_statement: ($) => seq("throw", $.expression, $._semicolon),

    try_statement: ($) =>
      seq(
        "try",
        field("body", $.block),
        choice(
          repeat1($.catch_clause),
          seq(repeat($.catch_clause), $.finally_clause)
        )
      ),

    catch_clause: ($) =>
      seq("catch", "(", $.catch_formal_parameter, ")", field("body", $.block)),

    catch_formal_parameter: ($) =>
      // seq( $.catch_type, $._variable_declarator_id),
      seq(
        $.identifier,
        field(
          "catch_type_statement",
          optional(seq(":", field("catch_type", $.identifier)))
        )
      ),

    catch_type: ($) => sep1($._unannotated_type, "|"),

    finally_clause: ($) => seq("finally", field("body", $.block)),

    try_with_resources_statement: ($) =>
      seq(
        "try",
        field("resources", $.resource_specification),
        field("body", $.block),
        repeat($.catch_clause),
        optional($.finally_clause)
      ),

    resource_specification: ($) =>
      seq("(", sep1($.resource, ";"), optional(";"), ")"),

    resource: ($) =>
      choice(
        seq(
          optional($.modifiers),
          field("type", $._unannotated_type),
          $._variable_declarator_id,
          "=",
          field("value", $.expression)
        ),
        $.identifier,
        $.field_access
      ),

    if_statement: ($) =>
      prec.right(
        seq(
          "if",
          field("condition", $.parenthesized_expression),
          field("consequence", $.statement),
          optional(seq("else", field("alternative", $.statement)))
        )
      ),

    while_statement: ($) =>
      seq(
        "while",
        field("condition", $.parenthesized_expression),
        field("body", $.statement)
      ),

    // for_statement: $ => seq(
    //   'for', '(',
    //   choice(
    //     field('init', $.local_variable_declaration),
    //     seq(
    //       commaSep(field('init', $.expression)),
    //       ';',
    //     ),
    //   ),
    //   field('condition', optional($.expression)), ';',
    //   commaSep(field('update', $.expression)), ')',
    //   field('body', $.statement),
    // ),
    for_statement: ($) =>
      seq(
        choice("foreach", "for"),
        "(",
        // No Need for choice here
        // choice(
        // seq($.expression, optional($.indexVar)),
        // seq(
        optional("var"),
        $.identifier,
        "in",
        $.expression,
        optional($.indexRest),
        // )
        // ),
        ")",
        field("body", $.statement),
        $._semicolon
      ),

    indexVar: ($) => seq("index", $.identifier),
    indexRest: ($) =>
      choice(
        seq($.indexVar, optional($.iteratorVar)),
        seq($.iteratorVar, optional($.indexVar))
      ),
    iteratorVar: ($) => seq("iterator", $.identifier),
    enhanced_for_statement: ($) =>
      seq(
        choice("foreach", "for"),
        "(",
        optional("var"),
        $.identifier,
        "in",
        field("range_expression", $.range_expression),
        ")",
        field("body", $.statement),
        $._semicolon
      ),
    range_expression: ($) =>
      seq(
        field("start_value", $.expression),
        field(
          "interval_operator",
          prec(100, token(choice("..", "|..", "..|", "|..|")))
          // field("interval_operator", alias(token(/\|?\.\.\|?/), $.interval_op)),
        ),
        field("end_value", $.expression)
      ),
    // interval_operator: ($) =>
    //   ,

    // Annotations

    _annotation: ($) => choice($.marker_annotation, $.annotation),

    marker_annotation: ($) => seq("@", field("name", $._name)),

    annotation: ($) =>
      seq(
        "@",
        field("name", $._name),
        field("arguments", $.annotation_argument_list)
      ),

    annotation_argument_list: ($) =>
      seq("(", choice($._element_value, commaSep($.element_value_pair)), ")"),

    element_value_pair: ($) =>
      seq(
        // field("key", choice($.identifier, $._reserved_identifier)),
        field("key", $.identifier),
        "=",
        field("value", $._element_value)
      ),

    _element_value: ($) =>
      prec(
        PREC.ELEMENT_VAL,
        choice(
          $.expression,
          field("array_initializer", $.element_value_array_initializer),
          $._annotation
        )
      ),

    element_value_array_initializer: ($) =>
      seq("{", commaSep($._element_value), optional(","), "}"),

    // Declarations

    declaration: ($) =>
      prec(
        PREC.DECL,
        choice(
          // $.module_declaration,
          $.package_declaration,
          $.classpath_declaration,
          // not used in gosu
          // $.import_declaration,
          $.uses_declaration,
          // $.record_declaration,
          $.class_declaration,
          $.interface_declaration,
          $.annotation_type_declaration,
          $.enum_declaration
        )
      ),
    classpath_declaration: ($) =>
      seq("classpath", '"', $._name, '"', $._semicolon),
    // module_declaration: ($) =>
    //   seq(
    //     repeat($._annotation),
    //     optional("open"),
    //     "module",
    //     field("name", $._name),
    //     field("body", $.module_body)
    //   ),

    module_body: ($) => seq("{", repeat($.module_directive), "}"),

    module_directive: ($) =>
      choice(
        $.requires_module_directive,
        $.exports_module_directive,
        $.opens_module_directive,
        $.uses_module_directive,
        $.provides_module_directive
      ),

    requires_module_directive: ($) =>
      seq(
        "requires",
        repeat(field("modifiers", $.requires_modifier)),
        field("module", $._name),
        ";"
      ),

    requires_modifier: (_) => choice("transitive", "static"),

    exports_module_directive: ($) =>
      seq(
        "exports",
        field("package", $._name),
        optional(
          seq(
            "to",
            field("modules", $._name),
            repeat(seq(",", field("modules", $._name)))
          )
        ),
        ";"
      ),

    opens_module_directive: ($) =>
      seq(
        "opens",
        field("package", $._name),
        optional(
          seq(
            "to",
            field("modules", $._name),
            repeat(seq(",", field("modules", $._name)))
          )
        ),
        ";"
      ),

    uses_module_directive: ($) =>
      seq(
        "uses",
        field("type", $._name),
        //';',
        $._semicolon
      ),

    provides_module_directive: ($) =>
      seq(
        "provides",
        field("provided", $._name),
        "with",
        $._name,
        repeat(seq(",", field("provider", $._name))),
        ";"
      ),

    package_declaration: ($) =>
      seq(repeat($._annotation), "package", $._name, $._semicolon),

    // Not used in gosu
    // import_declaration: ($) =>
    //   seq(
    //     "import",
    //     optional("static"),
    //     $._name,
    //     optional(seq(".", $.asterisk)),
    //     ";"
    //   ),

    uses_declaration: ($) =>
      seq(
        "uses",
        optional("static"),
        $._name,
        optional(seq(".", $.asterisk)),
        $._semicolon
      ),

    asterisk: (_) => "*",

    enum_declaration: ($) =>
      seq(
        optional($.modifiers),
        "enum",
        field("name", $.identifier),
        // field("interfaces", optional($.super_interfaces)),
        field("body", $.enum_body)
      ),

    enum_body: ($) =>
      seq(
        "{",
        commaSep($.enum_constant),
        optional(","),
        // optional($.enum_body_declarations),
        "}"
      ),

    // enum_body_declarations: ($) => seq(";", repeat($._class_body_declaration)),

    enum_constant: ($) =>
      seq(
        optional($.modifiers),
        field("name", $.identifier),
        field("arguments", optional($.argument_list)),
        field("body", optional($.class_body))
      ),

    class_declaration: ($) =>
      seq(
        optional($.modifiers),
        "class",
        field("name", $.identifier),
        optional(field("type_parameters", $.type_parameters)),
        optional(field("superclass", $.superclass)),
        optional(field("interfaces", $.super_interfaces)),
        optional(field("permits", $.permits)),
        field("body", $.class_body)
      ),

    modifiers: ($) =>
      repeat1(
        choice(
          $._annotation,
          "private",
          "internal",
          "protected",
          "public",
          "static",
          "abstract",
          "override",
          "final",
          "transient"
        )
      ),

    type_parameters: ($) => seq("<", commaSep1($.type_parameter), ">"),

    type_parameter: ($) =>
      seq(
        // No annotations here in gosu grammar ebnf
        // repeat($._annotation),
        alias($.identifier, $.type_identifier),
        optional($.type_bound)
      ),

    type_bound: ($) => seq("extends", $._type, repeat(seq("&", $._type))),

    superclass: ($) => seq("extends", $._type),

    super_interfaces: ($) => seq("implements", $.type_list),

    type_list: ($) => seq($._type, repeat(seq(",", $._type))),

    permits: ($) => seq("permits", $.type_list),

    // TODO abstract class not working conflict b/w method defination and declaration
    class_body: ($) => seq("{", repeat($._class_body_declaration), "}"),

    _class_body_declaration: ($) =>
      choice(
        $.field_declaration,
        $.property_declaration,
        $.method_declaration,
        // $.method_defination,
        // field("method declare",$.method_declaration),
        // field("method define",$.method_defination),
        $.class_declaration,
        $.interface_declaration,
        $.enum_declaration,
        $.static_initializer,
        $.constructor_declaration,
        field("delegate_declaration", $.delegate_declaration),
        ";"
      ),
    delegate_declaration: ($) =>
      seq("delegate", $.identifier, "represents", $.identifier),
    property_declaration: ($) =>
      seq(
        optional($.modifiers),
        "property",
        choice("get", "set"),
        $.identifier,
        $.fnparameters,
        optional(seq(":", $._unannotated_type)),
        $.block
      ),

    static_initializer: ($) => seq("static", $.block),

    constructor_declaration: ($) =>
      seq(
        "construct",
        // required for gosu
        $.formal_parameters,
        // optional($.formal_parameters),
        field("body", $.constructor_body)
      ),

    constructor_body: ($) => seq("{", repeat($.statement), "}"),

    explicit_constructor_invocation: ($) =>
      seq(
        choice(
          seq(
            field("type_arguments", optional($.type_arguments)),
            field("constructor", choice($.this, $.super))
          ),
          seq(
            field("object", choice($.primary_expression)),
            ".",
            field("type_arguments", optional($.type_arguments)),
            field("constructor", $.super)
          )
        ),
        field("arguments", $.argument_list),
        ";"
      ),

    // _name: ($) =>
    //   choice($.identifier, $._reserved_identifier, $.scoped_identifier),
    _name: ($) => choice($.identifier, $.scoped_identifier),

    scoped_identifier: ($) =>
      seq(field("scope", $._name), ".", field("name", $.identifier)),

    // field_declaration: ($) =>
    //   seq(
    //     optional($.modifiers),
    //     "var",
    //     $._variable_declarator_list,
    //     $._semicolon
    //   ),
    field_declaration: ($) =>
      seq(
        optional(field("modifier", $.modifiers)),
        "var",
        // used in multiple places so added as a rule
        $.variable_declarator,
        $._semicolon
      ),

    // record_declaration: ($) =>
    //   seq(
    //     optional($.modifiers),
    //     "record",
    //     field("name", $.identifier),
    //     optional(field("type_parameters", $.type_parameters)),
    //     field("parameters", $.formal_parameters),
    //     optional(field("interfaces", $.super_interfaces)),
    //     field("body", $.class_body)
    //   ),

    // TODO: @interface is not valid in gosu
    annotation_type_declaration: ($) =>
      seq(
        optional($.modifiers),
        "@interface",
        field("name", $.identifier),
        field("body", $.annotation_type_body)
      ),

    annotation_type_body: ($) =>
      seq(
        "{",
        repeat(
          choice(
            $.annotation_type_element_declaration,
            $.constant_declaration,
            $.class_declaration,
            $.interface_declaration,
            $.enum_declaration,
            $.annotation_type_declaration,
            ";"
          )
        ),
        "}"
      ),

    annotation_type_element_declaration: ($) =>
      seq(
        optional($.modifiers),
        field("type", $._unannotated_type),
        // field("name", choice($.identifier, $._reserved_identifier)),
        field("name", $.identifier),
        "(",
        ")",
        field("dimensions", optional($.dimensions)),
        optional($._default_value),
        ";"
      ),

    _default_value: ($) => seq("default", field("value", $._element_value)),

    interface_declaration: ($) =>
      seq(
        optional($.modifiers),
        "interface",
        field("name", $.identifier),
        field("type_parameters", optional($.type_parameters)),
        optional($.extends_interfaces),
        optional(field("permits", $.permits)),
        field("body", $.interface_body)
      ),

    extends_interfaces: ($) => seq("extends", $.type_list),

    // TODO interface not working conflict b/w method defination and declaration
    interface_body: ($) =>
      seq(
        "{",
        repeat(
          choice(
            $.constant_declaration,
            $.enum_declaration,
            // $.method_declaration,
            $.method_defination,
            // field("method declare",$.method_declaration),
            // field("method define",$.method_defination),
            $.class_declaration,
            $.interface_declaration,
            // $.record_declaration,
            $.annotation_type_declaration,
            ";"
          )
        ),
        "}"
      ),

    constant_declaration: ($) =>
      seq(
        optional($.modifiers),
        "var",
        $.variable_declarator,
        $._semicolon
        // ";"
      ),
    // constant_declaration: ($) =>
    //   seq(
    //     optional($.modifiers),
    //     field("type", $._unannotated_type),
    //     $._variable_declarator_list,
    //     $._semicolon
    //     // ";"
    //   ),

    // _variable_declarator_list: ($) =>
    //   commaSep1(field("declarator", $.variable_declarator)),
    // field("name", choice($.identifier, $.underscore_pattern)),
    //     choice(
    //       seq(
    //         seq(":", $._type),
    //         optional(seq("as", optional("readonly"), $.identifier)),
    //         optional(seq("=", field("value", $.expression)))
    //       ),
    //       seq("=", field("value", $.expression))
    //     ),
    variable_declarator: ($) =>
      seq(
        field(
          "name",
          // choice($.identifier, $._reserved_identifier, $.underscore_pattern)
          choice($.identifier, $.underscore_pattern)
        ),
        choice(
          seq(
            seq(":", $._unannotated_type),
            // optional(seq("as", optional("readonly"), $.identifier)),
            optional(
              seq(choice("as", "typeas"), optional("readonly"), $.identifier)
            ),
            optional(seq("=", field("value", $._variable_initializer)))
          ),
          seq("=", field("value", $._variable_initializer))
        )
      ),
    // variable_declarator: ($) =>
    //   seq(
    //     $._variable_declarator_id,
    //     optional(seq("=", field("value", $._variable_initializer)))
    //   ),

    _variable_declarator_id: ($) =>
      seq(
        field(
          "name",
          // choice($.identifier, $._reserved_identifier, $.underscore_pattern)
          choice($.identifier, $.underscore_pattern)
        ),
        field("dimensions", optional($.dimensions))
      ),

    _variable_initializer: ($) =>
      choice($.expression, $.array_initializer, $.map_initializer),
    // added support for map initializer
    map_initializer: ($) =>
      seq(
        "{",
        commaSep(seq($._variable_initializer, "->", $._variable_initializer)),
        optional(","),
        "}"
      ),

    array_initializer: ($) =>
      seq("{", commaSep($._variable_initializer), optional(","), "}"),

    // Types

    _type: ($) => choice($._unannotated_type, $.annotated_type),

    _unannotated_type: ($) => choice($._simple_type, $.array_type),

    _simple_type: ($) =>
      choice(
        $.void_type,
        $.integral_type,
        $.floating_point_type,
        $.boolean_type,
        alias($.identifier, $.type_identifier),
        $.scoped_type_identifier,
        $.generic_type,
        $.block_literal_type
      ),
    block_literal_type: ($) =>
      seq(
        "block",
        field("parameters", $.fnparameters),
        seq(":", field("type", $._unannotated_type))
      ),
    annotated_type: ($) => seq(repeat1($._annotation), $._unannotated_type),

    scoped_type_identifier: ($) =>
      seq(
        choice(
          alias($.identifier, $.type_identifier),
          $.scoped_type_identifier,
          $.generic_type
        ),
        ".",
        repeat($._annotation),
        alias($.identifier, $.type_identifier)
      ),

    generic_type: ($) =>
      prec.dynamic(
        PREC.GENERIC,
        seq(
          choice(
            alias($.identifier, $.type_identifier),
            $.scoped_type_identifier
          ),
          $.type_arguments
        )
      ),

    array_type: ($) =>
      seq(
        field("element", $._unannotated_type),
        field("dimensions", $.dimensions)
      ),

    integral_type: (_) => choice("byte", "short", "int", "long", "char"),

    floating_point_type: (_) => choice("float", "double"),

    boolean_type: (_) => "boolean",

    void_type: (_) => "void",

    _method_header: ($) =>
      seq(
        // optional(
        //   seq(
        //     field("type_parameters", $.type_parameters),
        //     repeat($._annotation)
        //   )
        // ),
        $._method_declarator,
        optional(seq(":", field("type", $._unannotated_type)))
      ),
    _method_declarator: ($) =>
      seq(
        // field("name", choice($.identifier, $._reserved_identifier)),
        field("name", $.identifier),
        // added type_parameters after because in gosu it is after the function name unlike java where it is before
        optional(field("type_parameters", $.type_parameters)),
        field("parameters", $.fnparameters)
      ),

    fnparameterDeclaration: ($) =>
      seq(
        optional(repeat($.annotation)),
        optional("final"),
        $.identifier,
        seq(
          optional(seq(":", $._unannotated_type)),
          optional(seq("=", $.expression))
        )
      ),

    fnparameterDeclarationList: ($) =>
      seq($.fnparameterDeclaration, repeat(seq(",", $.fnparameterDeclaration))),

    fnparameters: ($) =>
      seq(
        "(",
        commaSep(choice($.fnparameterDeclaration, $.block_literal_identifier)),
        ")"
      ),
    // _method_declarator: ($) =>
    //   seq(
    //     field("name", choice($.identifier, $._reserved_identifier)),
    //     field("parameters", $.formal_parameters),
    //     field("dimensions", optional($.dimensions))
    //   ),

    // formal_parameters: ($) =>
    //   seq(
    //     "(",
    //     choice(
    //       $.receiver_parameter,
    //       seq(
    //         optional(seq($.receiver_parameter, ",")),
    //         // TODO remove spread parameter from here
    //         // Gosu does not support spread parameter
    //         commaSep(choice($.formal_parameter, $.spread_parameter))
    //         // commaSep($.formal_parameter)
    //       )
    //     ),
    //     ")"
    //   ),
    // receiver_parameter not used in gosu so changed the rule accordingly
    formal_parameters: ($) => seq("(", commaSep($.formal_parameter), ")"),

    formal_parameter: ($) =>
      seq(
        // TODO: add support for final keyword
        // optional("final"),
        $._variable_declarator_id,
        // added support for default parameter value
        choice(
          seq(
            ":",
            field("type", $._unannotated_type),
            optional(seq("=", field("value", $.expression)))
          ),
          seq("=", field("value", $.expression))
        )
        // ":",
        // field("type", $._unannotated_type),
      ),

    // TODO: check if gosu supports this
    receiver_parameter: ($) =>
      seq(
        repeat($._annotation),
        $._unannotated_type,
        repeat(seq($.identifier, ".")),
        $.this
      ),

    spread_parameter: ($) =>
      seq(
        optional($.modifiers),
        $._unannotated_type,
        "...",
        repeat($._annotation),
        $.variable_declarator
      ),

    throws: ($) => seq("throws", commaSep1($._type)),
    local_variable_declaration: ($) =>
      seq(
        optional(field("modifier", $.modifiers)),
        "var",
        $.variable_declarator,
        $._semicolon
        //';',
      ),
    block_literal_variable_declaration: ($) =>
      seq(
        optional(field("modifier", $.modifiers)),
        "var",
        $.block_literal_identifier,
        $._semicolon
      ),
    block_literal_identifier: ($) =>
      seq(
        $.identifier,
        field("parameters", $.fnparameters),
        seq(":", field("type", $._unannotated_type)),
        field("value", optional(seq("=", $.expression)))
      ),
    // local_variable_declaration: ($) =>
    //   seq(
    //     optional($.modifiers),
    //     field("type", $._unannotated_type),
    //     $._variable_declarator_list,
    //     $._semicolon
    //     //';',
    //   ),

    method_declaration: ($) =>
      seq(
        optional($.modifiers),
        "function",
        $._method_header,
        // optional(field("body", $.block)),
        field("body", $.block),
        $._semicolon
      ),
    method_defination: ($) =>
      seq(optional($.modifiers), "function", $._method_header, $._semicolon),
    // seq(optional($.modifiers), "function", $._method_header, "/[^\n]*/"),

    compact_constructor_declaration: ($) =>
      seq(
        optional($.modifiers),
        field("name", $.identifier),
        field("body", $.block)
      ),

    // changed the rule to add support for automatic semicolon
    _semicolon: ($) => choice($._automatic_semicolon, ";"),
    // _semicolon: ($) => choice(/[^\n]*/, ";"),

    // Not used in gosu
    // _reserved_identifier: ($) =>
    //   choice(
    //     prec(
    //       -3,
    //       alias(
    //         choice("open", "module", "record", "with", "sealed"),
    //         $.identifier
    //       )
    //     ),
    //     alias("yield", $.identifier)
    //   ),

    this: (_) => "this",

    super: (_) => "super",

    // https://docs.oracle.com/javase/specs/jls/se8/html/jls-3.html#jls-IdentifierChars
    // @ts-ignore
    // identifier: (_) => /[\p{XID_Start}_$][\p{XID_Continue}\u00A2_$]*/,
    identifier: (_) => /[A-Za-z_$][A-Za-z0-9_$]*/,

    line_comment: (_) => token(prec(PREC.COMMENT, seq("//", /[^\n]*/))),

    // http://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
    block_comment: (_) =>
      token(prec(PREC.COMMENT, seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/"))),
  },
});

/**
 * Creates a rule to match one or more of the rules separated by `separator`
 *
 * @param {RuleOrLiteral} rule
 *
 * @param {RuleOrLiteral} separator
 *
 * @returns {SeqRule}
 */
function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}

/**
 * Creates a rule to match one or more of the rules separated by a comma
 *
 * @param {RuleOrLiteral} rule
 *
 * @returns {SeqRule}
 */
function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

/**
 * Creates a rule to optionally match one or more of the rules separated by a comma
 *
 * @param {RuleOrLiteral} rule
 *
 * @returns {ChoiceRule}
 */
function commaSep(rule) {
  return optional(commaSep1(rule));
}
