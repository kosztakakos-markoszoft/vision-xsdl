# Vision XSDL Language Support

Ez a Visual Studio Code bővítmény teljes körű szintaxis színezést és IntelliSense kódkiegészítést nyújt a Vision X 9 és Vision X 10 SCADA rendszerekben használt **XSDL** (Extensible Structure Declaration Language) nyelvhez.

## Funkciók

* **Szintaxis színezés (Syntax Highlighting):**
  * XSDL nyelvi blokkok és vezérlési szerkezetek (`BEGIN`, `END`, `DO`, `STATIC`, `if`, `then`, `else`, `while`, stb.).
  * Változócsoport deklarációk (`Discretes`, `Reals`, `DirectWords`, `Morestates`, `Discretetrends`, `Realtrends`, stb.).
  * Beépített adattípusok (`ushort`, `real`, `bool`, `shortstring`, `dword`, stb.).
  * SCADA objektumok és driver struktúrák (`Image`, `Driver`, `Input`, `Node`, `TcpSocket`, stb.).
  * Kommentek (`'` kezdetű sorok) és szöveges konstansok kiemelése.

* **IntelliSense & PLC Változó Felismerés:**
  * Automatikusan feltérképezi a nyitott munkaterületen (Workspace) található összes `.xsdl` és `.val` fájlt.
  * Felismeri és kigyűjti a deklarált PLC változókat.
  * Gépelés közben automatikusan felajánlja a PLC tag-eket és XSDL kulcsszavakat a kódkiegészítő listában.

## Támogatott fájlkiterjesztések

* `.xsdl`
  * `.val`

## Használat

1. Nyiss meg egy `.xsdl` vagy `.val` fájlt a VS Code szerkesztőben.
2. A nyelvi színezés automatikusan aktiválódik.
3. Kódolás közben a billentyűzet gépelésére automatikusan felugranak a projektben elérhető PLC változók.