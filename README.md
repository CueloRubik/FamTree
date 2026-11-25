# FamTree 1.0

Archivo genealógico interactivo en español, sin frameworks ni dependencias externas de ejecución. Estética de herbario histórico; ramas SVG, fichas HTML y motor de relaciones en JavaScript.

## Inicio
Desde esta rama: `python3 -m http.server 8000` y abrir http://localhost:8000. No abrir index.html mediante file://, porque el navegador puede bloquear módulos y JSON. Node 18 o posterior: `npm test`.

## Flujo de trabajo
- El archivo público se consulta sin editar. Si está vacío, la página abre un ejemplo claramente ficticio.
- En Taller privado se pueden crear/editar fichas y vínculos, deshacer, rehacer, importar y exportar. Los datos privados viven en memoria de la pestaña, no se guardan en el servidor ni en localStorage. Descarga una copia privada antes de cerrar. No subirla a GitHub.
- FamilySearch: enlaces opcionales de perfil o fuente ARK. No se accede a la cuenta ni se sincroniza por API. Algunas páginas requieren sesión.
- Para publicar, un adulto revisa registros y marca solamente personas cuyo fallecimiento está comprobado. Preparar publicación genera tree.json, elimina notas/fuentes privadas, excluye registros vivos y desconocidos y sus relaciones. Revisar todo el contenido, incluyendo campos de texto y enlaces, antes de subirlo. GitHub conserva historial.
- Reemplazar exclusivamente data/tree.json de Development con la copia pública revisada. La página vuelve a consultar ese archivo cada 60 s; la disponibilidad de la versión nueva depende de GitHub Pages.
- Nunca colocar credenciales, archivos privados, nombres o datos de familiares vivos en ninguna rama pública. No hay autenticación ni base de datos remota. Para trabajo privado persistente, conservar el JSON en el equipo de la familia; no usar esta página pública para datos que requieran confidencialidad fuerte, pues su código puede cambiar.

## Publicación
Settings → Pages → Deploy from a branch → Development → /(root) → Save.
URL esperada: https://cuelorubik.github.io/FamTree/. El conector de GitHub no configura Pages. La rama main conserva solo el README de orientación.

## Estructura
- index.html: interfaz, formularios y accesibilidad.
- css/app.css: sistema visual, temas y adaptación móvil.
- assets/: iconos SVG originales.
- js/model.mjs: validación, relaciones, búsqueda, proyección pública y distribución.
- js/app.mjs: interacción, dibujo, editor, navegación e intercambio.
- data/tree.json: única colección pública real, inicialmente vacía.
- data/demo.json: ejemplo inventado, nunca mezclar con registros reales.
- tests/model.test.mjs: pruebas unitarias. Ver documentación del formato en docs/DATA.md.

## Límites conocidos
No hay importación directa Excel/GEDCOM, colaboración simultánea, autenticación ni integración API FamilySearch. La distribución por generaciones admite parejas y varias relaciones parentales; no pretende reproducir todos los formatos genealógicos especializados. Las fechas son texto flexible y la cronología ordena por primer año reconocible.
