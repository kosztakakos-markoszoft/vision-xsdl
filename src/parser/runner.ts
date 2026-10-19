import { XsdlLexer } from "./lexer";
import { XsdlParser } from "./parser";
import { XsdlAstVisitor } from "./visitor";
import { ILexingError, IRecognitionException } from "chevrotain";

const parser = new XsdlParser();
const visitor = new XsdlAstVisitor();

export interface ParseResult {
    lexErrors: ILexingError[];
    parseErrors: IRecognitionException[];
    procedures: Map<string, any>;
}

export function parseXsdl(text: string): ParseResult {
    // 1. Szöveg darabolása (Lexer)
    const lexingResult = XsdlLexer.tokenize(text);
    
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