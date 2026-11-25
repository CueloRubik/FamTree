# Modelo de intercambio JSON FamTree v1

FamTree 2.0 conserva este formato para importar archivos anteriores. El formato privado nativo es binario: consulta [FTREE.md](FTREE.md). El conversor local permite generar archivos .ftree a partir del JSON de investigación sin subir información privada.

Archivo JSON UTF-8, objeto con version (1), title, people y relations. Los IDs son cadenas de 1–80 caracteres ASCII alfanuméricos, guion o guion bajo, únicas y estables dentro del archivo. Las relaciones usan IDs, no nombres.

```json
{
  "version": 1,
  "title": "Archivo genealógico",
  "people": [
    {"id":"p1","name":"Persona ficticia A","birth":"1880","death":"1950","place":"","status":"deceased","publish":true,"familysearch":"","notes":"","sources":""},
    {"id":"p2","name":"Persona ficticia B","birth":"1910","death":"1980","place":"","status":"deceased","publish":true,"familysearch":"","notes":"","sources":""}
  ],
  "relations": [{"type":"parent","from":"p1","to":"p2"}]
}
```

parent: from es progenitor/a y to es hijo/a. partner: relación simétrica. No duplicados ni autorrelaciones. El motor rechaza ciclos de ascendencia. No inferir vínculos por apellidos. No inventar datos: dejar campos vacíos si faltan, status unknown si se desconoce el estado. Fechas son cadenas, pueden ser años o aproximaciones documentadas. Los campos notes y sources pueden contener texto. familysearch admite URL HTTPS de perfil o ARK del dominio FamilySearch sin parámetros ni fragmentos.

## Intercambio local
Mantener IDs y relaciones existentes. Verificar fuentes y no adivinar datos. Los campos notes y sources se conservan en los archivos .ftree. El campo publish es un indicador heredado sin uso en la interfaz actual, conservado por compatibilidad binaria. Límites: 2000 personas y 6000 relaciones.
