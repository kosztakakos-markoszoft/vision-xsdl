"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.XsdlParser = void 0;
const chevrotain_1 = require("chevrotain");
const tokens = __importStar(require("./lexer"));
class XsdlParser extends chevrotain_1.CstParser {
    constructor() {
        // Átadjuk a Lexernél definiált összes tokent
        super(tokens.allTokens);
        // --- 1. FŐ STRUKTÚRA ---
        // A fájl egy vagy több eljárásból, vagy globális utasításokból állhat
        this.program = this.RULE("program", () => {
            this.MANY(() => {
                this.OR([
                    { ALT: () => this.SUBRULE(this.procedureDeclaration) },
                    { ALT: () => this.SUBRULE(this.statement) }
                ]);
            });
        });
        // pl: Nev::Procedure (param: tipus) BEGIN ... END
        this.procedureDeclaration = this.RULE("procedureDeclaration", () => {
            this.CONSUME(tokens.Identifier);
            this.CONSUME(tokens.DoubleColon);
            this.CONSUME(tokens.KwProcedure);
            this.CONSUME(tokens.LBrace);
            this.OPTION(() => this.SUBRULE(this.parameterList));
            this.CONSUME(tokens.RBrace);
            this.CONSUME(tokens.KwBegin);
            this.MANY(() => this.SUBRULE(this.statement));
            this.CONSUME(tokens.KwEnd);
        });
        // pl: param1: ushort; param2: Xnumerics[10]
        this.parameterList = this.RULE("parameterList", () => {
            this.CONSUME(tokens.Identifier);
            this.CONSUME(tokens.Colon);
            this.CONSUME1(tokens.Identifier);
            this.OPTION(() => {
                this.CONSUME(tokens.LSquare);
                this.CONSUME(tokens.NumberLiteral); // Tömb mérete
                this.CONSUME(tokens.RSquare);
            });
            this.MANY(() => {
                this.CONSUME(tokens.Semicolon);
                this.CONSUME2(tokens.Identifier);
                this.CONSUME2(tokens.Colon);
                this.CONSUME3(tokens.Identifier);
            });
        });
        // --- 2. UTASÍTÁSOK (STATEMENTS) ---
        this.statement = this.RULE("statement", () => {
            this.OR([
                { ALT: () => this.SUBRULE(this.ifStatement) },
                { ALT: () => this.SUBRULE(this.caseStatement) },
                { ALT: () => this.SUBRULE(this.assignmentOrCallStatement) }
            ]);
        });
        this.ifStatement = this.RULE("ifStatement", () => {
            this.CONSUME(tokens.KwIf);
            this.SUBRULE(this.expression); // Feltétel
            this.CONSUME(tokens.KwThen);
            this.MANY(() => this.SUBRULE(this.statement)); // IF ág
            this.OPTION(() => {
                this.CONSUME(tokens.KwElse);
                this.MANY1(() => this.SUBRULE1(this.statement)); // ELSE ág
            });
            this.CONSUME(tokens.KwFi);
            this.OPTION1(() => this.CONSUME(tokens.Semicolon));
        });
        this.caseStatement = this.RULE("caseStatement", () => {
            this.CONSUME(tokens.KwCase);
            this.SUBRULE(this.expression);
            this.CONSUME(tokens.KwOf);
            this.MANY(() => this.SUBRULE(this.caseItem)); // Szabályos ágak
            this.OPTION(() => {
                this.CONSUME(tokens.KwElse);
                this.CONSUME(tokens.Colon);
                this.MANY1(() => this.SUBRULE(this.statement)); // Alapértelmezett ág
            });
            this.CONSUME(tokens.KwEnd);
        });
        this.caseItem = this.RULE("caseItem", () => {
            this.SUBRULE(this.expression);
            this.CONSUME(tokens.Colon);
            this.MANY(() => this.SUBRULE(this.statement));
        });
        // Kétféle lehet: Értékadás (Motor = 1;) VAGY Hívás (EsemNyugtaNaplo param1, param2;)
        this.assignmentOrCallStatement = this.RULE("assignmentOrCallStatement", () => {
            this.CONSUME(tokens.Identifier);
            // Opcionális tömb indexelés bal oldalon (pl: Tomb[i, j])
            this.OPTION(() => {
                this.CONSUME(tokens.LSquare);
                this.SUBRULE(this.expression);
                this.MANY(() => {
                    this.CONSUME(tokens.Comma);
                    this.SUBRULE1(this.expression);
                });
                this.CONSUME(tokens.RSquare);
            });
            this.OR([
                {
                    ALT: () => {
                        this.CONSUME(tokens.OpEqual);
                        this.SUBRULE2(this.expression);
                    }
                },
                {
                    ALT: () => {
                        this.SUBRULE3(this.expression); // Első param
                        this.MANY1(() => {
                            this.CONSUME1(tokens.Comma);
                            this.SUBRULE4(this.expression);
                        });
                    }
                },
                { ALT: () => { } } // Üres hívás (paraméter nélküli eljárás)
            ]);
            this.OPTION1(() => this.CONSUME(tokens.Semicolon));
        });
        // --- 3. KIFEJEZÉSEK ÉS PRECEDENCIA (EXPRESSIONS) ---
        // A precedencia alulról felfelé épül (a legerősebb van a legalsó függvényben)
        // 6. Szint: Relációs (=, <>, <, >, <=, >=)
        this.expression = this.RULE("expression", () => {
            this.SUBRULE(this.additionExpression);
            this.OPTION(() => {
                this.OR([
                    { ALT: () => this.CONSUME(tokens.OpEqual) },
                    { ALT: () => this.CONSUME(tokens.OpNotEqual) },
                    { ALT: () => this.CONSUME(tokens.OpLess) },
                    { ALT: () => this.CONSUME(tokens.OpGreater) },
                    { ALT: () => this.CONSUME(tokens.OpLessOrEqual) },
                    { ALT: () => this.CONSUME(tokens.OpGreaterOrEqual) }
                ]);
                this.SUBRULE1(this.additionExpression);
            });
        });
        // 5. Szint: Additív (+, -, or, xor)
        this.additionExpression = this.RULE("additionExpression", () => {
            this.SUBRULE(this.multiplicationExpression);
            this.MANY(() => {
                this.OR([
                    { ALT: () => this.CONSUME(tokens.OpPlus) },
                    { ALT: () => this.CONSUME(tokens.OpMinus) },
                    { ALT: () => this.CONSUME(tokens.OpOr) },
                    { ALT: () => this.CONSUME(tokens.OpXor) }
                ]);
                this.SUBRULE1(this.multiplicationExpression);
            });
        });
        // 4. Szint: Multiplikatív (*, /, div, mod, and)
        this.multiplicationExpression = this.RULE("multiplicationExpression", () => {
            this.SUBRULE(this.unaryExpression);
            this.MANY(() => {
                this.OR([
                    { ALT: () => this.CONSUME(tokens.OpMultiply) },
                    { ALT: () => this.CONSUME(tokens.OpDivide) },
                    { ALT: () => this.CONSUME(tokens.OpDiv) },
                    { ALT: () => this.CONSUME(tokens.OpMod) },
                    { ALT: () => this.CONSUME(tokens.OpAnd) }
                ]);
                this.SUBRULE1(this.unaryExpression);
            });
        });
        // 3. Szint: Unáris tagadás (not, -)
        this.unaryExpression = this.RULE("unaryExpression", () => {
            this.OPTION(() => {
                this.OR([
                    { ALT: () => this.CONSUME(tokens.OpNot) },
                    { ALT: () => this.CONSUME(tokens.OpMinus) }
                ]);
            });
            this.SUBRULE(this.powerExpression);
        });
        // 2. Szint: Hatványozás (^)
        this.powerExpression = this.RULE("powerExpression", () => {
            this.SUBRULE(this.atomicExpression);
            this.MANY(() => {
                this.CONSUME(tokens.OpPower);
                this.SUBRULE1(this.atomicExpression);
            });
        });
        // 1. Szint: Zárójelek és alapelemek (Szám, Szöveg, Változó / Tömb indexelés)
        this.atomicExpression = this.RULE("atomicExpression", () => {
            this.OR([
                {
                    ALT: () => {
                        this.CONSUME(tokens.LBrace);
                        this.SUBRULE(this.expression);
                        this.CONSUME(tokens.RBrace);
                    }
                },
                { ALT: () => this.CONSUME(tokens.NumberLiteral) },
                { ALT: () => this.CONSUME(tokens.StringLiteral) },
                {
                    ALT: () => {
                        this.CONSUME(tokens.Identifier);
                        // Opcionális indexelés változónál: Tomb[i, j]
                        this.OPTION(() => {
                            this.CONSUME(tokens.LSquare);
                            this.SUBRULE1(this.expression);
                            this.MANY(() => {
                                this.CONSUME(tokens.Comma);
                                this.SUBRULE2(this.expression);
                            });
                            this.CONSUME(tokens.RSquare);
                        });
                    }
                }
            ]);
        });
        this.performSelfAnalysis();
    }
}
exports.XsdlParser = XsdlParser;
//# sourceMappingURL=parser.js.map