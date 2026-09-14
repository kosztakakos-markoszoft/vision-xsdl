import * as vscode from 'vscode';

// Ide mentjük el a workspace változóit, hogy gépeléskor ne kelljen a lemezről olvasni
let globalVariableCache = new Set<string>();

// Regex a változók felismeréséhez (pl. "  GyortVm.k1_uzemel:  " vagy "sgPLC01_adat_vetel1: bool")
const variableRegex = /^[ \t]*([a-zA-Z0-9_\.]+)[ \t]*:/gm;

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
            const pattern = new vscode.RelativePattern(folder, '**/*.{xsdl,val,var,sdl}');
            const files = await vscode.workspace.findFiles(pattern);
            
            for (const file of files) {
                try {
                    const fileData = await vscode.workspace.fs.readFile(file);
                    const content = new TextDecoder('utf-8').decode(fileData);
                    extractVariablesFromText(content, globalVariableCache);
                } catch (error) {
                    console.error(`Hiba a ${file.fsPath} olvasásakor:`, error);
                }
            }
        }
    }
    console.log(`Cache frissítve. Talált PLC változók száma: ${globalVariableCache.size}`);
}

export function activate(context: vscode.ExtensionContext) {
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
            const keywords = [
                'BEGIN', 'END', 'DO', 'STATIC',
                'if', 'then', 'else', 'while', 'for', 'to', 'downto', 'repeat', 'until', 'function', 'Procedure',
                'ushort', 'shortstring', 'bool', 'integer', 'real', 'dword', 'double', 'word',
                'Constants', 'Shortints', 'Bytes', 'Integers', 'Words', 'Longints', 'DWords', 'DLongs', 'ScaledReals',
                'S5Times', 'BCDs', 'ShortintTrends', 'ByteTrends', 'IntegerTrends', 'WordTrends', 'LongintTrends', 'DWordTrends',
                'DLongTrends', 'ScaledRealTrends', 'BCDTrends', 'DirectShortints', 'DirectBytes', 'DirectIntegers', 'DirectWords',
                'DirectLongints', 'DirectDWords', 'DirectDLongs', 'BCDWords', 'Reals', 'Doubles', 'RealTrends', 'DoubleTrends',
                'Discretes', 'Morestates', 'Messages', 'WideStrings', 'LongStrings', 'PackTimes', 'LongTimes', 'IODevices'
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

export function deactivate() {
    globalVariableCache.clear();
}