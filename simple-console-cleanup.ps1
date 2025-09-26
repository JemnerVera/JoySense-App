# Script SIMPLE para eliminar console.log de debug
# Solo elimina líneas que contienen console.log completos

Write-Host "Iniciando limpieza SIMPLE de console.log..." -ForegroundColor Green

# Directorio a limpiar
$srcDir = "frontend/src"

# Contador de archivos procesados
$filesProcessed = 0
$logsRemoved = 0

# Obtener todos los archivos TypeScript y JavaScript
$files = Get-ChildItem -Path $srcDir -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx"

Write-Host "Encontrados $($files.Count) archivos para procesar..." -ForegroundColor Yellow

foreach ($file in $files) {
    $lines = Get-Content $file.FullName
    $originalLineCount = $lines.Count
    $newLines = @()
    $removedFromFile = 0
    
    foreach ($line in $lines) {
        # Solo eliminar líneas que contienen console.log y terminan con ;
        if ($line -match '^\s*console\.log\(.*\);\s*$') {
            $removedFromFile++
            # No agregar esta línea (la eliminamos)
        } else {
            $newLines += $line
        }
    }
    
    # Solo escribir si hubo cambios
    if ($newLines.Count -ne $originalLineCount) {
        Set-Content -Path $file.FullName -Value $newLines
        $filesProcessed++
        $logsRemoved += $removedFromFile
        Write-Host "✅ $($file.Name): $removedFromFile console.log eliminados" -ForegroundColor Green
    }
}

Write-Host "`nLimpieza SIMPLE completada!" -ForegroundColor Green
Write-Host "Archivos procesados: $filesProcessed" -ForegroundColor Cyan
Write-Host "Console.log eliminados: $logsRemoved" -ForegroundColor Cyan
Write-Host "`nSolo se eliminaron console.log completos en líneas separadas." -ForegroundColor Yellow
Write-Host "Console.error, console.warn y codigo funcional se mantuvieron intactos." -ForegroundColor Green
