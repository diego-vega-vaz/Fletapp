#!/usr/bin/env bash
# Empaqueta SOLO el codigo fuente (sin node_modules, sin dist, sin .git) en un
# tar que se puede subir al contenedor de la nube para compilar y probar ahi.
#
# Existe porque `vite build` truena con "Bus error" dentro de la VM de
# escritorio: el binario nativo de rolldown no corre ahi. Compilar y probar
# pasa en la nube; esta carpeta es donde vive el codigo y donde se hace git.
#
#   bash scripts/empaquetar-fuente.sh
#   -> escribe fuente.tar.gz en la raiz del repo
set -euo pipefail
cd "$(dirname "$0")/.."
git ls-files -co --exclude-standard \
  | grep -vE '^(node_modules|dist|test-results|playwright-report|Claude outputs)/' \
  | tar -czf fuente.tar.gz -T -
echo "listo: $(du -h fuente.tar.gz | cut -f1) · $(tar -tzf fuente.tar.gz | wc -l) archivos"
