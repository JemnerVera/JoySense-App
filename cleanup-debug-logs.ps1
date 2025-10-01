# Script para limpiar console.log de debugging en SystemParameters.tsx
$filePath = "frontend/src/components/SystemParameters.tsx"
$content = Get-Content $filePath -Raw

# Eliminar console.log de debugging (que contienen emojis y texto de debug)
$cleanedContent = $content -replace "^\s*console\.log\([^)]*🔍[^)]*\);\s*$", ""
$cleanedContent = $cleanedContent -replace "^\s*console\.log\([^)]*🔄[^)]*\);\s*$", ""
$cleanedContent = $cleanedContent -replace "^\s*console\.log\([^)]*🏷️[^)]*\);\s*$", ""
$cleanedContent = $cleanedContent -replace "^\s*console\.log\([^)]*🔗[^)]*\);\s*$", ""

# Eliminar líneas que solo contienen console.log con texto de debug
$cleanedContent = $cleanedContent -replace "^\s*console\.log\([^)]*Debug[^)]*\);\s*$", ""
$cleanedContent = $cleanedContent -replace "^\s*console\.log\([^)]*debug[^)]*\);\s*$", ""

# Eliminar comentarios de debug
$cleanedContent = $cleanedContent -replace "^\s*// .*[Dd]ebug.*$", ""
$cleanedContent = $cleanedContent -replace "^\s*// .*[Tt]emporal.*$", ""

# Escribir el contenido limpio de vuelta al archivo
Set-Content -Path $filePath -Value $cleanedContent -NoNewline

Write-Host "Console.log de debugging eliminados de SystemParameters.tsx"
