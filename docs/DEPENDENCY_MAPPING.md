# 🗺️ MAPEO COMPLETO DE DEPENDENCIAS - SystemParameters.tsx

## 📋 RESUMEN

Este documento mapea todas las dependencias críticas del componente `SystemParameters.tsx` para el refactoring. Es esencial entender estas dependencias antes de proceder con cualquier modificación.

## 🔍 ANÁLISIS DEL COMPONENTE PRINCIPAL

### **Archivo**: `frontend/src/components/SystemParameters.tsx`
### **Líneas**: 14,317
### **Complejidad**: Extremadamente alta

## 📦 IMPORTS Y DEPENDENCIAS EXTERNAS

```typescript
// React y hooks
import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';

// Servicios y utilidades
import { handleInsertError, handleMultipleInsertError } from '../utils/errorHandler';
import { useAuth } from '../contexts/AuthContext';
import { JoySenseService } from '../services/backend-api';
import { TableInfo, ColumnInfo, Message } from '../types/systemParameters';
import { STYLES_CONFIG } from '../config/styles';

// Componentes UI
import SimpleModal from './SimpleModal';
import { useSimpleModal } from '../hooks/useSimpleModal';
import { hasSignificantChanges } from '../utils/changeDetection';

// Formularios especializados
import MultipleSensorForm from './MultipleSensorForm';
import MultipleMetricaSensorForm from './MultipleMetricaSensorForm';
import MultipleUsuarioPerfilForm from './MultipleUsuarioPerfilForm';
import { MassiveSensorForm } from './MassiveSensorForm';
import { MassiveUmbralForm } from './MassiveUmbralForm';
import { MassiveMetricaSensorForm } from './MassiveMetricaSensorForm';
import { AdvancedUsuarioPerfilUpdateForm } from './AdvancedUsuarioPerfilUpdateForm';
import MultipleLocalizacionForm from './MultipleLocalizacionForm';
import NormalInsertForm from './NormalInsertForm';
import InsertionMessage from './InsertionMessage';
import { AdvancedMetricaSensorUpdateForm } from './AdvancedMetricaSensorUpdateForm';
import { AdvancedSensorUpdateForm } from './AdvancedSensorUpdateForm';

// Hooks personalizados
import { useInsertionMessages } from '../hooks/useInsertionMessages';
import { useReplicate } from '../hooks/useReplicate';

// Componentes de replicación
import ReplicateModal from './ReplicateModal';
import ReplicateButton from './ReplicateButton';

// Sistema de validación
import { validateTableData, validateTableUpdate } from '../utils/formValidation';

// Sistema de protección de datos
import { useDataLossProtection } from '../hooks/useDataLossProtection';
import { useSimpleChangeDetection } from '../hooks/useSimpleChangeDetection';
import ProtectedSubTabButton from './ProtectedSubTabButton';
import ProtectedParameterButton from './ProtectedParameterButton';
import DataLossModal from './DataLossModal';
```

## 🎯 PROPS DEL COMPONENTE PRINCIPAL

```typescript
interface SystemParametersProps {
  selectedTable: string;
  activeSubTab: 'status' | 'insert' | 'update' | 'massive';
  onSubTabChange: (subTab: 'status' | 'insert' | 'update' | 'massive') => void;
  onTableSelect: (table: string) => void;
  // Filtros globales
  paisSeleccionado?: string;
  empresaSeleccionada?: string;
  fundoSeleccionado?: string;
  // Datos para mostrar nombres
  paisesData?: any[];
  empresasData?: any[];
  fundosData?: any[];
  // Estados de carga
  loading?: boolean;
  // Callbacks
  onInsert?: () => void;
  onUpdate?: () => void;
  onCancel?: () => void;
}
```

## 🔄 ESTADOS DEL COMPONENTE

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

## 🧩 COMPONENTES HIJOS Y SUS DEPENDENCIAS

### **1. NormalInsertForm**

#### **Props Requeridas**:
```typescript
interface NormalInsertFormProps {
  visibleColumns: any[];                    // Columnas visibles de la tabla
  formData: Record<string, any>;            // Datos del formulario
  setFormData: (data: Record<string, any>) => void;  // Setter de datos
  selectedTable: string;                    // Tabla seleccionada
  loading: boolean;                         // Estado de carga
  onInsert: () => void;                     // Callback de inserción
  onCancel: () => void;                     // Callback de cancelación
  getColumnDisplayName: (columnName: string) => string;  // Función para nombres de columnas
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;  // Función para opciones únicas
  onPasteFromClipboard?: () => void;        // Callback de pegado
  onReplicateClick?: () => void;            // Callback de replicación
  // Filtros globales
  paisSeleccionado?: string;
  empresaSeleccionada?: string;
  fundoSeleccionado?: string;
  // Datos para mostrar nombres
  paisesData?: any[];
  empresasData?: any[];
  fundosData?: any[];
}
```

#### **Dependencias Críticas**:
- **`getUniqueOptionsForField`**: Función compleja que obtiene opciones únicas para campos
- **`visibleColumns`**: Columnas de la tabla actual
- **`formData`**: Estado del formulario
- **Sistema de validación**: Integrado con `formValidation.ts`

#### **Funcionalidades Proporcionadas**:
- Validación robusta de campos
- Habilitación progresiva de campos
- Placeholders estándar
- Leyenda de campos obligatorios

---

### **2. AdvancedSensorUpdateForm**

#### **Props Requeridas**:
```typescript
interface AdvancedSensorUpdateFormProps {
  selectedRows: any[];                      // Filas seleccionadas
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;  // Función para opciones únicas
  onUpdate: (data: any) => void;            // Callback de actualización
  onCancel: () => void;                     // Callback de cancelación
  loading: boolean;                         // Estado de carga
  // Datos relacionados
  nodosData?: any[];
  tiposData?: any[];
  metricasData?: any[];
  // Filtros globales
  paisSeleccionado?: string;
  empresaSeleccionada?: string;
  fundoSeleccionado?: string;
}
```

#### **Dependencias Críticas**:
- **`selectedRows`**: Filas seleccionadas para actualización
- **`getUniqueOptionsForField`**: Función para opciones únicas
- **Sistema de selección múltiple**: Integrado con el componente principal

#### **Funcionalidades Proporcionadas**:
- Actualización avanzada de sensores
- Selección múltiple de filas
- Validación de actualización

---

### **3. MassiveSensorForm**

#### **Props Requeridas**:
```typescript
interface MassiveSensorFormProps {
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;  // Función para opciones únicas
  onApply: (data: any) => void;             // Callback de aplicación
  onCancel: () => void;                     // Callback de cancelación
  loading: boolean;                         // Estado de carga
  // Datos relacionados
  nodosData?: any[];
  tiposData?: any[];
  metricasData?: any[];
  // Filtros globales
  paisSeleccionado?: string;
  empresaSeleccionada?: string;
  fundoSeleccionado?: string;
  getPaisName: (paisId: string) => string;  // Función para nombre de país
  getEmpresaName: (empresaId: string) => string;  // Función para nombre de empresa
  getFundoName: (fundoId: string) => string;  // Función para nombre de fundo
}
```

#### **Dependencias Críticas**:
- **`getUniqueOptionsForField`**: Función para opciones únicas
- **Datos relacionados**: Nodos, tipos, métricas
- **Funciones de nombres**: Para mostrar nombres en lugar de IDs

#### **Funcionalidades Proporcionadas**:
- Inserción masiva de sensores
- Validación masiva
- Integración con filtros globales

---

### **4. MultipleSensorForm**

#### **Props Requeridas**:
```typescript
interface MultipleSensorFormProps {
  multipleData: any[];                      // Datos múltiples
  setMultipleData: (data: any[]) => void;   // Setter de datos múltiples
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;  // Función para opciones únicas
  onInsert: () => void;                     // Callback de inserción
  onCancel: () => void;                     // Callback de cancelación
  loading: boolean;                         // Estado de carga
  // Datos relacionados
  nodosData?: any[];
  tiposData?: any[];
  metricasData?: any[];
}
```

#### **Dependencias Críticas**:
- **`multipleData`**: Estado de datos múltiples
- **`getUniqueOptionsForField`**: Función para opciones únicas
- **Sistema de validación múltiple**: Integrado con el componente principal

#### **Funcionalidades Proporcionadas**:
- Inserción múltiple de sensores
- Validación múltiple
- Manejo de estado múltiple

---

## 🔧 FUNCIONES CRÍTICAS

### **1. getUniqueOptionsForField**

#### **Propósito**: Obtener opciones únicas para campos de selección
#### **Complejidad**: Alta
#### **Dependencias**: 
- `JoySenseService` para obtener datos
- Lógica específica por tabla
- Filtros globales

#### **Implementación**:
```typescript
const getUniqueOptionsForField = useCallback((columnName: string): Array<{value: any, label: string}> => {
  // Lógica compleja para obtener opciones únicas
  // Depende de la tabla seleccionada
  // Considera filtros globales
  // Maneja relaciones entre tablas
}, [selectedTable, paisSeleccionado, empresaSeleccionada, fundoSeleccionado]);
```

---

### **2. handleInsert**

#### **Propósito**: Manejar inserción de datos con validación
#### **Complejidad**: Alta
#### **Dependencias**:
- Sistema de validación robusto
- `JoySenseService` para inserción
- Manejo de errores
- Mensajes de inserción

#### **Implementación**:
```typescript
const handleInsert = useCallback(async () => {
  // Validación robusta
  const validationResult = validateTableData(selectedTable, formData);
  
  if (!validationResult.isValid) {
    // Mostrar errores de validación
    return;
  }
  
  try {
    // Inserción a través de JoySenseService
    const result = await JoySenseService.insert(selectedTable, formData);
    
    // Manejo de éxito
    setMessages([{ type: 'success', text: 'Registro insertado exitosamente' }]);
    
    // Limpiar formulario
    setFormData({});
  } catch (error) {
    // Manejo de errores
    handleInsertError(error, setMessages);
  }
}, [selectedTable, formData, setMessages]);
```

---

### **3. handleUpdate**

#### **Propósito**: Manejar actualización de datos con validación
#### **Complejidad**: Muy alta
#### **Dependencias**:
- Sistema de validación de actualización
- Verificación de dependencias
- `JoySenseService` para actualización
- Manejo de errores

#### **Implementación**:
```typescript
const handleUpdate = useCallback(async () => {
  // Validación de actualización
  const validationResult = await validateTableUpdate(
    selectedTable, 
    formData, 
    selectedRowForUpdate
  );
  
  if (!validationResult.isValid) {
    // Mostrar errores de validación
    setValidationErrors(validationResult.errors);
    return;
  }
  
  try {
    // Actualización a través de JoySenseService
    const result = await JoySenseService.update(
      selectedTable, 
      selectedRowForUpdate.id, 
      formData
    );
    
    // Manejo de éxito
    setMessages([{ type: 'success', text: 'Registro actualizado exitosamente' }]);
    
    // Limpiar formulario
    setFormData({});
    setSelectedRowForUpdate(null);
  } catch (error) {
    // Manejo de errores
    handleUpdateError(error, setMessages);
  }
}, [selectedTable, formData, selectedRowForUpdate, setMessages]);
```

---

### **4. handleMultipleInsert**

#### **Propósito**: Manejar inserción múltiple de datos
#### **Complejidad**: Alta
#### **Dependencias**:
- Sistema de validación múltiple
- `JoySenseService` para inserción múltiple
- Manejo de errores múltiples

#### **Implementación**:
```typescript
const handleMultipleInsert = useCallback(async () => {
  // Validación múltiple
  const validationResults = multipleData.map(data => 
    validateTableData(selectedTable, data)
  );
  
  const hasErrors = validationResults.some(result => !result.isValid);
  
  if (hasErrors) {
    // Mostrar errores de validación
    return;
  }
  
  try {
    // Inserción múltiple a través de JoySenseService
    const results = await JoySenseService.multipleInsert(selectedTable, multipleData);
    
    // Manejo de éxito
    setMessages([{ type: 'success', text: `${results.length} registros insertados exitosamente` }]);
    
    // Limpiar datos múltiples
    setMultipleData([]);
  } catch (error) {
    // Manejo de errores
    handleMultipleInsertError(error, setMessages);
  }
}, [selectedTable, multipleData, setMessages]);
```

---

### **5. handleMassiveInsert**

#### **Propósito**: Manejar inserción masiva de datos
#### **Complejidad**: Muy alta
#### **Dependencias**:
- Sistema de validación masiva
- `JoySenseService` para inserción masiva
- Manejo de errores masivos

#### **Implementación**:
```typescript
const handleMassiveInsert = useCallback(async () => {
  // Validación masiva
  const validationResult = validateMassiveData(selectedTable, massiveFormData);
  
  if (!validationResult.isValid) {
    // Mostrar errores de validación
    return;
  }
  
  try {
    // Inserción masiva a través de JoySenseService
    const result = await JoySenseService.massiveInsert(selectedTable, massiveFormData);
    
    // Manejo de éxito
    setMessages([{ type: 'success', text: 'Inserción masiva completada exitosamente' }]);
    
    // Limpiar datos masivos
    setMassiveFormData({});
  } catch (error) {
    // Manejo de errores
    handleMassiveInsertError(error, setMessages);
  }
}, [selectedTable, massiveFormData, setMessages]);
```

---

## 🎣 HOOKS PERSONALIZADOS

### **1. useDataLossProtection**

#### **Propósito**: Proteger contra pérdida de datos
#### **Dependencias**:
- `useDataLossModal` para modales
- `useSimpleChangeDetection` para detección de cambios
- Estados de formularios

#### **Funcionalidades**:
- Protección de cambio de subpestañas
- Protección de cambio de parámetros
- Modales de confirmación

---

### **2. useInsertionMessages**

#### **Propósito**: Manejar mensajes de inserción
#### **Dependencias**:
- Estados de inserción
- Sistema de notificaciones

#### **Funcionalidades**:
- Mensajes de éxito/error
- Notificaciones temporales
- Limpieza automática de mensajes

---

### **3. useReplicate**

#### **Propósito**: Manejar funcionalidad de replicación
#### **Dependencias**:
- Datos de formulario
- Sistema de replicación

#### **Funcionalidades**:
- Replicación de datos
- Modales de replicación
- Validación de replicación

---

## 🔗 SERVICIOS Y UTILIDADES

### **1. JoySenseService**

#### **Propósito**: Servicio principal para operaciones CRUD
#### **Dependencias**:
- Supabase client
- Configuración de API

#### **Funcionalidades**:
- CRUD operations para todas las tablas
- Validación de dependencias
- Integración con Supabase

---

### **2. formValidation**

#### **Propósito**: Sistema de validación robusto
#### **Dependencias**:
- Esquemas de validación
- Lógica de validación por tabla

#### **Funcionalidades**:
- Validación robusta por tabla
- Verificación de duplicados
- Validación de dependencias

---

### **3. errorHandler**

#### **Propósito**: Manejo de errores
#### **Dependencias**:
- Tipos de error
- Sistema de mensajes

#### **Funcionalidades**:
- Manejo de errores de inserción
- Manejo de errores múltiples
- Mensajes de error amigables

---

## 📊 FLUJO DE DATOS

### **Flujo de Inserción**:
1. Usuario llena formulario → `formData`
2. Validación robusta → `validateTableData`
3. Inserción → `JoySenseService.insert`
4. Manejo de resultado → `setMessages`
5. Limpieza de formulario → `setFormData({})`

### **Flujo de Actualización**:
1. Usuario selecciona fila → `selectedRowForUpdate`
2. Usuario modifica datos → `formData`
3. Validación de actualización → `validateTableUpdate`
4. Verificación de dependencias → `checkDependencies`
5. Actualización → `JoySenseService.update`
6. Manejo de resultado → `setMessages`
7. Limpieza → `setFormData({})`, `setSelectedRowForUpdate(null)`

### **Flujo de Protección de Datos**:
1. Usuario intenta cambiar pestaña → `onSubTabChange`
2. Detección de cambios → `useSimpleChangeDetection`
3. Si hay cambios → Mostrar modal de confirmación
4. Usuario confirma → Proceder con cambio
5. Usuario cancela → Mantener pestaña actual

---

## ⚠️ DEPENDENCIAS CRÍTICAS PARA EL REFACTORING

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

---

## 📝 NOTAS IMPORTANTES

1. **Este mapeo es crítico** para el refactoring
2. **Todas las dependencias deben preservarse** durante el refactoring
3. **Las funciones críticas no deben modificarse** sin entender su impacto completo
4. **Los componentes hijos tienen APIs específicas** que no deben cambiarse
5. **El flujo de datos es complejo** y debe mantenerse intacto
6. **Este documento debe consultarse** en cada paso del refactoring

---

**Fecha de creación**: $(date)
**Autor**: AI Assistant
**Estado**: Documento crítico para refactoring
**Prioridad**: MÁXIMA
**Uso**: Consulta obligatoria durante el refactoring
