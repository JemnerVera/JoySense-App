# 📚 DOCUMENTACIÓN DE APIs EXISTENTES - SystemParameters.tsx

## 📋 RESUMEN

Este documento documenta todas las APIs existentes del componente `SystemParameters.tsx` y sus dependencias para el refactoring.

## 🎯 INTERFACES PRINCIPALES

### **SystemParametersProps**
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

### **SystemParametersRef**
```typescript
export interface SystemParametersRef {
  hasUnsavedChanges: () => boolean;
  handleTableChange: (table: string) => void;
}
```

## 🧩 COMPONENTES HIJOS Y SUS APIs

### **1. NormalInsertForm**

#### **Props Interface**:
```typescript
interface NormalInsertFormProps {
  visibleColumns: any[];
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  selectedTable: string;
  loading: boolean;
  onInsert: () => void;
  onCancel: () => void;
  getColumnDisplayName: (columnName: string) => string;
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  onPasteFromClipboard?: () => void;
  onReplicateClick?: () => void;
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

#### **Funcionalidades**:
- Validación robusta de campos
- Habilitación progresiva de campos
- Placeholders estándar
- Leyenda de campos obligatorios
- Integración con filtros globales

#### **Dependencias Críticas**:
- `getUniqueOptionsForField`: Función compleja para opciones únicas
- `visibleColumns`: Columnas de la tabla actual
- `formData`: Estado del formulario
- Sistema de validación integrado

---

### **2. AdvancedSensorUpdateForm**

#### **Props Interface**:
```typescript
interface AdvancedSensorUpdateFormProps {
  selectedRows: any[];
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  onUpdate: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
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

#### **Funcionalidades**:
- Actualización avanzada de sensores
- Selección múltiple de filas
- Validación de actualización
- Integración con datos relacionados

#### **Dependencias Críticas**:
- `selectedRows`: Filas seleccionadas para actualización
- `getUniqueOptionsForField`: Función para opciones únicas
- Sistema de selección múltiple

---

### **3. MassiveSensorForm**

#### **Props Interface**:
```typescript
interface MassiveSensorFormProps {
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  onApply: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  // Datos relacionados
  nodosData?: any[];
  tiposData?: any[];
  metricasData?: any[];
  // Filtros globales
  paisSeleccionado?: string;
  empresaSeleccionada?: string;
  fundoSeleccionado?: string;
  getPaisName: (paisId: string) => string;
  getEmpresaName: (empresaId: string) => string;
  getFundoName: (fundoId: string) => string;
}
```

#### **Funcionalidades**:
- Inserción masiva de sensores
- Validación masiva
- Integración con filtros globales
- Funciones de nombres para mostrar

#### **Dependencias Críticas**:
- `getUniqueOptionsForField`: Función para opciones únicas
- Datos relacionados: Nodos, tipos, métricas
- Funciones de nombres: Para mostrar nombres en lugar de IDs

---

### **4. MultipleSensorForm**

#### **Props Interface**:
```typescript
interface MultipleSensorFormProps {
  multipleData: any[];
  setMultipleData: (data: any[]) => void;
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  onInsert: () => void;
  onCancel: () => void;
  loading: boolean;
  // Datos relacionados
  nodosData?: any[];
  tiposData?: any[];
  metricasData?: any[];
}
```

#### **Funcionalidades**:
- Inserción múltiple de sensores
- Validación múltiple
- Manejo de estado múltiple

#### **Dependencias Críticas**:
- `multipleData`: Estado de datos múltiples
- `getUniqueOptionsForField`: Función para opciones únicas
- Sistema de validación múltiple

---

### **5. MultipleMetricaSensorForm**

#### **Props Interface**:
```typescript
interface MultipleMetricaSensorFormProps {
  multipleData: any[];
  setMultipleData: (data: any[]) => void;
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  onInsert: () => void;
  onCancel: () => void;
  loading: boolean;
  // Datos relacionados
  nodosData?: any[];
  entidadesData?: any[];
  metricasData?: any[];
}
```

#### **Funcionalidades**:
- Inserción múltiple de métricas de sensores
- Validación múltiple
- Manejo de estado múltiple

#### **Dependencias Críticas**:
- `multipleData`: Estado de datos múltiples
- `getUniqueOptionsForField`: Función para opciones únicas
- Sistema de validación múltiple

---

### **6. MultipleUsuarioPerfilForm**

#### **Props Interface**:
```typescript
interface MultipleUsuarioPerfilFormProps {
  multipleData: any[];
  setMultipleData: (data: any[]) => void;
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  onInsert: () => void;
  onCancel: () => void;
  loading: boolean;
  // Datos relacionados
  usuariosData?: any[];
  perfilesData?: any[];
}
```

#### **Funcionalidades**:
- Inserción múltiple de usuarios y perfiles
- Validación múltiple
- Manejo de estado múltiple

#### **Dependencias Críticas**:
- `multipleData`: Estado de datos múltiples
- `getUniqueOptionsForField`: Función para opciones únicas
- Sistema de validación múltiple

---

### **7. MultipleLocalizacionForm**

#### **Props Interface**:
```typescript
interface MultipleLocalizacionFormProps {
  multipleData: any[];
  setMultipleData: (data: any[]) => void;
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  onInsert: () => void;
  onCancel: () => void;
  loading: boolean;
  // Datos relacionados
  ubicacionesData?: any[];
  nodosData?: any[];
  entidadesData?: any[];
}
```

#### **Funcionalidades**:
- Inserción múltiple de localizaciones
- Validación múltiple
- Manejo de estado múltiple

#### **Dependencias Críticas**:
- `multipleData`: Estado de datos múltiples
- `getUniqueOptionsForField`: Función para opciones únicas
- Sistema de validación múltiple

---

### **8. MassiveUmbralForm**

#### **Props Interface**:
```typescript
interface MassiveUmbralFormProps {
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  onApply: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  // Filtros globales
  paisSeleccionado?: string;
  empresaSeleccionada?: string;
  fundoSeleccionado?: string;
  getPaisName: (paisId: string) => string;
  getEmpresaName: (empresaId: string) => string;
  getFundoName: (fundoId: string) => string;
}
```

#### **Funcionalidades**:
- Inserción masiva de umbrales
- Validación masiva
- Integración con filtros globales

#### **Dependencias Críticas**:
- `getUniqueOptionsForField`: Función para opciones únicas
- Filtros globales
- Funciones de nombres

---

### **9. MassiveMetricaSensorForm**

#### **Props Interface**:
```typescript
interface MassiveMetricaSensorFormProps {
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  onApply: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  // Datos relacionados
  nodosData?: any[];
  entidadesData?: any[];
  metricasData?: any[];
}
```

#### **Funcionalidades**:
- Inserción masiva de métricas de sensores
- Validación masiva
- Integración con datos relacionados

#### **Dependencias Críticas**:
- `getUniqueOptionsForField`: Función para opciones únicas
- Datos relacionados
- Sistema de validación masiva

---

### **10. AdvancedUsuarioPerfilUpdateForm**

#### **Props Interface**:
```typescript
interface AdvancedUsuarioPerfilUpdateFormProps {
  selectedRows: any[];
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  onUpdate: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  // Datos relacionados
  usuariosData?: any[];
  perfilesData?: any[];
}
```

#### **Funcionalidades**:
- Actualización avanzada de usuarios y perfiles
- Selección múltiple de filas
- Validación de actualización

#### **Dependencias Críticas**:
- `selectedRows`: Filas seleccionadas para actualización
- `getUniqueOptionsForField`: Función para opciones únicas
- Sistema de selección múltiple

---

### **11. AdvancedMetricaSensorUpdateForm**

#### **Props Interface**:
```typescript
interface AdvancedMetricaSensorUpdateFormProps {
  selectedRows: any[];
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  onUpdate: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  // Datos relacionados
  nodosData?: any[];
  entidadesData?: any[];
  metricasData?: any[];
}
```

#### **Funcionalidades**:
- Actualización avanzada de métricas de sensores
- Selección múltiple de filas
- Validación de actualización

#### **Dependencias Críticas**:
- `selectedRows`: Filas seleccionadas para actualización
- `getUniqueOptionsForField`: Función para opciones únicas
- Sistema de selección múltiple

---

### **12. AdvancedSensorUpdateForm**

#### **Props Interface**:
```typescript
interface AdvancedSensorUpdateFormProps {
  selectedRows: any[];
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  onUpdate: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  // Datos relacionados
  nodosData?: any[];
  tiposData?: any[];
  metricasData?: any[];
}
```

#### **Funcionalidades**:
- Actualización avanzada de sensores
- Selección múltiple de filas
- Validación de actualización

#### **Dependencias Críticas**:
- `selectedRows`: Filas seleccionadas para actualización
- `getUniqueOptionsForField`: Función para opciones únicas
- Sistema de selección múltiple

---

## 🎣 HOOKS PERSONALIZADOS Y SUS APIs

### **1. useSimpleModal**

#### **Interface**:
```typescript
interface UseSimpleModalReturn {
  modalState: ModalState | null;
  showModal: (type: string, title: string, message: string, onConfirm: () => void, onCancel: () => void) => void;
  hideModal: () => void;
  confirmAction: () => void;
  cancelAction: () => void;
}
```

#### **Funcionalidades**:
- Manejo de modales simples
- Confirmación de acciones
- Cancelación de acciones

---

### **2. useInsertionMessages**

#### **Interface**:
```typescript
interface UseInsertionMessagesReturn {
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  removeMessage: (id: string) => void;
}
```

#### **Funcionalidades**:
- Manejo de mensajes de inserción
- Mensajes de éxito/error
- Limpieza automática de mensajes

---

### **3. useReplicate**

#### **Interface**:
```typescript
interface UseReplicateReturn {
  isReplicating: boolean;
  replicateData: (data: any) => void;
  onReplicateClick: () => void;
  onReplicateConfirm: () => void;
  onReplicateCancel: () => void;
}
```

#### **Funcionalidades**:
- Funcionalidad de replicación
- Modales de replicación
- Validación de replicación

---

### **4. useGlobalFilterEffect**

#### **Interface**:
```typescript
interface UseGlobalFilterEffectReturn {
  filteredData: any[];
  isLoading: boolean;
  error: string | null;
}
```

#### **Funcionalidades**:
- Efectos de filtros globales
- Filtrado de datos
- Estados de carga y error

---

## 🔗 SERVICIOS Y SUS APIs

### **1. JoySenseService**

#### **Métodos Principales**:
```typescript
class JoySenseService {
  static async getTableData(tableName: string): Promise<any[]>;
  static async insert(tableName: string, data: any): Promise<any>;
  static async update(tableName: string, id: number, data: any): Promise<any>;
  static async delete(tableName: string, id: number): Promise<any>;
  static async multipleInsert(tableName: string, data: any[]): Promise<any>;
  static async massiveInsert(tableName: string, data: any): Promise<any>;
}
```

#### **Funcionalidades**:
- CRUD operations para todas las tablas
- Validación de dependencias
- Integración con Supabase

---

### **2. formValidation**

#### **Funciones Principales**:
```typescript
export function validateFormData(tableName: string, formData: Record<string, any>): ValidationResult;
export function getValidationMessages(validationResult: ValidationResult): string[];
export function validateTableData(tableName: string, formData: Record<string, any>): ValidationResult;
export const validateTableUpdate: (tableName: string, formData: Record<string, any>, originalData: Record<string, any>, existingData?: any[]) => Promise<EnhancedValidationResult>;
```

#### **Funcionalidades**:
- Validación robusta por tabla
- Verificación de duplicados
- Validación de dependencias

---

### **3. errorHandler**

#### **Funciones Principales**:
```typescript
export function handleInsertError(error: any, setMessages: (messages: Message[]) => void): void;
export function handleMultipleInsertError(error: any, setMessages: (messages: Message[]) => void): void;
```

#### **Funcionalidades**:
- Manejo de errores de inserción
- Manejo de errores múltiples
- Mensajes de error amigables

---

## 📊 TIPOS Y INTERFACES

### **Message**
```typescript
interface Message {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
  timestamp: number;
}
```

### **ValidationResult**
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

### **EnhancedValidationResult**
```typescript
interface EnhancedValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  userFriendlyMessage: string;
}
```

### **ValidationError**
```typescript
interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'duplicate' | 'format' | 'length' | 'constraint';
}
```

### **ModalState**
```typescript
interface ModalState {
  isOpen: boolean;
  type: string;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}
```

---

## ⚠️ DEPENDENCIAS CRÍTICAS

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

1. **Este documento es crítico** para el refactoring
2. **Todas las APIs deben preservarse** durante el refactoring
3. **Las interfaces no deben modificarse** sin entender su impacto completo
4. **Los componentes hijos tienen APIs específicas** que no deben cambiarse
5. **El flujo de datos es complejo** y debe mantenerse intacto
6. **Este documento debe consultarse** en cada paso del refactoring

---

**Fecha de creación**: $(date)
**Autor**: AI Assistant
**Estado**: Documento crítico para refactoring
**Prioridad**: MÁXIMA
**Uso**: Consulta obligatoria durante el refactoring
