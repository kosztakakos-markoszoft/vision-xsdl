import * as vscode from 'vscode';
import { parseXsdl } from './parser/runner';

// A korábbi Cache logikád itt maradhat az IntelliSense-hez (globalVariableCache, extractVariablesFromText...)
// ... [A KORÁBBAN MEGÍRT INTELLISENSE KÓDOD HELYE] ...

export function activate(context: vscode.ExtensionContext) {
    // --- Hibaellenőrzés (Diagnostics) AST Parserrel ---
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('xsdl');
    context.subscriptions.push(diagnosticCollection);

    function updateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection) {
        if (!['xsdl', 'val', 'var', 'sdl'].some(ext => document.fileName.endsWith(`.${ext}`))) {
            return;
        }

        const text = document.getText();
        // Meghívjuk a saját Parserünket!
        const parseResult = parseXsdl(text);
        const diagnostics: vscode.Diagnostic[] = [];

        // 1. Lexer hibák feldolgozása (pl. ismeretlen karakter a kódban)
        parseResult.lexErrors.forEach(err => {
            const range = new vscode.Range(
                err.line! - 1, err.column! - 1,
                err.line! - 1, err.column! - 1 + err.length
            );
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

export function deactivate() {}