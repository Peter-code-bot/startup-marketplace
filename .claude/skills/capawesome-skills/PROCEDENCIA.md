# Procedencia

Copia vendorizada de https://github.com/capawesome-team/skills.git
en el commit `afe71e5` (2026-04-09).

Se vendoriza como archivos normales y NO como submodulo ni como clon: un clon
anidado (un `.git` dentro de este directorio) habria quedado en el arbol como
un puntero vacio — git avisa de ello con "Clones of the outer repository will
not contain the contents of the embedded repository" — asi que quien clonara
VICINO se habria encontrado el directorio vacio.

Para actualizarlo: clonar el repo de arriba aparte, copiar el contenido encima
de este directorio (sin su `.git`) y actualizar el commit de esta nota.
