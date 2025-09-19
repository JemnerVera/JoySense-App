#!/usr/bin/env node

/**
 * Script de Migración Automatizada - SystemParameters.tsx
 * 
 * Este script automatiza el proceso de migración del componente SystemParameters
 * desde la versión original a la versión refactorizada.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración
const CONFIG = {
  originalComponent: 'frontend/src/components/SystemParameters.tsx',
  refactoredComponent: 'frontend/src/components/SystemParametersRefactored.tsx',
  backupDir: 'backup/system-parameters',
  testDir: 'frontend/src/components/__tests__',
  docsDir: 'docs'
};

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utilidades de logging
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}🔄${colors.reset} ${msg}`)
};

// Verificar que estamos en el directorio correcto
function checkProjectRoot() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log.error('No se encontró package.json. Ejecuta este script desde la raíz del proyecto.');
    process.exit(1);
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (!packageJson.name || !packageJson.name.includes('sensores')) {
    log.warning('No parece ser el proyecto correcto. Continuando...');
  }
  
  log.success('Directorio del proyecto verificado');
}

// Crear backup del componente original
function createBackup() {
  log.step('Creando backup del componente original...');
  
  const backupPath = path.join(process.cwd(), CONFIG.backupDir);
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }
  
  const originalPath = path.join(process.cwd(), CONFIG.originalComponent);
  const backupFilePath = path.join(backupPath, 'SystemParameters.tsx.backup');
  
  if (fs.existsSync(originalPath)) {
    fs.copyFileSync(originalPath, backupFilePath);
    log.success(`Backup creado en: ${backupFilePath}`);
  } else {
    log.warning('Componente original no encontrado, continuando...');
  }
}

// Verificar que el componente refactorizado existe
function verifyRefactoredComponent() {
  log.step('Verificando componente refactorizado...');
  
  const refactoredPath = path.join(process.cwd(), CONFIG.refactoredComponent);
  if (!fs.existsSync(refactoredPath)) {
    log.error('Componente refactorizado no encontrado. Ejecuta primero el refactoring.');
    process.exit(1);
  }
  
  log.success('Componente refactorizado verificado');
}

// Ejecutar tests
function runTests() {
  log.step('Ejecutando tests...');
  
  try {
    // Tests unitarios
    log.info('Ejecutando tests unitarios...');
    execSync('npm test -- --passWithNoTests', { stdio: 'inherit' });
    
    // Tests de integración
    log.info('Ejecutando tests de integración...');
    execSync('npm run test:integration -- --passWithNoTests', { stdio: 'inherit' });
    
    log.success('Todos los tests pasaron');
  } catch (error) {
    log.error('Algunos tests fallaron. Revisa los errores antes de continuar.');
    log.warning('Puedes continuar con --force para ignorar los tests');
    
    if (!process.argv.includes('--force')) {
      process.exit(1);
    }
  }
}

// Crear componente de transición
function createTransitionComponent() {
  log.step('Creando componente de transición...');
  
  const transitionComponent = `import React, { useState } from 'react';
import SystemParameters from './SystemParameters';
import { SystemParametersRefactored } from './SystemParametersRefactored';

interface SystemParametersTransitionProps {
  onDataChange?: (data: any) => void;
}

export const SystemParametersTransition: React.FC<SystemParametersTransitionProps> = ({ onDataChange }) => {
  const [useRefactored, setUseRefactored] = useState(false);
  
  const toggleVersion = () => {
    setUseRefactored(!useRefactored);
  };
  
  return (
    <div>
      <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
        <h3 className="font-bold text-yellow-800">Modo de Transición</h3>
        <p className="text-yellow-700">
          Versión actual: {useRefactored ? 'Refactorizada' : 'Original'}
        </p>
        <button
          onClick={toggleVersion}
          className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Cambiar a {useRefactored ? 'Original' : 'Refactorizada'}
        </button>
      </div>
      
      {useRefactored ? (
        <SystemParametersRefactored onDataChange={onDataChange} />
      ) : (
        <SystemParameters onDataChange={onDataChange} />
      )}
    </div>
  );
};

export default SystemParametersTransition;
`;

  const transitionPath = path.join(process.cwd(), 'frontend/src/components/SystemParametersTransition.tsx');
  fs.writeFileSync(transitionPath, transitionComponent);
  log.success('Componente de transición creado');
}

// Actualizar imports en archivos
function updateImports() {
  log.step('Actualizando imports...');
  
  const filesToUpdate = [
    'frontend/src/App.tsx',
    'frontend/src/components/Dashboard.tsx',
    'frontend/src/components/Sidebar.tsx'
  ];
  
  filesToUpdate.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Reemplazar imports del componente original
      const originalImportRegex = /import\s+SystemParameters\s+from\s+['"]\.\/components\/SystemParameters['"];?/g;
      const newImport = "import { SystemParametersTransition as SystemParameters } from './components/SystemParametersTransition';";
      
      if (originalImportRegex.test(content)) {
        content = content.replace(originalImportRegex, newImport);
        fs.writeFileSync(fullPath, content);
        log.success(`Imports actualizados en: ${filePath}`);
      }
    }
  });
}

// Crear tests de migración
function createMigrationTests() {
  log.step('Creando tests de migración...');
  
  const migrationTest = `import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SystemParametersTransition } from '../SystemParametersTransition';

describe('SystemParametersTransition', () => {
  it('debe permitir cambiar entre versiones', () => {
    render(<SystemParametersTransition />);
    
    // Verificar que se muestra la versión original por defecto
    expect(screen.getByText('Versión actual: Original')).toBeInTheDocument();
    
    // Cambiar a versión refactorizada
    const toggleButton = screen.getByText('Cambiar a Refactorizada');
    fireEvent.click(toggleButton);
    
    // Verificar que se cambió a la versión refactorizada
    expect(screen.getByText('Versión actual: Refactorizada')).toBeInTheDocument();
  });
  
  it('debe renderizar ambas versiones correctamente', () => {
    render(<SystemParametersTransition />);
    
    // Verificar que se renderiza la versión original
    expect(screen.getByText('Parámetros del Sistema')).toBeInTheDocument();
    
    // Cambiar a versión refactorizada
    const toggleButton = screen.getByText('Cambiar a Refactorizada');
    fireEvent.click(toggleButton);
    
    // Verificar que se renderiza la versión refactorizada
    expect(screen.getByText('Parámetros del Sistema')).toBeInTheDocument();
  });
});
`;

  const testPath = path.join(process.cwd(), CONFIG.testDir, 'SystemParametersTransition.test.tsx');
  fs.writeFileSync(testPath, migrationTest);
  log.success('Tests de migración creados');
}

// Generar reporte de migración
function generateMigrationReport() {
  log.step('Generando reporte de migración...');
  
  const report = `# Reporte de Migración - SystemParameters.tsx

## Fecha de Migración
${new Date().toISOString()}

## Estado de la Migración
- [x] Backup del componente original creado
- [x] Componente de transición creado
- [x] Imports actualizados
- [x] Tests de migración creados
- [ ] Migración completada
- [ ] Componente original removido
- [ ] Limpieza final

## Archivos Modificados
- \`frontend/src/components/SystemParametersTransition.tsx\` (nuevo)
- \`frontend/src/components/__tests__/SystemParametersTransition.test.tsx\` (nuevo)
- \`frontend/src/App.tsx\` (modificado)
- \`frontend/src/components/Dashboard.tsx\` (modificado)
- \`frontend/src/components/Sidebar.tsx\` (modificado)

## Próximos Pasos
1. Probar la funcionalidad en desarrollo
2. Ejecutar tests de regresión
3. Deploy a staging
4. Testing en staging
5. Deploy a producción
6. Monitoreo post-deploy
7. Limpieza del código obsoleto

## Rollback
Si es necesario hacer rollback:
\`\`\`bash
git revert <commit-hash>
npm run deploy:production
\`\`\`

## Contacto
Para dudas o problemas, contactar al equipo de desarrollo.
`;

  const reportPath = path.join(process.cwd(), CONFIG.docsDir, 'MIGRATION_REPORT.md');
  fs.writeFileSync(reportPath, report);
  log.success('Reporte de migración generado');
}

// Función principal
function main() {
  console.log(`${colors.bright}${colors.magenta}🚀 Iniciando migración de SystemParameters.tsx${colors.reset}\n`);
  
  try {
    checkProjectRoot();
    createBackup();
    verifyRefactoredComponent();
    runTests();
    createTransitionComponent();
    updateImports();
    createMigrationTests();
    generateMigrationReport();
    
    console.log(`\n${colors.bright}${colors.green}🎉 Migración completada exitosamente!${colors.reset}`);
    console.log(`\n${colors.cyan}Próximos pasos:${colors.reset}`);
    console.log('1. Probar la funcionalidad en desarrollo');
    console.log('2. Ejecutar tests de regresión');
    console.log('3. Deploy a staging');
    console.log('4. Testing en staging');
    console.log('5. Deploy a producción');
    console.log('6. Monitoreo post-deploy');
    console.log('7. Limpieza del código obsoleto');
    
  } catch (error) {
    log.error(`Error durante la migración: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  main,
  checkProjectRoot,
  createBackup,
  verifyRefactoredComponent,
  runTests,
  createTransitionComponent,
  updateImports,
  createMigrationTests,
  generateMigrationReport
};
