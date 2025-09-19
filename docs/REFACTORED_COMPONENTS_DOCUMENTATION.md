# Documentación de Componentes Refactorizados

## 📋 Índice
1. [Hooks Personalizados](#hooks-personalizados)
2. [Componentes Reutilizables](#componentes-reutilizables)
3. [Guía de Uso](#guía-de-uso)
4. [Ejemplos de Implementación](#ejemplos-de-implementación)
5. [Mejores Prácticas](#mejores-prácticas)

## 🔧 Hooks Personalizados

### 1. Hooks de Estado

#### `useSystemParametersState`
Maneja el estado principal del componente SystemParameters.

```typescript
const {
  selectedTable,
  activeSubTab,
  updateFormData,
  selectedRowForUpdate,
  setSelectedTable,
  setActiveSubTab,
  setUpdateFormData,
  setSelectedRowForUpdate,
  resetState
} = useSystemParametersState();
```

**Propósito**: Centralizar el estado de la aplicación de parámetros.

#### `useTableData`
Maneja la carga y gestión de datos de tablas.

```typescript
const {
  paisesData,
  empresasData,
  fundosData,
  // ... otros datos de tabla
  isLoading,
  error,
  refreshData
} = useTableData();
```

**Propósito**: Gestionar datos de todas las tablas del sistema.

#### `useFormState`
Maneja el estado de formularios.

```typescript
const {
  formData,
  setFormData,
  resetForm
} = useFormState();
```

**Propósito**: Gestionar estado de formularios de manera consistente.

### 2. Hooks de Validación

#### `useFormValidation`
Proporciona funciones de validación para formularios.

```typescript
const {
  validateInsert,
  validateUpdate,
  validateMassiveInsert
} = useFormValidation(selectedTable);
```

**Propósito**: Validar datos antes de operaciones CRUD.

#### `useProgressiveEnablement`
Maneja la habilitación progresiva de campos.

```typescript
const {
  getEnabledFields,
  isFieldEnabled
} = useProgressiveEnablement(selectedTable, formData);
```

**Propósito**: Controlar qué campos están habilitados según el estado del formulario.

### 3. Hooks de Operaciones

#### `useInsertOperations`
Maneja operaciones de inserción.

```typescript
const {
  insertSingle,
  insertMultiple,
  insertMassive,
  isInserting,
  insertError,
  insertSuccess,
  clearInsertState
} = useInsertOperations();
```

**Propósito**: Gestionar todas las operaciones de inserción.

#### `useUpdateOperations`
Maneja operaciones de actualización.

```typescript
const {
  updateSingle,
  updateMultiple,
  isUpdating,
  updateError,
  updateSuccess,
  clearUpdateState
} = useUpdateOperations();
```

**Propósito**: Gestionar todas las operaciones de actualización.

#### `useSearchOperations`
Maneja operaciones de búsqueda y filtrado.

```typescript
const {
  searchTerm,
  searchField,
  filteredData,
  hasSearched,
  isSearching,
  setSearchTerm,
  setSearchField,
  performSearch,
  clearSearch
} = useSearchOperations();
```

**Propósito**: Gestionar búsqueda y filtrado de datos.

#### `useSystemParametersCRUD`
Operaciones CRUD específicas para SystemParameters.

```typescript
const {
  handleInsert,
  handleUpdate,
  handleDelete,
  isProcessing,
  operationSuccess,
  operationError,
  clearOperationState
} = useSystemParametersCRUD();
```

**Propósito**: Encapsular lógica CRUD específica del sistema de parámetros.

### 4. Hooks de Renderizado

#### `useFormRendering`
Maneja la lógica de renderizado de formularios.

```typescript
const {
  getFieldProps,
  getFormValidation,
  shouldShowField
} = useFormRendering(selectedTable, formData);
```

**Propósito**: Controlar cómo se renderizan los formularios.

#### `useTableRendering`
Maneja la lógica de renderizado de tablas.

```typescript
const {
  filteredData,
  paginatedData,
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  searchTerm,
  searchField,
  isSearching,
  setSearchTerm,
  setSearchField,
  clearSearch,
  goToPage,
  nextPage,
  prevPage,
  firstPage,
  lastPage,
  getDisplayValue,
  formatCellValue
} = useTableRendering(data, itemsPerPage);
```

**Propósito**: Gestionar renderizado, búsqueda y paginación de tablas.

#### `usePagination`
Maneja la paginación de datos.

```typescript
const {
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  itemsPerPage,
  totalItems,
  goToPage,
  nextPage,
  prevPage,
  firstPage,
  lastPage,
  setItemsPerPage,
  getPaginatedData,
  getPageInfo
} = usePagination(data, initialItemsPerPage);
```

**Propósito**: Gestionar paginación de manera reutilizable.

## 🧩 Componentes Reutilizables

### 1. `ParameterForm`
Formulario reutilizable para parámetros del sistema.

```typescript
<ParameterForm
  selectedTable="pais"
  formData={formData}
  onFormDataChange={setFormData}
  onSuccess={(message) => showSuccess('Éxito', message)}
  onError={(error) => showError('Error', error)}
  existingData={getCurrentTableData()}
  isUpdate={false}
  originalData={{}}
/>
```

**Props**:
- `selectedTable`: Tabla seleccionada
- `formData`: Datos del formulario
- `onFormDataChange`: Callback para cambios en datos
- `onSuccess`: Callback para éxito
- `onError`: Callback para errores
- `existingData`: Datos existentes para validación
- `isUpdate`: Si es actualización
- `originalData`: Datos originales para actualización

### 2. `ParameterTable`
Tabla reutilizable con funcionalidades avanzadas.

```typescript
<ParameterTable
  data={tableData}
  columns={columns}
  onRowSelect={handleRowSelect}
  onRowEdit={handleRowEdit}
  onRowDelete={handleRowDelete}
  selectedRows={selectedRows}
  onSelectionChange={setSelectedRows}
  searchable={true}
  paginated={true}
  itemsPerPage={10}
  className="custom-table"
/>
```

**Props**:
- `data`: Datos de la tabla
- `columns`: Configuración de columnas
- `onRowSelect`: Callback para selección de fila
- `onRowEdit`: Callback para edición de fila
- `onRowDelete`: Callback para eliminación de fila
- `selectedRows`: Filas seleccionadas
- `onSelectionChange`: Callback para cambio de selección
- `searchable`: Si permite búsqueda
- `paginated`: Si permite paginación
- `itemsPerPage`: Elementos por página
- `className`: Clases CSS personalizadas

### 3. `MassiveOperations`
Modal para operaciones masivas.

```typescript
<MassiveOperations
  selectedTable="pais"
  onSuccess={(message) => showSuccess('Éxito', message)}
  onError={(error) => showError('Error', error)}
  onClose={() => setActiveSubTab('insert')}
  operationType="insert"
  existingData={getCurrentTableData()}
  updateData={updateData}
/>
```

**Props**:
- `selectedTable`: Tabla seleccionada
- `onSuccess`: Callback para éxito
- `onError`: Callback para errores
- `onClose`: Callback para cerrar modal
- `operationType`: Tipo de operación ('insert' | 'update')
- `existingData`: Datos existentes
- `updateData`: Datos para actualización

### 4. `NotificationSystem`
Sistema de notificaciones.

```typescript
<NotificationSystem
  notifications={notifications}
  onRemoveNotification={removeNotification}
  onClearAll={clearAllNotifications}
/>
```

**Props**:
- `notifications`: Array de notificaciones
- `onRemoveNotification`: Callback para remover notificación
- `onClearAll`: Callback para limpiar todas

### 5. `useNotifications`
Hook para manejar notificaciones.

```typescript
const {
  notifications,
  addNotification,
  removeNotification,
  clearAll,
  showSuccess,
  showError,
  showWarning,
  showInfo
} = useNotifications();
```

**Métodos**:
- `showSuccess(title, message)`: Mostrar notificación de éxito
- `showError(title, message)`: Mostrar notificación de error
- `showWarning(title, message)`: Mostrar notificación de advertencia
- `showInfo(title, message)`: Mostrar notificación de información

## 📖 Guía de Uso

### 1. Implementación Básica

```typescript
import { SystemParametersRefactored } from './components/SystemParametersRefactored';

function App() {
  return (
    <div className="App">
      <SystemParametersRefactored />
    </div>
  );
}
```

### 2. Uso de Hooks Individuales

```typescript
import { useFormValidation, useTableRendering } from './hooks';

function MyComponent() {
  const { validateInsert } = useFormValidation('pais');
  const { filteredData, searchTerm, setSearchTerm } = useTableRendering(data, 10);
  
  // Usar los hooks...
}
```

### 3. Uso de Componentes Reutilizables

```typescript
import { ParameterForm, ParameterTable } from './components/SystemParameters';

function MyForm() {
  return (
    <ParameterForm
      selectedTable="pais"
      formData={formData}
      onFormDataChange={setFormData}
      onSuccess={handleSuccess}
      onError={handleError}
      existingData={existingData}
    />
  );
}
```

## 💡 Ejemplos de Implementación

### 1. Formulario Personalizado

```typescript
function CustomForm() {
  const { formData, setFormData } = useFormState();
  const { validateInsert } = useFormValidation('pais');
  const { getEnabledFields } = useProgressiveEnablement('pais', formData);
  
  const handleSubmit = async () => {
    const validation = await validateInsert(formData);
    if (validation.isValid) {
      // Proceder con inserción
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Campos del formulario */}
    </form>
  );
}
```

### 2. Tabla Personalizada

```typescript
function CustomTable() {
  const { filteredData, searchTerm, setSearchTerm } = useTableRendering(data, 10);
  
  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar..."
      />
      <table>
        {filteredData.map(row => (
          <tr key={row.id}>
            {/* Celdas de la tabla */}
          </tr>
        ))}
      </table>
    </div>
  );
}
```

### 3. Sistema de Notificaciones

```typescript
function MyComponent() {
  const { showSuccess, showError, notifications } = useNotifications();
  
  const handleAction = async () => {
    try {
      // Realizar acción
      showSuccess('Éxito', 'Acción completada correctamente');
    } catch (error) {
      showError('Error', 'No se pudo completar la acción');
    }
  };
  
  return (
    <div>
      <button onClick={handleAction}>Realizar Acción</button>
      <NotificationSystem
        notifications={notifications}
        onRemoveNotification={removeNotification}
        onClearAll={clearAll}
      />
    </div>
  );
}
```

## 🎯 Mejores Prácticas

### 1. Uso de Hooks

- **Siempre usar hooks al inicio del componente**
- **No usar hooks dentro de loops o condiciones**
- **Usar useCallback para funciones que se pasan como props**
- **Usar useMemo para cálculos costosos**

### 2. Manejo de Estado

- **Centralizar estado relacionado en hooks personalizados**
- **Usar estado local para UI, estado global para datos**
- **Evitar prop drilling usando context o hooks**

### 3. Validación

- **Validar datos antes de enviar al servidor**
- **Mostrar errores de manera consistente**
- **Usar validación progresiva para mejor UX**

### 4. Rendimiento

- **Usar React.memo para componentes que no cambian frecuentemente**
- **Usar useMemo para cálculos costosos**
- **Usar useCallback para funciones que se pasan como props**
- **Implementar paginación para grandes conjuntos de datos**

### 5. Testing

- **Escribir tests para hooks personalizados**
- **Escribir tests para componentes reutilizables**
- **Usar mocks para dependencias externas**
- **Probar casos edge y errores**

### 6. Accesibilidad

- **Usar etiquetas apropiadas para formularios**
- **Implementar navegación por teclado**
- **Usar colores con suficiente contraste**
- **Proporcionar texto alternativo para imágenes**

## 🔄 Migración desde Componente Original

### 1. Reemplazo Gradual

```typescript
// Antes
import SystemParameters from './components/SystemParameters';

// Después
import { SystemParametersRefactored } from './components/SystemParametersRefactored';
```

### 2. Uso de Hooks Individuales

```typescript
// Antes: Lógica duplicada en múltiples componentes
const [formData, setFormData] = useState({});
const [isLoading, setIsLoading] = useState(false);

// Después: Hooks reutilizables
const { formData, setFormData } = useFormState();
const { isLoading } = useTableData();
```

### 3. Componentes Reutilizables

```typescript
// Antes: Formularios duplicados
function PaisForm() { /* lógica específica */ }
function EmpresaForm() { /* lógica similar */ }

// Después: Componente reutilizable
<ParameterForm selectedTable="pais" />
<ParameterForm selectedTable="empresa" />
```

## 📚 Recursos Adicionales

- [Documentación de React Hooks](https://reactjs.org/docs/hooks-intro.html)
- [Guía de Testing de Hooks](https://react-hooks-testing-library.com/)
- [Mejores Prácticas de TypeScript](https://typescript-eslint.io/rules/)
- [Guía de Accesibilidad Web](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Nota**: Esta documentación se actualiza constantemente. Para la versión más reciente, consulta el repositorio del proyecto.
