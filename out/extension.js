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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const runner_1 = require("./parser/runner");
// A korábbi Cache logikád itt maradhat az IntelliSense-hez (globalVariableCache, extractVariablesFromText...)
// ... [A KORÁBBAN MEGÍRT INTELLISENSE KÓDOD HELYE] ...
function activate(context) {
    console.log('A Vision XSDL kiterjesztés aktiválódott AST motorral!');
    // --- Hibaellenőrzés (Diagnostics) AST Parserrel ---
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('xsdl');
    context.subscriptions.push(diagnosticCollection);
    function updateDiagnostics(document, collection) {
        if (!['xsdl', 'val', 'var', 'sdl'].some(ext => document.fileName.endsWith(`.${ext}`))) {
            return;
        }
        const text = document.getText();
        // Meghívjuk a saját Parserünket!
        const parseResult = (0, runner_1.parseXsdl)(text);
        const diagnostics = [];
        // 1. Lexer hibák feldolgozása (pl. ismeretlen karakter a kódban)
        parseResult.lexErrors.forEach(err => {
            const range = new vscode.Range(err.line - 1, err.column - 1, err.line - 1, err.column - 1 + err.length);
            diagnostics.push(new vscode.Diagnostic(range, `Érvénytelen karakter: ${err.message}`, vscode.DiagnosticSeverity.Error));
        });
        // 2. Parser hibák feldolgozása (Hiányzó 'then', 'end', zárójel stb.)
        parseResult.parseErrors.forEach(err => {
            const token = err.token;
            // A Chevrotain 1-től indexeli a sorokat, a VS Code 0-tól
            const line = token.startLine ? token.startLine - 1 : 0;
            const startCol = token.startColumn ? token.startColumn - 1 : 0;
            const endCol = token.endColumn ? token.endColumn : startCol + 1;
            const range = new vscode.Range(line, startCol, line, endCol);
            diagnostics.push(new vscode.Diagnostic(range, `Szintaktikai hiba: ${err.message}`, vscode.DiagnosticSeverity.Error));
        });
        // 3. Típus- és Szemantikai hibák (Visitor alapján)
        // Itt tudod felhasználni a parseResult.procedures Map-et a paraméterek ellenőrzésére!
        // (Ezt majd a következő fázisban finomhangoljuk)
        collection.set(document.uri, diagnostics);
    }
    // Fájl változások figyelése
    if (vscode.window.activeTextEditor) {
        updateDiagnostics(vscode.window.activeTextEditor.document, diagnosticCollection);
    }
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => updateDiagnostics(e.document, diagnosticCollection)));
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(doc => updateDiagnostics(doc, diagnosticCollection)));
    // ... [A KORÁBBAN MEGÍRT PROVIDER (vscode.languages.registerCompletionItemProvider) HELYE] ...
}
function deactivate() { }
//# sourceMappingURL=extension.js.map