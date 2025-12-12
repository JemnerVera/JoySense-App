/**
 * Script para analizar el proyecto JoySense
 * - Identifica archivos grandes
 * - Busca malas prácticas
 * - Encuentra código que necesita refactorización
 */

const fs = require('fs');
const path = require('path');

// Configuración
const PROJECT_ROOT = __dirname;
const EXCLUDE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', 
  '__pycache__', '.venv', 'venv', 'env', '.env',
  'coverage', '.vscode', '.idea'
]);
const EXCLUDE_FILES = new Set([
  'package-lock.json', 'yarn.lock', '.DS_Store',
  'NEWJOYSENSE.sql'  // Archivo SQL grande esperado
]);

// Límites
const MAX_LINES_WARNING = 500;
const MAX_LINES_ERROR = 1000;

// Patrones de malas prácticas
const BAD_PRACTICES = [
  { pattern: /console\.log/g, description: 'Usar logger en lugar de console.log' },
  { pattern: /\/\/\s*TODO:/gi, description: 'TODOs pendientes' },
  { pattern: /\/\/\s*FIXME:/gi, description: 'FIXMEs pendientes' },
  { pattern: /\/\/\s*XXX/gi, description: 'Marcadores XXX (código problemático)' },
  { pattern: /\/\/\s*HACK/gi, description: 'Hacks en el código' },
  { pattern: /eval\s*\(/g, description: 'Uso de eval() (riesgo de seguridad)' },
  { pattern: /\.innerHTML\s*=/g, description: 'Uso de innerHTML (riesgo XSS)' },
  { pattern: /dangerouslySetInnerHTML/g, description: 'React: dangerouslySetInnerHTML' },
  { pattern: /:\s*any\b/g, description: 'TypeScript: uso de any (pérdida de type safety)' },
  { pattern: /require.*pool|pool\.query/g, description: 'Uso de pool.query (debería usar Supabase API)' },
  { pattern: /db\.(select|insert|update|delete|rpc|count)\s*\(/g, description: 'Uso de funciones helper db.* (ya eliminadas)' },
  { pattern: /ADMIN_EMAIL|ADMIN_PASSWORD/g, description: 'Referencias a credenciales de admin' },
  { pattern: /authenticateBackend|ensureAuthenticated/g, description: 'Funciones de autenticación admin (ya eliminadas)' },
  { pattern: /\.env\s*['"]/g, description: 'Hardcoded .env values' },
];

function shouldAnalyzeFile(filePath) {
  // Excluir archivos en directorios excluidos
  const parts = filePath.split(path.sep);
  for (const excludeDir of EXCLUDE_DIRS) {
    if (parts.includes(excludeDir)) {
      return false;
    }
  }
  
  // Excluir archivos específicos
  if (EXCLUDE_FILES.has(path.basename(filePath))) {
    return false;
  }
  
  // Solo analizar archivos de código
  const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.sql', '.md'];
  return codeExtensions.includes(path.extname(filePath));
}

function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch (e) {
    return 0;
  }
}

function analyzeFile(filePath) {
  const issues = [];
  const lineCount = countLines(filePath);
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Buscar patrones de malas prácticas
    for (const { pattern, description } of BAD_PRACTICES) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        const context = lines[lineNum - 1]?.trim().substring(0, 80) || '';
        issues.push({
          type: 'bad_practice',
          pattern: pattern.toString(),
          description,
          line: lineNum,
          context
        });
      }
      // Reset regex
      pattern.lastIndex = 0;
    }
  } catch (e) {
    issues.push({
      type: 'error',
      description: `Error leyendo archivo: ${e.message}`
    });
  }
  
  return { lineCount, issues };
}

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      const dirName = path.basename(filePath);
      if (!EXCLUDE_DIRS.has(dirName)) {
        walkDir(filePath, callback);
      }
    } else {
      callback(filePath);
    }
  }
}

function analyzeProject() {
  const results = {
    largeFiles: [],
    veryLargeFiles: [],
    badPractices: {},
    stats: {
      totalFiles: 0,
      totalLines: 0,
      filesAnalyzed: 0
    }
  };
  
  console.log('🔍 Analizando proyecto...\n');
  
  walkDir(PROJECT_ROOT, (filePath) => {
    if (!shouldAnalyzeFile(filePath)) {
      return;
    }
    
    results.stats.totalFiles++;
    
    const { lineCount, issues } = analyzeFile(filePath);
    results.stats.totalLines += lineCount;
    results.stats.filesAnalyzed++;
    
    const relPath = path.relative(PROJECT_ROOT, filePath);
    
    // Archivos grandes
    if (lineCount > MAX_LINES_ERROR) {
      results.veryLargeFiles.push({
        path: relPath,
        lines: lineCount
      });
    } else if (lineCount > MAX_LINES_WARNING) {
      results.largeFiles.push({
        path: relPath,
        lines: lineCount
      });
    }
    
    // Malas prácticas
    if (issues.length > 0) {
      results.badPractices[relPath] = issues;
    }
  });
  
  return results;
}

function printReport(results) {
  console.log('='.repeat(80));
  console.log('📊 REPORTE DE ANÁLISIS DEL PROYECTO');
  console.log('='.repeat(80));
  console.log();
  
  // Estadísticas generales
  console.log('📈 ESTADÍSTICAS GENERALES');
  console.log('-'.repeat(80));
  console.log(`Total de archivos analizados: ${results.stats.filesAnalyzed}`);
  console.log(`Total de líneas de código: ${results.stats.totalLines.toLocaleString()}`);
  console.log();
  
  // Archivos muy grandes
  if (results.veryLargeFiles.length > 0) {
    console.log('🚨 ARCHIVOS MUY GRANDES (>1000 líneas) - REQUIEREN REFACTORIZACIÓN');
    console.log('-'.repeat(80));
    results.veryLargeFiles
      .sort((a, b) => b.lines - a.lines)
      .forEach(file => {
        console.log(`  ⚠️  ${file.path}: ${file.lines.toLocaleString()} líneas`);
      });
    console.log();
  }
  
  // Archivos grandes
  if (results.largeFiles.length > 0) {
    console.log('⚠️  ARCHIVOS GRANDES (>500 líneas) - CONSIDERAR REFACTORIZACIÓN');
    console.log('-'.repeat(80));
    results.largeFiles
      .sort((a, b) => b.lines - a.lines)
      .forEach(file => {
        console.log(`  📄 ${file.path}: ${file.lines.toLocaleString()} líneas`);
      });
    console.log();
  }
  
  // Malas prácticas
  const badPracticeFiles = Object.keys(results.badPractices);
  if (badPracticeFiles.length > 0) {
    console.log('🔴 MALAS PRÁCTICAS ENCONTRADAS');
    console.log('-'.repeat(80));
    
    badPracticeFiles.forEach(filePath => {
      const issues = results.badPractices[filePath];
      console.log(`\n📁 ${filePath}:`);
      
      // Agrupar por tipo
      const byType = {};
      issues.forEach(issue => {
        if (!byType[issue.description]) {
          byType[issue.description] = [];
        }
        byType[issue.description].push(issue);
      });
      
      Object.entries(byType).forEach(([desc, issueList]) => {
        console.log(`  ❌ ${desc}: ${issueList.length} ocurrencia(s)`);
        issueList.slice(0, 3).forEach(issue => {
          console.log(`     Línea ${issue.line}: ${issue.context}`);
        });
        if (issueList.length > 3) {
          console.log(`     ... y ${issueList.length - 3} más`);
        }
      });
    });
    console.log();
  } else {
    console.log('✅ No se encontraron malas prácticas comunes');
    console.log();
  }
  
  // Resumen
  console.log('='.repeat(80));
  console.log('📋 RESUMEN');
  console.log('='.repeat(80));
  console.log(`Archivos muy grandes (>1000 líneas): ${results.veryLargeFiles.length}`);
  console.log(`Archivos grandes (>500 líneas): ${results.largeFiles.length}`);
  console.log(`Archivos con malas prácticas: ${badPracticeFiles.length}`);
  console.log();
  
  // Recomendaciones
  if (results.veryLargeFiles.length > 0 || results.largeFiles.length > 0 || badPracticeFiles.length > 0) {
    console.log('💡 RECOMENDACIONES');
    console.log('-'.repeat(80));
    if (results.veryLargeFiles.length > 0) {
      console.log('1. Refactorizar archivos muy grandes (>1000 líneas) en componentes más pequeños');
    }
    if (results.largeFiles.length > 0) {
      console.log('2. Considerar dividir archivos grandes (>500 líneas) en módulos');
    }
    if (badPracticeFiles.length > 0) {
      console.log('3. Revisar y corregir las malas prácticas encontradas');
    }
  } else {
    console.log('✅ ¡El proyecto está en buen estado!');
  }
}

// Ejecutar análisis
const results = analyzeProject();
printReport(results);
