# 🔍 ANÁLISIS ACTUAL DE DEPENDENCIAS - SystemParameters.tsx

## 📋 RESUMEN DEL ANÁLISIS

**Fecha**: $(date)
**Archivo**: `frontend/src/components/SystemParameters.tsx`
**Líneas**: 14,317
**Complejidad**: Extremadamente alta

## 📦 IMPORTS Y DEPENDENCIAS EXTERNAS

### **React y Hooks**:
```typescript
import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';
```

### **Servicios y Utilidades**:
```typescript
import { handleInsertError, handleMultipleInsertError } from '../utils/errorHandler';
import { useAuth } from '../contexts/AuthContext';
import { JoySenseService } from '../services/backend-api';
import { TableInfo, ColumnInfo, Message } from '../types/systemParameters';
import { STYLES_CONFIG } from '../config/styles';
import { hasSignificantChanges } from '../utils/changeDetection';
import { validateFormData, getValidationMessages, validateTableData, validateTableUpdate } from '../utils/formValidation';
```

### **Componentes UI**:
```typescript
import SimpleModal from './SimpleModal';
import LostDataModal from './LostDataModal';
import InsertionMessage from './InsertionMessage';
import ReplicateModal from './ReplicateModal';
import ReplicateButton from './ReplicateButton';
```

### **Formularios Especializados**:
```typescript
import MultipleSensorForm from './MultipleSensorForm';
import MultipleMetricaSensorForm from './MultipleMetricaSensorForm';
import MultipleUsuarioPerfilForm from './MultipleUsuarioPerfilForm';
import MultipleLocalizacionForm from './MultipleLocalizacionForm';
import NormalInsertForm from './NormalInsertForm';
import { MassiveSensorForm } from './MassiveSensorForm';
import { MassiveUmbralForm } from './MassiveUmbralForm';
import { MassiveMetricaSensorForm } from './MassiveMetricaSensorForm';
import { AdvancedUsuarioPerfilUpdateForm } from './AdvancedUsuarioPerfilUpdateForm';
import { AdvancedMetricaSensorUpdateForm } from './AdvancedMetricaSensorUpdateForm';
import { AdvancedSensorUpdateForm } from './AdvancedSensorUpdateForm';
```

### **Hooks Personalizados**:
```typescript
import { useSimpleModal } from '../hooks/useSimpleModal';
import { useInsertionMessages } from '../hooks/useInsertionMessages';
import { useReplicate } from '../hooks/useReplicate';
import { useGlobalFilterEffect } from '../hooks/useGlobalFilterEffect';
import { useFilters } from '../contexts/FilterContext';
```

## 🎯 INTERFACES Y TIPOS

### **SystemParametersProps**:
```typescript
interface SystemParametersProps {
  selectedTable?: string;
  onTableSelect?: (table: string) => void;
  activeSubTab?: 'status' | 'insert' | 'update' | 'massive';
  onSubTabChange?: (subTab: 'status' | 'insert' | 'update' | 'massive') => void;
  activeTab?: string;
  onParameterChangeWithConfirmation?: (newTable: string) => void;
  onTabChangeWithConfirmation?: (newTab: string) => void;
  onFormDataChange?: (formData: Record<string, any>, multipleData: any[] | any) => void;
  clearFormData?: boolean;
}
```

### **SystemParametersRef**:
```typescript
export interface SystemParametersRef {
  hasUnsavedChanges: () => boolean;
  handleTableChange: (table: string) => void;
}
```

## 🔄 ESTADOS DEL COMPONENTE

### **Estados Principales**:
```typescript
const [selectedTable, setSelectedTable] = useState<string>(propSelectedTable || '');
const [activeSubTab, setActiveSubTab] = useState<'status' | 'insert' | 'update' | 'massive'>(propActiveSubTab || 'status');
```

### **Estados de Formularios**:
```typescript
const [formData, setFormData] = useState<Record<string, any>>({});
const [multipleData, setMultipleData] = useState<any[]>([]);
const [massiveFormData, setMassiveFormData] = useState<Record<string, any>>({});
```

### **Estados de Selección**:
```typescript
const [selectedRows, setSelectedRows] = useState<any[]>([]);
const [selectedRowForUpdate, setSelectedRowForUpdate] = useState<any>(null);
```

### **Estados de UI**:
```typescript
const [loading, setLoading] = useState<boolean>(false);
const [messages, setMessages] = useState<Message[]>([]);
const [modals, setModals] = useState<ModalState[]>([]);
```

### **Estados de Validación**:
```typescript
const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
```

### **Estados Específicos por Tabla**:
```typescript
// Estados para sensor
const [selectedNodo, setSelectedNodo] = useState<string>('');
const [selectedEntidad, setSelectedEntidad] = useState<string>('');
const [selectedTipo, setSelectedTipo] = useState<string>('');
const [selectedSensorCount, setSelectedSensorCount] = useState<number>(1);
const [multipleSensors, setMultipleSensors] = useState<any[]>([]);

// Estados para metricasensor
const [selectedNodos, setSelectedNodos] = useState<string[]>([]);
const [selectedEntidadMetrica, setSelectedEntidadMetrica] = useState<string>('');
const [selectedMetricas, setSelectedMetricas] = useState<string[]>([]);
const [multipleMetricas, setMultipleMetricas] = useState<any[]>([]);

// Estados para usuarioperfil
const [multipleUsuarioPerfiles, setMultipleUsuarioPerfiles] = useState<any[]>([]);

// Estados para localizacion
const [multipleLocalizaciones, setMultipleLocalizaciones] = useState<any[]>([]);
const [selectedUbicaciones, setSelectedUbicaciones] = useState<string[]>([]);
const [selectedNodosLocalizacion, setSelectedNodosLocalizacion] = useState<string[]>([]);
const [selectedEntidades, setSelectedEntidades] = useState<string[]>([]);
const [latitud, setLatitud] = useState<string>('');
const [longitud, setLongitud] = useState<string>('');
```

## 🧩 HOOKS PERSONALIZADOS INTERNOS

### **useMultipleSelection**:
```typescript
const useMultipleSelection = (selectedTable: string) => {
  // Función para buscar entradas por diferentes criterios
  const searchByCriteria = (criteria: string, filterFn: (dataRow: any) => boolean, data: any[]) => {
    // Lógica de búsqueda
  };
  
  // Función para buscar entradas con timestamp exacto
  const findExactTimestampMatches = (row: any, allData: any[]) => {
    // Lógica de búsqueda por timestamp
  };
  
  // ... más funciones
};
```

### **usePagination**:
```typescript
const usePagination = (data: any[], itemsPerPage: number = 10) => {
  // Lógica de paginación
};
```

## 🔧 FUNCIONES CRÍTICAS IDENTIFICADAS

### **1. getUniqueOptionsForField**
- **Propósito**: Obtener opciones únicas para campos de selección
- **Complejidad**: Muy alta
- **Dependencias**: JoySenseService, lógica específica por tabla, filtros globales

### **2. handleInsert**
- **Propósito**: Manejar inserción de datos con validación
- **Complejidad**: Alta
- **Dependencias**: Sistema de validación, JoySenseService, manejo de errores

### **3. handleUpdate**
- **Propósito**: Manejar actualización de datos con validación
- **Complejidad**: Muy alta
- **Dependencias**: Sistema de validación de actualización, verificación de dependencias

### **4. handleMultipleInsert**
- **Propósito**: Manejar inserción múltiple de datos
- **Complejidad**: Alta
- **Dependencias**: Sistema de validación múltiple, JoySenseService

### **5. handleMassiveInsert**
- **Propósito**: Manejar inserción masiva de datos
- **Complejidad**: Muy alta
- **Dependencias**: Sistema de validación masiva, JoySenseService

### **6. executeTabChange**
- **Propósito**: Ejecutar cambio de pestaña con validación
- **Complejidad**: Media
- **Dependencias**: Sistema de protección de datos

## 🎣 HOOKS EXTERNOS UTILIZADOS

### **useAuth**:
- **Propósito**: Autenticación de usuario
- **Dependencias**: AuthContext

### **useFilters**:
- **Propósito**: Filtros globales
- **Dependencias**: FilterContext
- **Valores**: paisSeleccionado, empresaSeleccionada, fundoSeleccionado

### **useSimpleModal**:
- **Propósito**: Manejo de modales simples
- **Dependencias**: Hook personalizado

### **useInsertionMessages**:
- **Propósito**: Manejo de mensajes de inserción
- **Dependencias**: Hook personalizado

### **useReplicate**:
- **Propósito**: Funcionalidad de replicación
- **Dependencias**: Hook personalizado

### **useGlobalFilterEffect**:
- **Propósito**: Efectos de filtros globales
- **Dependencias**: Hook personalizado

## 🔗 SERVICIOS Y UTILIDADES

### **JoySenseService**:
- **Propósito**: Servicio principal para operaciones CRUD
- **Métodos utilizados**: 
  - `getTableData()`
  - `insert()`
  - `update()`
  - `delete()`
  - `multipleInsert()`
  - `massiveInsert()`

### **formValidation**:
- **Propósito**: Sistema de validación robusto
- **Funciones utilizadas**:
  - `validateFormData()`
  - `getValidationMessages()`
  - `validateTableData()`
  - `validateTableUpdate()`

### **errorHandler**:
- **Propósito**: Manejo de errores
- **Funciones utilizadas**:
  - `handleInsertError()`
  - `handleMultipleInsertError()`

## 📊 FLUJO DE DATOS IDENTIFICADO

### **Flujo de Inserción**:
1. Usuario llena formulario → `formData`
2. Validación robusta → `validateTableData()`
3. Inserción → `JoySenseService.insert()`
4. Manejo de resultado → `setMessages()`
5. Limpieza de formulario → `setFormData({})`

### **Flujo de Actualización**:
1. Usuario selecciona fila → `selectedRowForUpdate`
2. Usuario modifica datos → `formData`
3. Validación de actualización → `validateTableUpdate()`
4. Verificación de dependencias → `checkDependencies()`
5. Actualización → `JoySenseService.update()`
6. Manejo de resultado → `setMessages()`
7. Limpieza → `setFormData({})`, `setSelectedRowForUpdate(null)`

### **Flujo de Protección de Datos**:
1. Usuario intenta cambiar pestaña → `onSubTabChange()`
2. Detección de cambios → `hasSignificantChanges()`
3. Si hay cambios → Mostrar modal de confirmación
4. Usuario confirma → Proceder con cambio
5. Usuario cancela → Mantener pestaña actual

## ⚠️ DEPENDENCIAS CRÍTICAS IDENTIFICADAS

### **1. Sistema de Validación**:
- **NO MODIFICAR**: `formValidation.ts`
- **PRESERVAR**: Todas las funciones de validación
- **MANTENER**: Integración con componentes

### **2. Sistema de Protección de Datos**:
- **NO MODIFICAR**: Hooks de protección
- **PRESERVAR**: Modales de confirmación
- **MANTENER**: Detección de cambios

### **3. Estructura de Sidebar**:
- **NO MODIFICAR**: Componentes de sidebar
- **PRESERVAR**: Navegación jerárquica
- **MANTENER**: Integración con filtros

### **4. Habilitación Progresiva**:
- **NO MODIFICAR**: Lógica de `isFieldEnabled`
- **PRESERVAR**: Habilitación por tabla
- **MANTENER**: Integración con validación

### **5. Placeholders Estándar**:
- **NO MODIFICAR**: Formato de placeholders
- **PRESERVAR**: Leyenda de campos obligatorios
- **MANTENER**: Integración con validación

## 🎯 COMPONENTES HIJOS Y SUS DEPENDENCIAS

### **NormalInsertForm**:
- **Props**: 26 props identificadas
- **Dependencias críticas**: `getUniqueOptionsForField`, `visibleColumns`, `formData`
- **Funcionalidades**: Validación robusta, habilitación progresiva, placeholders estándar

### **AdvancedSensorUpdateForm**:
- **Props**: Props de selección múltiple
- **Dependencias críticas**: `selectedRows`, `getUniqueOptionsForField`
- **Funcionalidades**: Actualización avanzada de sensores

### **MassiveSensorForm**:
- **Props**: Props de inserción masiva
- **Dependencias críticas**: `getUniqueOptionsForField`, datos relacionados
- **Funcionalidades**: Inserción masiva de sensores

### **MultipleSensorForm**:
- **Props**: Props de inserción múltiple
- **Dependencias críticas**: Estados específicos, validaciones
- **Funcionalidades**: Inserción múltiple de sensores

## 📝 OBSERVACIONES CRÍTICAS

1. **El componente es extremadamente complejo** con múltiples responsabilidades
2. **Las dependencias están muy acopladas** entre sí
3. **Los estados son numerosos** y específicos por tabla
4. **Las funciones críticas son muy complejas** y tienen muchas dependencias
5. **El flujo de datos es complejo** y debe mantenerse intacto
6. **Los hooks personalizados internos** agregan complejidad adicional

## 🚨 RIESGOS IDENTIFICADOS

1. **Alto riesgo de romper funcionalidad** durante el refactoring
2. **Dependencias complejas** entre componentes y servicios
3. **Estados específicos por tabla** que pueden perderse
4. **Funciones críticas** con lógica compleja
5. **Integración con múltiples servicios** externos

## 📋 PRÓXIMOS PASOS

1. **Crear tests de regresión** para todas las funcionalidades críticas
2. **Documentar APIs** de componentes hijos
3. **Mapear flujo de datos** completo
4. **Identificar puntos de extracción** para hooks personalizados
5. **Preparar estrategia** de refactoring incremental

---

**Fecha de análisis**: $(date)
**Autor**: AI Assistant
**Estado**: Análisis inicial completado
**Prioridad**: CRÍTICA
**Uso**: Base para el refactoring
