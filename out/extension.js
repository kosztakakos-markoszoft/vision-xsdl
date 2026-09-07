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
function activate(context) {
    console.log('A Vision XSDL kiterjesztés aktiválódott!');
    const provider = vscode.languages.registerCompletionItemProvider('xsdl', {
        async provideCompletionItems(document, position, token, context) {
            const completionItems = [];
            const variableNames = new Set();
            // Új reguláris kifejezés: Megkeresi a "ValtozoNev :" formátumokat a sorok elején/közepén.
            // Lezárjuk, hogy ne vegye be az olyan kulcsszavakat mint "BEGIN:", vagy Image objektumok "TX1:"
            const variableRegex = /^\s*([a-zA-Z0-9_\.]+)\s*:/gm;
            // Kizárjuk a nem változó neveket (pl. Címkék a képeken: LR20, TX1, vagy Ciklus/Blokk nevek)
            const isInvalidVariable = (name) => {
                const upperName = name.toUpperCase();
                return ['BEGIN', 'END', 'DO', 'STATIC'].includes(upperName) ||
                    /^[A-Z]{2,3}[0-9]+$/.test(name); // Pl. LR20, TX12, SY42 kiszűrése
            };
            // Függvény, ami beolvassa a szövegből a változókat
            const parseVariablesFromText = (text) => {
                let match;
                while ((match = variableRegex.exec(text)) !== null) {
                    const varName = match[1].trim();
                    if (!isInvalidVariable(varName)) {
                        variableNames.add(varName);
                    }
                }
            };
            // 1. Jelenlegi fájl elemzése
            parseVariablesFromText(document.getText());
            // 2. Munkaterület összes többi .xsdl fájljának elemzése
            if (vscode.workspace.workspaceFolders) {
                for (const folder of vscode.workspace.workspaceFolders) {
                    const files = await vscode.workspace.findFiles(new vscode.RelativePattern(folder, '**/*.xsdl'));
                    for (const file of files) {
                        if (file.fsPath !== document.uri.fsPath) {
                            try {
                                const fileData = await vscode.workspace.fs.readFile(file);
                                const content = new TextDecoder('utf-8').decode(fileData);
                                parseVariablesFromText(content);
                            }
                            catch (error) {
                                console.error('Fájl olvasási hiba:', error);
                            }
                        }
                    }
                }
            }
            // 3. Elemek hozzáadása a listához
            variableNames.forEach(varName => {
                const item = new vscode.CompletionItem(varName, vscode.CompletionItemKind.Variable);
                item.detail = 'Változó / PLC Tag (XSDL)';
                completionItems.push(item);
            });
            // 4. XSDL Kulcsszavak és Beépített Típusok
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
function deactivate() { }
//# sourceMappingURL=extension.js.map