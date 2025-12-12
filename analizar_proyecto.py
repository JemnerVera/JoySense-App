#!/usr/bin/env python3
"""
Script para analizar el proyecto JoySense
- Identifica archivos grandes
- Busca malas prácticas
- Encuentra código que necesita refactorización
"""

import os
import re
from pathlib import Path
from collections import defaultdict

# Configuración
PROJECT_ROOT = Path(__file__).parent
EXCLUDE_DIRS = {
    'node_modules', '.git', 'dist', 'build', '.next', 
    '__pycache__', '.venv', 'venv', 'env', '.env'
}
EXCLUDE_FILES = {
    'package-lock.json', 'yarn.lock', '.DS_Store',
    'NEWJOYSENSE.sql'  # Archivo SQL grande esperado
}

# Límites
MAX_LINES_WARNING = 500
MAX_LINES_ERROR = 1000

# Patrones de malas prácticas
BAD_PRACTICES = {
    'console.log': 'Usar logger en lugar de console.log',
    'TODO': 'TODOs pendientes',
    'FIXME': 'FIXMEs pendientes',
    'XXX': 'Marcadores XXX (código problemático)',
    'HACK': 'Hacks en el código',
    'eval(': 'Uso de eval() (riesgo de seguridad)',
    'innerHTML': 'Uso de innerHTML (riesgo XSS)',
    'dangerouslySetInnerHTML': 'React: dangerouslySetInnerHTML',
    'any': 'TypeScript: uso de any (pérdida de type safety)',
    'require.*pool': 'Uso de pool.query (debería usar Supabase API)',
    'db\.(select|insert|update|delete)': 'Uso de funciones helper db.* (ya eliminadas)',
    'ADMIN_EMAIL|ADMIN_PASSWORD': 'Referencias a credenciales de admin',
    'authenticateBackend|ensureAuthenticated': 'Funciones de autenticación admin (ya eliminadas)',
}

def should_analyze_file(file_path):
    """Verifica si un archivo debe ser analizado"""
    # Excluir archivos en directorios excluidos
    parts = file_path.parts
    for exclude_dir in EXCLUDE_DIRS:
        if exclude_dir in parts:
            return False
    
    # Excluir archivos específicos
    if file_path.name in EXCLUDE_FILES:
        return False
    
    # Solo analizar archivos de código
    code_extensions = {'.js', '.jsx', '.ts', '.tsx', '.py', '.sql', '.md'}
    return file_path.suffix in code_extensions

def count_lines(file_path):
    """Cuenta las líneas de un archivo"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return len(f.readlines())
    except Exception as e:
        return 0

def analyze_file(file_path):
    """Analiza un archivo en busca de malas prácticas"""
    issues = []
    line_count = count_lines(file_path)
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            lines = content.split('\n')
            
            # Buscar patrones de malas prácticas
            for pattern, description in BAD_PRACTICES.items():
                matches = re.finditer(pattern, content, re.IGNORECASE | re.MULTILINE)
                for match in matches:
                    line_num = content[:match.start()].count('\n') + 1
                    issues.append({
                        'type': 'bad_practice',
                        'pattern': pattern,
                        'description': description,
                        'line': line_num,
                        'context': lines[line_num - 1].strip()[:80] if line_num <= len(lines) else ''
                    })
    except Exception as e:
        issues.append({
            'type': 'error',
            'description': f'Error leyendo archivo: {e}'
        })
    
    return line_count, issues

def analyze_project():
    """Analiza todo el proyecto"""
    results = {
        'large_files': [],
        'very_large_files': [],
        'bad_practices': defaultdict(list),
        'stats': {
            'total_files': 0,
            'total_lines': 0,
            'files_analyzed': 0
        }
    }
    
    print("🔍 Analizando proyecto...\n")
    
    # Recorrer todos los archivos
    for root, dirs, files in os.walk(PROJECT_ROOT):
        # Filtrar directorios excluidos
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            file_path = Path(root) / file
            
            if not should_analyze_file(file_path):
                continue
            
            results['stats']['total_files'] += 1
            
            # Contar líneas y analizar
            line_count, issues = analyze_file(file_path)
            results['stats']['total_lines'] += line_count
            results['stats']['files_analyzed'] += 1
            
            # Archivos grandes
            rel_path = file_path.relative_to(PROJECT_ROOT)
            if line_count > MAX_LINES_ERROR:
                results['very_large_files'].append({
                    'path': str(rel_path),
                    'lines': line_count
                })
            elif line_count > MAX_LINES_WARNING:
                results['large_files'].append({
                    'path': str(rel_path),
                    'lines': line_count
                })
            
            # Malas prácticas
            if issues:
                for issue in issues:
                    if issue['type'] == 'bad_practice':
                        results['bad_practices'][str(rel_path)].append(issue)
    
    return results

def print_report(results):
    """Imprime el reporte de análisis"""
    print("=" * 80)
    print("📊 REPORTE DE ANÁLISIS DEL PROYECTO")
    print("=" * 80)
    print()
    
    # Estadísticas generales
    print("📈 ESTADÍSTICAS GENERALES")
    print("-" * 80)
    print(f"Total de archivos analizados: {results['stats']['files_analyzed']}")
    print(f"Total de líneas de código: {results['stats']['total_lines']:,}")
    print()
    
    # Archivos muy grandes (>1000 líneas)
    if results['very_large_files']:
        print("🚨 ARCHIVOS MUY GRANDES (>1000 líneas) - REQUIEREN REFACTORIZACIÓN")
        print("-" * 80)
        for file in sorted(results['very_large_files'], key=lambda x: x['lines'], reverse=True):
            print(f"  ⚠️  {file['path']}: {file['lines']:,} líneas")
        print()
    
    # Archivos grandes (>500 líneas)
    if results['large_files']:
        print("⚠️  ARCHIVOS GRANDES (>500 líneas) - CONSIDERAR REFACTORIZACIÓN")
        print("-" * 80)
        for file in sorted(results['large_files'], key=lambda x: x['lines'], reverse=True):
            print(f"  📄 {file['path']}: {file['lines']:,} líneas")
        print()
    
    # Malas prácticas
    if results['bad_practices']:
        print("🔴 MALAS PRÁCTICAS ENCONTRADAS")
        print("-" * 80)
        for file_path, issues in sorted(results['bad_practices'].items()):
            print(f"\n📁 {file_path}:")
            # Agrupar por tipo
            by_type = defaultdict(list)
            for issue in issues:
                by_type[issue['description']].append(issue)
            
            for desc, issue_list in by_type.items():
                print(f"  ❌ {desc}: {len(issue_list)} ocurrencia(s)")
                # Mostrar primeras 3 ocurrencias
                for issue in issue_list[:3]:
                    print(f"     Línea {issue['line']}: {issue['context']}")
                if len(issue_list) > 3:
                    print(f"     ... y {len(issue_list) - 3} más")
        print()
    else:
        print("✅ No se encontraron malas prácticas comunes")
        print()
    
    # Resumen
    print("=" * 80)
    print("📋 RESUMEN")
    print("=" * 80)
    print(f"Archivos muy grandes (>1000 líneas): {len(results['very_large_files'])}")
    print(f"Archivos grandes (>500 líneas): {len(results['large_files'])}")
    print(f"Archivos con malas prácticas: {len(results['bad_practices'])}")
    print()
    
    # Recomendaciones
    if results['very_large_files'] or results['large_files'] or results['bad_practices']:
        print("💡 RECOMENDACIONES")
        print("-" * 80)
        if results['very_large_files']:
            print("1. Refactorizar archivos muy grandes (>1000 líneas) en componentes más pequeños")
        if results['large_files']:
            print("2. Considerar dividir archivos grandes (>500 líneas) en módulos")
        if results['bad_practices']:
            print("3. Revisar y corregir las malas prácticas encontradas")
    else:
        print("✅ ¡El proyecto está en buen estado!")

if __name__ == '__main__':
    results = analyze_project()
    print_report(results)
