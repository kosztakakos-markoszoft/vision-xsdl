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
// Ide mentjük el a workspace változóit, hogy gépeléskor ne kelljen a lemezről olvasni
let globalVariableCache = new Set();
// Regex a változók felismeréséhez (pl. "  GyortVm.k1_uzemel:  " vagy "sgPLC01_adat_vetel1: bool")
const variableRegex = /^[ \t]*([a-zA-Z0-9_\.]+)[ \t]*:/gm;
const isInvalidVariable = (name) => {
    const upperName = name.toUpperCase();
    return ['BEGIN', 'END', 'DO', 'STATIC'].includes(upperName) ||
        /^[A-Z]{2,3}[0-9]+$/.test(name); // Pl. LR20, TX12 kiszűrése
};
// Segédfüggvény: Egy szövegblokk elemzése és változók kinyerése
function extractVariablesFromText(text, targetSet) {
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
            const pattern = new vscode.RelativePattern(folder, '**/*.{xsdl,val,var,sdl}');
            const files = await vscode.workspace.findFiles(pattern);
            for (const file of files) {
                try {
                    const fileData = await vscode.workspace.fs.readFile(file);
                    const content = new TextDecoder('utf-8').decode(fileData);
                    extractVariablesFromText(content, globalVariableCache);
                }
                catch (error) {
                    console.error(`Hiba a ${file.fsPath} olvasásakor:`, error);
                }
            }
        }
    }
    console.log(`Cache frissítve. Talált PLC változók száma: ${globalVariableCache.size}`);
}
function activate(context) {
    console.log('A Vision XSDL kiterjesztés aktiválódott!');
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
        provideCompletionItems(document, position) {
            const completionItems = [];
            const localVariables = new Set();
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
            const keywords = [
                'BEGIN', 'END', 'DO', 'STATIC', 'FI',
                'if', 'then', 'else', 'while', 'for', 'to', 'downto', 'repeat', 'until', 'function', 'Procedure',
                'ushort', 'shortstring', 'bool', 'integer', 'real', 'dword', 'double', 'word',
                'Discretes', 'Reals', 'DirectWords', 'Morestates', 'Discretetrends', 'Realtrends', 'Morestatetrends'
            ];
            keywords.forEach(kw => {
                const isType = ['ushort', 'shortstring', 'bool', 'integer', 'real', 'dword', 'double', 'word'].includes(kw);
                const kind = isType ? vscode.CompletionItemKind.Struct : vscode.CompletionItemKind.Keyword;
                completionItems.push(new vscode.CompletionItem(kw, kind));
            });
            return completionItems;
        }
    });
    context.subscriptions.push(provider);
}
function deactivate() {
    globalVariableCache.clear();
}
//# sourceMappingURL=extension.js.map