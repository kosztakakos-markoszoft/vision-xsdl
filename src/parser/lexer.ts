import { createToken, Lexer } from "chevrotain";

// 1. Üres helyek (Whitespace) és Kommentek
// A "group: Lexer.SKIPPED" azt jelenti, hogy felismerjük őket, de el is dobjuk, 
// így a Parsernek nem kell a szóközökkel és kommentekkel foglalkoznia.
export const WhiteSpace = createToken({ name: "WhiteSpace", pattern: /\s+/, group: Lexer.SKIPPED });
export const Comment = createToken({ name: "Comment", pattern: /'.*/, group: Lexer.SKIPPED });

// 2. Azonosítók (Változók és függvények nevei, pl. "GyortVm.k1_uzemel")
export const Identifier = createToken({ name: "Identifier", pattern: /[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_]+)*/ });

// 3. Kulcsszavak (Keywords)
// A "longer_alt: Identifier" FONTOS! Ez akadályozza meg, hogy pl. az "iframe" változónevet "if"-nek nézze.
export const KwIf = createToken({ name: "KwIf", pattern: /if/i, longer_alt: Identifier });
export const KwThen = createToken({ name: "KwThen", pattern: /then/i, longer_alt: Identifier });
export const KwElse = createToken({ name: "KwElse", pattern: /else/i, longer_alt: Identifier });
export const KwFi = createToken({ name: "KwFi", pattern: /fi/i, longer_alt: Identifier });
export const KwCase = createToken({ name: "KwCase", pattern: /case/i, longer_alt: Identifier });
export const KwOf = createToken({ name: "KwOf", pattern: /of/i, longer_alt: Identifier });
export const KwEnd = createToken({ name: "KwEnd", pattern: /end/i, longer_alt: Identifier });
export const KwProcedure = createToken({ name: "KwProcedure", pattern: /Procedure/i, longer_alt: Identifier });
export const KwBegin = createToken({ name: "KwBegin", pattern: /BEGIN/i, longer_alt: Identifier });

// Kifejezés (Expression) kulcsszavak (Ezek egyben operátorok is)
export const OpAnd = createToken({ name: "OpAnd", pattern: /and/i, longer_alt: Identifier });
export const OpOr = createToken({ name: "OpOr", pattern: /or/i, longer_alt: Identifier });
export const OpXor = createToken({ name: "OpXor", pattern: /xor/i, longer_alt: Identifier });
export const OpNot = createToken({ name: "OpNot", pattern: /not/i, longer_alt: Identifier });
export const OpDiv = createToken({ name: "OpDiv", pattern: /div/i, longer_alt: Identifier });
export const OpMod = createToken({ name: "OpMod", pattern: /mod/i, longer_alt: Identifier });

// 4. Szimbólumok, Operátorok és Írásjelek
export const DoubleColon = createToken({ name: "DoubleColon", pattern: /::/ });
export const Colon = createToken({ name: "Colon", pattern: /:/ });
export const Semicolon = createToken({ name: "Semicolon", pattern: /;/ });
export const Comma = createToken({ name: "Comma", pattern: /,/ });
export const LBrace = createToken({ name: "LBrace", pattern: /\(/ });
export const RBrace = createToken({ name: "RBrace", pattern: /\)/ });
export const LSquare = createToken({ name: "LSquare", pattern: /\[/ });
export const RSquare = createToken({ name: "RSquare", pattern: /\]/ });

// Relációs operátorok (Figyelem: A >= előbb kell legyen a listában, mint a > !)
export const OpNotEqual = createToken({ name: "OpNotEqual", pattern: /<>/ });
export const OpLessOrEqual = createToken({ name: "OpLessOrEqual", pattern: /<=/ });
export const OpGreaterOrEqual = createToken({ name: "OpGreaterOrEqual", pattern: />=/ });
export const OpLess = createToken({ name: "OpLess", pattern: /</ });
export const OpGreater = createToken({ name: "OpGreater", pattern: />/ });
export const OpEqual = createToken({ name: "OpEqual", pattern: /=/ });

// Matematikai operátorok
export const OpPower = createToken({ name: "OpPower", pattern: /\^/ });
export const OpPlus = createToken({ name: "OpPlus", pattern: /\+/ });
export const OpMinus = createToken({ name: "OpMinus", pattern: /-/ });
export const OpMultiply = createToken({ name: "OpMultiply", pattern: /\*/ });
export const OpDivide = createToken({ name: "OpDivide", pattern: /\// });

// 5. Literálok (Számok, Szövegek, Típusreferenciák)
export const NumberLiteral = createToken({ name: "NumberLiteral", pattern: /\b[0-9]+(?:\.[0-9]+)?\b/ });
export const StringLiteral = createToken({ name: "StringLiteral", pattern: /"[^"\\]*(?:\\.[^"\\]*)*"/ });
export const AtReference = createToken({ name: "AtReference", pattern: /@[a-zA-Z0-9_]+/ });

// 6. Tokenek regisztrálása a Lexer számára (A SORREND KRITIKUS!)
// A Lexer felülről lefelé haladva próbálja illeszteni a szöveget ezekre a mintákra.
export const allTokens = [
    WhiteSpace,
    Comment,
    
    // 1. Kulcsszavak
    KwIf, KwThen, KwElse, KwFi, KwCase, KwOf, KwEnd, KwProcedure, KwBegin,
    OpAnd, OpOr, OpXor, OpNot, OpDiv, OpMod,
    
    // 2. Többkarakteres szimbólumok (pl. "::" megelőzi a ":"-t)
    DoubleColon, OpNotEqual, OpLessOrEqual, OpGreaterOrEqual,
    
    // 3. Egykarakteres szimbólumok
    Colon, Semicolon, Comma, LBrace, RBrace, LSquare, RSquare,
    OpEqual, OpLess, OpGreater, OpPower, OpPlus, OpMinus, OpMultiply, OpDivide,
    
    // 4. Literálok és változók a legvégén
    NumberLiteral,
    StringLiteral,
    AtReference,
    Identifier
];

// Létrehozzuk magát a Lexert
export const XsdlLexer = new Lexer(allTokens);