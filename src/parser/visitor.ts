import { XsdlParser } from "./parser";

// 1. Létrehozunk egy Parser példányt, hogy elkérjük tőle az alap Visitor osztályt
const parserInstance = new XsdlParser();
const BaseXsdlVisitor = parserInstance.getBaseCstVisitorConstructor();

// 2. Definiáljuk a tiszta adatstruktúrákat (AST Node-ok), amiket a VS Code használni fog
export interface VariableSymbol {
    name: string;
    type: string;
}

export interface ProcedureSymbol {
    name: string;
    parameters: VariableSymbol[];
}

// 3. A Visitor osztály, ami bejárja a kódot
export class XsdlAstVisitor extends BaseXsdlVisitor {
    // Ide gyűjtjük ki a fájlban talált eljárásokat
    public procedures = new Map<string, ProcedureSymbol>();

    constructor() {
        super();
        // Ellenőrzi, hogy minden Parser szabályhoz írtunk-e Visitor metódust
        this.validateVisitor();
    }

    // A fő program blokk bejárása
    program(ctx: any) {
        if (ctx.procedureDeclaration) {
            ctx.procedureDeclaration.forEach((procCtx: any) => {
                this.visit(procCtx);
            });
        }
        if (ctx.statement) {
            ctx.statement.forEach((stmtCtx: any) => {
                this.visit(stmtCtx);
            });
        }
    }

    // Procedúra deklaráció feldolgozása (Név és Paraméterek kinyerése)
    procedureDeclaration(ctx: any) {
        // A ctx.Identifier[0] az eljárás neve (pl. "EsemNyugtaNaplo")
        const procName = ctx.Identifier[0].image;
        
        let params: VariableSymbol[] = [];
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
            ctx.statement.forEach((stmtCtx: any) => {
                this.visit(stmtCtx);
            });
        }
    }

    // Paraméterlista feldolgozása (visszaadja a paraméterek tömbjét)
    parameterList(ctx: any): VariableSymbol[] {
        const params: VariableSymbol[] = [];
        
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
    
    statement(ctx: any) {
        if (ctx.ifStatement) this.visit(ctx.ifStatement[0]);
        if (ctx.caseStatement) this.visit(ctx.caseStatement[0]);
        if (ctx.assignmentOrCallStatement) this.visit(ctx.assignmentOrCallStatement[0]);
    }

    ifStatement(ctx: any) { /* Itt lehetne ellenőrizni, hogy a feltétel bool típusú-e */ }
    caseStatement(ctx: any) { /* Case ágak elemzése */ }
    caseItem(ctx: any) {}
    
    assignmentOrCallStatement(ctx: any) {
        // Itt fogjuk később ellenőrizni, hogy ha hívunk egy eljárást, 
        // megfelelő számú és típusú paramétert adtunk-e át!
    }

    // Kifejezések bejárói (üresen hagyjuk, amíg csak szimbólumokat gyűjtünk)
    expression(ctx: any) {}
    additionExpression(ctx: any) {}
    multiplicationExpression(ctx: any) {}
    unaryExpression(ctx: any) {}
    powerExpression(ctx: any) {}
    atomicExpression(ctx: any) {}
}