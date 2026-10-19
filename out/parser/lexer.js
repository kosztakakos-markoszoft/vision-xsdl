"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XsdlLexer = exports.allTokens = exports.AtReference = exports.StringLiteral = exports.NumberLiteral = exports.OpDivide = exports.OpMultiply = exports.OpMinus = exports.OpPlus = exports.OpPower = exports.OpEqual = exports.OpGreater = exports.OpLess = exports.OpGreaterOrEqual = exports.OpLessOrEqual = exports.OpNotEqual = exports.RSquare = exports.LSquare = exports.RBrace = exports.LBrace = exports.Comma = exports.Semicolon = exports.Colon = exports.DoubleColon = exports.OpMod = exports.OpDiv = exports.OpNot = exports.OpXor = exports.OpOr = exports.OpAnd = exports.KwBegin = exports.KwProcedure = exports.KwEnd = exports.KwOf = exports.KwCase = exports.KwFi = exports.KwElse = exports.KwThen = exports.KwIf = exports.Identifier = exports.Comment = exports.WhiteSpace = void 0;
const chevrotain_1 = require("chevrotain");
// 1. Üres helyek (Whitespace) és Kommentek
// A "group: Lexer.SKIPPED" azt jelenti, hogy felismerjük őket, de el is dobjuk, 
// így a Parsernek nem kell a szóközökkel és kommentekkel foglalkoznia.
exports.WhiteSpace = (0, chevrotain_1.createToken)({ name: "WhiteSpace", pattern: /\s+/, group: chevrotain_1.Lexer.SKIPPED });
exports.Comment = (0, chevrotain_1.createToken)({ name: "Comment", pattern: /'.*/, group: chevrotain_1.Lexer.SKIPPED });
// 2. Azonosítók (Változók és függvények nevei, pl. "GyortVm.k1_uzemel")
exports.Identifier = (0, chevrotain_1.createToken)({ name: "Identifier", pattern: /[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_]+)*/ });
// 3. Kulcsszavak (Keywords)
// A "longer_alt: Identifier" FONTOS! Ez akadályozza meg, hogy pl. az "iframe" változónevet "if"-nek nézze.
exports.KwIf = (0, chevrotain_1.createToken)({ name: "KwIf", pattern: /if/i, longer_alt: exports.Identifier });
exports.KwThen = (0, chevrotain_1.createToken)({ name: "KwThen", pattern: /then/i, longer_alt: exports.Identifier });
exports.KwElse = (0, chevrotain_1.createToken)({ name: "KwElse", pattern: /else/i, longer_alt: exports.Identifier });
exports.KwFi = (0, chevrotain_1.createToken)({ name: "KwFi", pattern: /fi/i, longer_alt: exports.Identifier });
exports.KwCase = (0, chevrotain_1.createToken)({ name: "KwCase", pattern: /case/i, longer_alt: exports.Identifier });
exports.KwOf = (0, chevrotain_1.createToken)({ name: "KwOf", pattern: /of/i, longer_alt: exports.Identifier });
exports.KwEnd = (0, chevrotain_1.createToken)({ name: "KwEnd", pattern: /end/i, longer_alt: exports.Identifier });
exports.KwProcedure = (0, chevrotain_1.createToken)({ name: "KwProcedure", pattern: /Procedure/i, longer_alt: exports.Identifier });
exports.KwBegin = (0, chevrotain_1.createToken)({ name: "KwBegin", pattern: /BEGIN/i, longer_alt: exports.Identifier });
// Kifejezés (Expression) kulcsszavak (Ezek egyben operátorok is)
exports.OpAnd = (0, chevrotain_1.createToken)({ name: "OpAnd", pattern: /and/i, longer_alt: exports.Identifier });
exports.OpOr = (0, chevrotain_1.createToken)({ name: "OpOr", pattern: /or/i, longer_alt: exports.Identifier });
exports.OpXor = (0, chevrotain_1.createToken)({ name: "OpXor", pattern: /xor/i, longer_alt: exports.Identifier });
exports.OpNot = (0, chevrotain_1.createToken)({ name: "OpNot", pattern: /not/i, longer_alt: exports.Identifier });
exports.OpDiv = (0, chevrotain_1.createToken)({ name: "OpDiv", pattern: /div/i, longer_alt: exports.Identifier });
exports.OpMod = (0, chevrotain_1.createToken)({ name: "OpMod", pattern: /mod/i, longer_alt: exports.Identifier });
// 4. Szimbólumok, Operátorok és Írásjelek
exports.DoubleColon = (0, chevrotain_1.createToken)({ name: "DoubleColon", pattern: /::/ });
exports.Colon = (0, chevrotain_1.createToken)({ name: "Colon", pattern: /:/ });
exports.Semicolon = (0, chevrotain_1.createToken)({ name: "Semicolon", pattern: /;/ });
exports.Comma = (0, chevrotain_1.createToken)({ name: "Comma", pattern: /,/ });
exports.LBrace = (0, chevrotain_1.createToken)({ name: "LBrace", pattern: /\(/ });
exports.RBrace = (0, chevrotain_1.createToken)({ name: "RBrace", pattern: /\)/ });
exports.LSquare = (0, chevrotain_1.createToken)({ name: "LSquare", pattern: /\[/ });
exports.RSquare = (0, chevrotain_1.createToken)({ name: "RSquare", pattern: /\]/ });
// Relációs operátorok (Figyelem: A >= előbb kell legyen a listában, mint a > !)
exports.OpNotEqual = (0, chevrotain_1.createToken)({ name: "OpNotEqual", pattern: /<>/ });
exports.OpLessOrEqual = (0, chevrotain_1.createToken)({ name: "OpLessOrEqual", pattern: /<=/ });
exports.OpGreaterOrEqual = (0, chevrotain_1.createToken)({ name: "OpGreaterOrEqual", pattern: />=/ });
exports.OpLess = (0, chevrotain_1.createToken)({ name: "OpLess", pattern: /</ });
exports.OpGreater = (0, chevrotain_1.createToken)({ name: "OpGreater", pattern: />/ });
exports.OpEqual = (0, chevrotain_1.createToken)({ name: "OpEqual", pattern: /=/ });
// Matematikai operátorok
exports.OpPower = (0, chevrotain_1.createToken)({ name: "OpPower", pattern: /\^/ });
exports.OpPlus = (0, chevrotain_1.createToken)({ name: "OpPlus", pattern: /\+/ });
exports.OpMinus = (0, chevrotain_1.createToken)({ name: "OpMinus", pattern: /-/ });
exports.OpMultiply = (0, chevrotain_1.createToken)({ name: "OpMultiply", pattern: /\*/ });
exports.OpDivide = (0, chevrotain_1.createToken)({ name: "OpDivide", pattern: /\// });
// 5. Literálok (Számok, Szövegek, Típusreferenciák)
exports.NumberLiteral = (0, chevrotain_1.createToken)({ name: "NumberLiteral", pattern: /\b[0-9]+(?:\.[0-9]+)?\b/ });
exports.StringLiteral = (0, chevrotain_1.createToken)({ name: "StringLiteral", pattern: /"[^"\\]*(?:\\.[^"\\]*)*"/ });
exports.AtReference = (0, chevrotain_1.createToken)({ name: "AtReference", pattern: /@[a-zA-Z0-9_]+/ });
// 6. Tokenek regisztrálása a Lexer számára (A SORREND KRITIKUS!)
// A Lexer felülről lefelé haladva próbálja illeszteni a szöveget ezekre a mintákra.
exports.allTokens = [
    exports.WhiteSpace,
    exports.Comment,
    // 1. Kulcsszavak
    exports.KwIf,
    exports.KwThen,
    exports.KwElse,
    exports.KwFi,
    exports.KwCase,
    exports.KwOf,
    exports.KwEnd,
    exports.KwProcedure,
    exports.KwBegin,
    exports.OpAnd,
    exports.OpOr,
    exports.OpXor,
    exports.OpNot,
    exports.OpDiv,
    exports.OpMod,
    // 2. Többkarakteres szimbólumok (pl. "::" megelőzi a ":"-t)
    exports.DoubleColon,
    exports.OpNotEqual,
    exports.OpLessOrEqual,
    exports.OpGreaterOrEqual,
    // 3. Egykarakteres szimbólumok
    exports.Colon,
    exports.Semicolon,
    exports.Comma,
    exports.LBrace,
    exports.RBrace,
    exports.LSquare,
    exports.RSquare,
    exports.OpEqual,
    exports.OpLess,
    exports.OpGreater,
    exports.OpPower,
    exports.OpPlus,
    exports.OpMinus,
    exports.OpMultiply,
    exports.OpDivide,
    // 4. Literálok és változók a legvégén
    exports.NumberLiteral,
    exports.StringLiteral,
    exports.AtReference,
    exports.Identifier
];
// Létrehozzuk magát a Lexert
exports.XsdlLexer = new chevrotain_1.Lexer(exports.allTokens);
//# sourceMappingURL=lexer.js.map