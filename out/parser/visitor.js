"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XsdlAstVisitor = void 0;
const parser_1 = require("./parser");
// 1. Létrehozunk egy Parser példányt, hogy elkérjük tőle az alap Visitor osztályt
const parserInstance = new parser_1.XsdlParser();
const BaseXsdlVisitor = parserInstance.getBaseCstVisitorConstructor();
// 3. A Visitor osztály, ami bejárja a kódot
class XsdlAstVisitor extends BaseXsdlVisitor {
    constructor() {
        super();
        // Ide gyűjtjük ki a fájlban talált eljárásokat
        this.procedures = new Map();
        // Ellenőrzi, hogy minden Parser szabályhoz írtunk-e Visitor metódust
        this.validateVisitor();
    }
    // A fő program blokk bejárása
    program(ctx) {
        if (ctx.procedureDeclaration) {
            ctx.procedureDeclaration.forEach((procCtx) => {
                this.visit(procCtx);
            });
        }
        if (ctx.statement) {
            ctx.statement.forEach((stmtCtx) => {
                this.visit(stmtCtx);
            });
        }
    }
    // Procedúra deklaráció feldolgozása (Név és Paraméterek kinyerése)
    procedureDeclaration(ctx) {
        // A ctx.Identifier[0] az eljárás neve (pl. "EsemNyugtaNaplo")
        const procName = ctx.Identifier[0].image;
        let params = [];
        if (ctx.parameterList) {
            // Ha van paraméterlista, bejárjuk azt is
            params = this.visit(ctx.parameterList[0]);
        }
        // Eltároljuk a tiszta információt a szótárunkban
        this.procedures.set(procName, {
            name: procName,
            parameters: params
        });
        // Ha a törzsében lévő utasításokat (statements) is elemezni akarjuk a típusellenőrzéshez:
        if (ctx.statement) {
            ctx.statement.forEach((stmtCtx) => {
                this.visit(stmtCtx);
            });
        }
    }
    // Paraméterlista feldolgozása (visszaadja a paraméterek tömbjét)
    parameterList(ctx) {
        const params = [];
        // A ctx.Identifier egy tömb, amiben felváltva vannak a nevek és típusok
        // Pl: param1, ushort, param2, bool
        for (let i = 0; i < ctx.Identifier.length; i += 2) {
            const paramName = ctx.Identifier[i].image;
            const paramType = ctx.Identifier[i + 1] ? ctx.Identifier[i + 1].image : "unknown";
            params.push({ name: paramName, type: paramType.toLowerCase() });
        }
        return params;
    }
    // --- Utasítások és Kifejezések (A típusellenőrzéshez később bővítjük) ---
    statement(ctx) {
        if (ctx.ifStatement)
            this.visit(ctx.ifStatement[0]);
        if (ctx.caseStatement)
            this.visit(ctx.caseStatement[0]);
        if (ctx.assignmentOrCallStatement)
            this.visit(ctx.assignmentOrCallStatement[0]);
    }
    ifStatement(ctx) { }
    caseStatement(ctx) { }
    caseItem(ctx) { }
    assignmentOrCallStatement(ctx) {
        // Itt fogjuk később ellenőrizni, hogy ha hívunk egy eljárást, 
        // megfelelő számú és típusú paramétert adtunk-e át!
    }
    // Kifejezések bejárói (üresen hagyjuk, amíg csak szimbólumokat gyűjtünk)
    expression(ctx) { }
    additionExpression(ctx) { }
    multiplicationExpression(ctx) { }
    unaryExpression(ctx) { }
    powerExpression(ctx) { }
    atomicExpression(ctx) { }
}
exports.XsdlAstVisitor = XsdlAstVisitor;
//# sourceMappingURL=visitor.js.map