"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseXsdl = parseXsdl;
const lexer_1 = require("./lexer");
const parser_1 = require("./parser");
const visitor_1 = require("./visitor");
const parser = new parser_1.XsdlParser();
const visitor = new visitor_1.XsdlAstVisitor();
function parseXsdl(text) {
    // 1. Szöveg darabolása (Lexer)
    const lexingResult = lexer_1.XsdlLexer.tokenize(text);
    // 2. Szintaktikai elemzés (Parser)
    parser.input = lexingResult.tokens;
    const cst = parser.program(); // A "program" a parser.ts fő szabálya
    // 3. Fa bejárása (Visitor) - Csak ha van értelmezhető fa
    visitor.procedures.clear(); // Előző futás törlése
    if (cst) {
        visitor.visit(cst);
    }
    return {
        lexErrors: lexingResult.errors,
        parseErrors: parser.errors,
        procedures: visitor.procedures
    };
}
//# sourceMappingURL=runner.js.map