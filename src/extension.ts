import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('A Vision XSDL kiterjesztés aktiválódott!');

    const provider = vscode.languages.registerCompletionItemProvider('xsdl', {
        async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
            
            const completionItems: vscode.CompletionItem[] = [];
            const variableNames = new Set<string>();

            // Új reguláris kifejezés: Megkeresi a "ValtozoNev :" formátumokat a sorok elején/közepén.
            // Lezárjuk, hogy ne vegye be az olyan kulcsszavakat mint "BEGIN:", vagy Image objektumok "TX1:"
            const variableRegex = /^\s*([a-zA-Z0-9_\.]+)\s*:/gm;

            // Kizárjuk a nem változó neveket (pl. Címkék a képeken: LR20, TX1, vagy Ciklus/Blokk nevek)
            const isInvalidVariable = (name: string) => {
                const upperName = name.toUpperCase();
                return ['BEGIN', 'END', 'DO', 'STATIC'].includes(upperName) || 
                       /^[A-Z]{2,3}[0-9]+$/.test(name); // Pl. LR20, TX12, SY42 kiszűrése
            };

            // Függvény, ami beolvassa a szövegből a változókat
            const parseVariablesFromText = (text: string) => {
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
                            } catch (error) {
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

export function deactivate() {}