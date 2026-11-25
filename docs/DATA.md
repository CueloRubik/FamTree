# Modelo de datos FamTree v1

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

parent: from es progenitor/a y to es hijo/a. partner: relación simétrica. No duplicados ni autorrelaciones. El motor rechaza ciclos de ascendencia. No inferir vínculos por apellidos. No inventar datos: dejar campos vacíos si faltan, status unknown si se desconoce el estado. Fechas son cadenas, pueden ser años o aproximaciones documentadas. Los campos privados notes y sources pueden contener texto y no se publican. familysearch admite URL HTTPS de perfil o ARK del dominio FamilySearch sin parámetros ni fragmentos.

## Para asistentes de investigación (incluido Claude)
1. Trabajar sobre una copia local privada, no pegar datos privados en un repositorio o commit.
2. Mantener IDs y relaciones existentes cuando sea posible. Verificar fuentes y no adivinar.
3. La publicación requiere revisión humana adulta de cada ficha; solo personas fallecidas verificadas y autorizadas. Nunca copiar información de vivos o desconocidos ni datos personales de terceros vivos en campos libres.
4. Usar la proyección pública desde la UI y revisar el JSON generado antes de editar data/tree.json. npm test verifica el esquema y las restricciones estructurales, no puede verificar identidades, fallecimientos ni consentimiento real.
5. No modificar código para saltarse la validación de privacidad. Nunca incorporar claves, cookies ni tokens de FamilySearch o GitHub.

El archivo público tiene como máximo 2000 personas y 6000 relaciones. Los IDs exportados se regeneran para evitar revelar identificadores privados; no son enlaces permanentes a la ficha.
