import * as vscode from 'vscode';
import { parseXsdl } from './parser/runner';

// Ide mentjük el a workspace változóit, hogy gépeléskor ne kelljen a lemezről olvasni
let globalVariableCache = new Set<string>();

// Regex a változók felismeréséhez (pl. "  GyortVm.k1_uzemel:  " vagy "sgPLC01_adat_vetel1: bool")
const variableRegex = /^[ \t]*([a-zA-Z0-9_\.]+)[ \t]*:.*$/gm;

const isInvalidVariable = (name: string) => {
    const upperName = name.toUpperCase();
    return ['BEGIN', 'END', 'DO', 'STATIC'].includes(upperName) || 
           /^[A-Z]{2,3}[0-9]+$/.test(name); // Pl. LR20, TX12 kiszűrése
};

// Segédfüggvény: Egy szövegblokk elemzése és változók kinyerése
function extractVariablesFromText(text: string, targetSet: Set<string>) {
    let match;
    while ((match = variableRegex.exec(text)) !== null) {
        const varName = match[1].trim();
        if (!isInvalidVariable(varName)) {
            targetSet.add(varName);
        }
    }
}

// Munkaterület összes fájljának beolvasása a Cache-be
async function updateWorkspaceVariableCache() {
    globalVariableCache.clear();
    
    if (vscode.workspace.workspaceFolders) {
        for (const folder of vscode.workspace.workspaceFolders) {
            // Kibővítettük a keresést: .xsdl, .val, .var, .sdl fájlokra
            const pattern = new vscode.RelativePattern(folder, '**/var*.{xsdl,val,var,sdl}');
            const files = await vscode.workspace.findFiles(pattern);
            
            for (const file of files) {
                try {
                    const fileData = await vscode.workspace.fs.readFile(file);
                    const content = new TextDecoder('utf-8').decode(fileData);
                    extractVariablesFromText(content, globalVariableCache);
                } catch (error) {
                    console.error(`Error ${file.fsPath} while reading:`, error);
                }
            }
        }
    }
}

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

    // 1. Induláskor feltöltjük a gyorsítótárat (Cache)
    updateWorkspaceVariableCache();

    // 2. Ha a felhasználó elment egy fájlt, frissítjük a Cache-t
    const saveListener = vscode.workspace.onDidSaveTextDocument((doc) => {
        if (['xsdl', 'val', 'var', 'sdl'].some(ext => doc.fileName.endsWith(`.${ext}`))) {
            updateWorkspaceVariableCache();
        }
    });
    context.subscriptions.push(saveListener);

    // 3. Maga a kódkiegészítő (IntelliSense) logika
    const provider = vscode.languages.registerCompletionItemProvider('xsdl', {
        provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
            
            const completionItems: vscode.CompletionItem[] = [];
            const localVariables = new Set<string>();

            // Jelenlegi fájl friss elemzése, ha esetleg épp most gépelt be egy új változót
            extractVariablesFromText(document.getText(), localVariables);

            // Lokális és Globális változók egyesítése
            const allVariables = new Set([...globalVariableCache, ...localVariables]);

            // Változók hozzáadása a felugró listához
            allVariables.forEach(varName => {
                const item = new vscode.CompletionItem(varName, vscode.CompletionItemKind.Variable);
                item.detail = 'PLC Változó / Objektum (XSDL)';
                completionItems.push(item);
            });

            // Alap kulcsszavak felajánlása
            const keywords:string[] = [
                'BEGIN', 'END', 'DO', 'STATIC',
                'if', 'then', 'else', 'while', 'for', 'to', 'downto', 'repeat', 'until', 'function', 'Procedure',
            ];
            keywords.forEach((kw:string) => {
                completionItems.push(new vscode.CompletionItem(kw, vscode.CompletionItemKind.Keyword));
                
            })

            const plcVarTypes:string[] = ['Constants', 'Shortints', 'Bytes', 'Integers', 'Words', 'Longints', 'DWords', 'DLongs', 'ScaledReals',
                'S5Times', 'BCDs', 'ShortintTrends', 'ByteTrends', 'IntegerTrends', 'WordTrends', 'LongintTrends', 'DWordTrends',
                'DLongTrends', 'ScaledRealTrends', 'BCDTrends', 'DirectShortints', 'DirectBytes', 'DirectIntegers', 'DirectWords',
                'DirectLongints', 'DirectDWords', 'DirectDLongs', 'BCDWords', 'Reals', 'Doubles', 'RealTrends', 'DoubleTrends',
                'Discretes', 'DiscreteTrends', 'Morestates', 'MorestateTrends', 'Messages', 'WideStrings', 'LongStrings', 'PackTimes', 'LongTimes', 'IODevices'];
            plcVarTypes.forEach((pvType:string) => {
                completionItems.push(new vscode.CompletionItem(pvType, vscode.CompletionItemKind.Class));
                
            })

            const progVarTypes:string[] = ['ushort', 'shortstring', 'bool', 'integer', 'real', 'dword', 'double', 'word'];
            progVarTypes.forEach((pvType:string) => {
                completionItems.push(new vscode.CompletionItem(pvType, vscode.CompletionItemKind.Struct));
                
            })

            return completionItems;
        }
    });

    context.subscriptions.push(provider);
}

export function deactivate() {}