#include "tree_sitter/parser.h"
#include <wctype.h>

enum TokenType {
    AUTOMATIC_SEMICOLON,
};

void *tree_sitter_gosu_external_scanner_create() { return NULL; }
void tree_sitter_gosu_external_scanner_destroy(void *p) {}
unsigned tree_sitter_gosu_external_scanner_serialize(void *p, char *b) { return 0; }
void tree_sitter_gosu_external_scanner_deserialize(void *p, const char *b, unsigned n) {}

static inline void advance(TSLexer *lexer) { lexer->advance(lexer, false); }
static inline void skip(TSLexer *lexer) { lexer->advance(lexer, true); }

static bool scan_automatic_semicolon(TSLexer *lexer) {
    lexer->result_symbol = AUTOMATIC_SEMICOLON;
    lexer->mark_end(lexer);

    for (;;) {
        if (lexer->lookahead == 0) return true; // End of input
        if (lexer->lookahead == '}') return true; // Before closing brace
        if (lexer->is_at_included_range_start(lexer)) return true;

        // Check for newlines (including Unicode line breaks)
        if (lexer->lookahead == '\n' || lexer->lookahead == 0x2028 || lexer->lookahead == 0x2029) {
            break;
        }

        if (!iswspace(lexer->lookahead)) {
            return false; // No ASI if non-whitespace encountered
        }

        skip(lexer);
    }

    skip(lexer); // Skip the newline

    // Check next token to determine if ASI should happen
    switch (lexer->lookahead) {
        // Cases where ASI should NOT happen
        case '`': case ',': case ':': case ';': case '*': case '%':
        case '>': case '<': case '=': case '[': case '(': case '?':
        case '^': case '|': case '&': case '/':
            return false;

        // Special cases
        case '.':
            skip(lexer);
            return iswdigit(lexer->lookahead); // ASI before decimal literal
        case '+':
            skip(lexer);
            return lexer->lookahead == '+'; // ASI before ++ but not +
        case '-':
            skip(lexer);
            return lexer->lookahead == '-'; // ASI before -- but not -
        case '!':
            skip(lexer);
            return lexer->lookahead != '='; // ASI before ! but not !=
        case 'i': // Check for 'in' or 'instanceof'
            skip(lexer);
            if (lexer->lookahead != 'n') return true;
            skip(lexer);
            if (!iswalpha(lexer->lookahead)) return false;
            // Check for 'instanceof'
            for (unsigned i = 0; i < 8; i++) {
                if (lexer->lookahead != "stanceof"[i]) return true;
                skip(lexer);
            }
            return iswalpha(lexer->lookahead);
        default:
            return true; // Default ASI case
    }
}

bool tree_sitter_gosu_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
    if (valid_symbols[AUTOMATIC_SEMICOLON]) {
        return scan_automatic_semicolon(lexer);
    }
    return false;
}