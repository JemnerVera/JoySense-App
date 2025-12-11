# 📋 Plan de Implementación: Restaurar Tab "Actualizar" (UpdateTab)

## 🎯 Objetivo
Restaurar la funcionalidad completa del tab "Actualizar" siguiendo la nueva arquitectura modular, similar a como se implementó `StatusTab` e `InsertTab`.

## 📊 Análisis del Comportamiento Anterior

### Flujo de Actualización:
1. **Usuario selecciona tab "Actualizar"** → Se muestra una tabla con todos los registros
2. **Usuario hace clic en una fila** → Se selecciona esa fila y aparece el formulario de actualización
3. **Formulario se muestra** → Con los datos de la fila seleccionada pre-cargados
4. **Usuario modifica campos** → Los cambios se reflejan en el formulario
5. **Usuario hace clic en "Actualizar"** → Se guardan los cambios
6. **Usuario hace clic en "Cancelar"** → Se cierra el formulario y vuelve a la tabla

### Características Especiales:
- **Tabla de selección**: Similar a la tabla de Estado, pero con funcionalidad de selección
- **Formulario modal/overlay**: El formulario aparece sobre la tabla (o reemplaza la vista)
- **Campos clave como solo lectura**: Los campos que son parte de la clave primaria se muestran con 🔒
- **Statusid como checkbox**: En lugar de input numérico
- **Validación específica**: Validaciones diferentes para update vs insert
- **Formularios avanzados**: Para `sensor`, `metricasensor`, `usuarioperfil` (similar a InsertTab)

## 🏗️ Arquitectura Propuesta

### Estructura de Componentes:

```
SystemParameters/
├── UpdateTab/
│   ├── UpdateTab.tsx (Componente principal - ORQUESTADOR)
│   ├── UpdateTable.tsx (Tabla de selección - similar a StatusTable)
│   ├── UpdateTableRow.tsx (Fila de tabla con selección)
│   ├── UpdateFormModal.tsx (Modal overlay para formulario)
│   └── forms/
│       ├── NormalUpdateForm.tsx (Formulario normal)
│       ├── AdvancedSensorUpdateForm.tsx (Ya existe)
│       ├── AdvancedMetricaSensorUpdateForm.tsx (Ya existe)
│       └── AdvancedUsuarioPerfilUpdateForm.tsx (Si existe)
```

### Hooks Necesarios:

```
hooks/
├── useUpdateTable.ts (NUEVO)
│   ├── Maneja tabla de selección
│   ├── Maneja búsqueda y filtrado
│   ├── Maneja paginación
│   └── Maneja selección de fila
└── useUpdateForm.ts (NUEVO)
    ├── Maneja carga de datos de fila seleccionada
    ├── Maneja validación de update
    ├── Maneja actualización
    └── Maneja reset del formulario
```

## 📝 Plan de Implementación Detallado

### Fase 1: Crear Hook `useUpdateTable`
**Archivo**: `frontend/src/hooks/useUpdateTable.ts`

**Responsabilidades**:
- Encapsular lógica de tabla de actualización
- Manejar búsqueda y filtrado (similar a `useStatusTable`)
- Manejar paginación
- Retornar datos filtrados y paginados

**Interfaz**:
```typescript
interface UseUpdateTableProps {
  tableName: string;
  tableData: any[];
  columns: ColumnInfo[];
  relatedData: RelatedData;
  itemsPerPage?: number;
}

interface UseUpdateTableReturn {
  filteredData: any[];
  paginatedData: any[];
  visibleColumns: ColumnInfo[];
  currentPage: number;
  totalPages: number;
  handlePageChange: (page: number) => void;
  searchTerm: string;
  handleSearchChange: (term: string) => void;
  hasSearched: boolean;
}
```

### Fase 2: Crear Hook `useUpdateForm`
**Archivo**: `frontend/src/hooks/useUpdateForm.ts`

**Responsabilidades**:
- Cargar datos de la fila seleccionada al formulario
- Manejar validación específica de update
- Manejar actualización de registro
- Manejar reset y limpieza

**Interfaz**:
```typescript
interface UseUpdateFormProps {
  selectedRow: any | null;
  tableName: string;
  config: TableConfig | null;
  updateRow: (id: string | Record<string, any>, data: Record<string, any>) => Promise<{success: boolean, error?: string}>;
  getPrimaryKeyValue: (row: any) => string | Record<string, any>;
  user: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface UseUpdateFormReturn {
  formData: Record<string, any>;
  formErrors: Record<string, string>;
  isSubmitting: boolean;
  updateFormField: (field: string, value: any) => void;
  handleUpdate: () => Promise<void>;
  handleCancel: () => void;
  validateForm: () => boolean;
}
```

### Fase 3: Crear Componente `UpdateTable`
**Archivo**: `frontend/src/components/SystemParameters/UpdateTab/UpdateTable.tsx`

**Responsabilidades**:
- Renderizar tabla de selección (similar a `StatusTable`)
- Mostrar fila seleccionada con estilo destacado
- Manejar clic en fila para seleccionar

**Props**:
```typescript
interface UpdateTableProps {
  data: any[];
  columns: ColumnInfo[];
  relatedData: RelatedData;
  selectedRow: any | null;
  onRowClick: (row: any) => void;
  loading?: boolean;
}
```

### Fase 4: Crear Componente `UpdateFormModal`
**Archivo**: `frontend/src/components/SystemParameters/UpdateTab/UpdateFormModal.tsx`

**Responsabilidades**:
- Renderizar modal overlay con formulario
- Mostrar campos clave como solo lectura con 🔒
- Manejar botones de acción (Actualizar/Cancelar)
- Cerrar modal al cancelar o completar

**Props**:
```typescript
interface UpdateFormModalProps {
  isOpen: boolean;
  formData: Record<string, any>;
  formErrors: Record<string, string>;
  isSubmitting: boolean;
  config: TableConfig | null;
  relatedData: RelatedData;
  updateFormField: (field: string, value: any) => void;
  handleUpdate: () => Promise<void>;
  handleCancel: () => void;
  visibleColumns?: any[];
  getColumnDisplayName?: (columnName: string) => string;
}
```

### Fase 5: Crear Componente `NormalUpdateForm`
**Archivo**: `frontend/src/components/SystemParameters/UpdateTab/forms/NormalUpdateForm.tsx`

**Responsabilidades**:
- Renderizar formulario de actualización normal
- Mostrar campos editables
- Mostrar campos clave como solo lectura
- Manejar validación y errores

**Características Especiales**:
- Campos de clave primaria: mostrar con 🔒 y `readonly`
- `statusid`: mostrar como checkbox en lugar de input numérico
- Validación específica de update (usar `validateForm` con `mode: 'update'`)

### Fase 6: Crear Componente Principal `UpdateTab`
**Archivo**: `frontend/src/components/SystemParameters/UpdateTab/UpdateTab.tsx`

**Responsabilidades**:
- Orquestar tabla y formulario
- Manejar estado de selección
- Integrar hooks `useUpdateTable` y `useUpdateForm`
- Renderizar componentes apropiados según estado

**Estructura**:
```typescript
export const UpdateTab: React.FC<UpdateTabProps> = ({
  tableName,
  tableData,
  columns,
  relatedData,
  config,
  updateRow,
  getPrimaryKeyValue,
  user,
  loading,
  visibleColumns,
  getColumnDisplayName
}) => {
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  
  // Hook para tabla
  const tableHook = useUpdateTable({...});
  
  // Hook para formulario
  const formHook = useUpdateForm({
    selectedRow,
    onSuccess: () => setSelectedRow(null),
    onCancel: () => setSelectedRow(null)
  });
  
  return (
    <div>
      {selectedRow ? (
        <UpdateFormModal {...formHook} />
      ) : (
        <UpdateTable 
          {...tableHook}
          selectedRow={selectedRow}
          onRowClick={setSelectedRow}
        />
      )}
    </div>
  );
};
```

### Fase 7: Integrar en `SystemParameters.tsx`
**Cambios necesarios**:
1. Importar `UpdateTab`
2. Reemplazar `{activeSubTab === 'update' && renderForm('update')}` con `<UpdateTab ... />`
3. Pasar props necesarias desde `SystemParameters` a `UpdateTab`
4. Manejar `selectedRow` state si es necesario a nivel de `SystemParameters`

## 🔄 Flujo Completo

1. **Usuario entra a tab "Actualizar"**
   - `UpdateTab` se renderiza
   - `useUpdateTable` carga y filtra datos
   - Se muestra `UpdateTable` con todos los registros

2. **Usuario hace clic en una fila**
   - `onRowClick` se ejecuta
   - `selectedRow` se actualiza
   - `UpdateFormModal` se muestra
   - `useUpdateForm` carga datos de la fila al formulario

3. **Usuario modifica campos**
   - `updateFormField` actualiza `formData`
   - Validación se ejecuta en tiempo real

4. **Usuario hace clic en "Actualizar"**
   - `handleUpdate` se ejecuta
   - Validación completa
   - `updateRow` se llama
   - Si éxito: `onSuccess` → `selectedRow = null` → vuelve a tabla
   - Si error: muestra mensaje de error

5. **Usuario hace clic en "Cancelar"**
   - `handleCancel` se ejecuta
   - `selectedRow = null` → vuelve a tabla
   - Formulario se resetea

## 🎨 Consideraciones de Diseño

### Estilos:
- **Tabla**: Similar a `StatusTable`, pero con hover destacado
- **Fila seleccionada**: Background diferente (ej: `bg-orange-100 dark:bg-orange-900/20`)
- **Modal**: Overlay oscuro con formulario centrado
- **Campos clave**: Mostrar con icono 🔒 y estilo `readonly`
- **Statusid checkbox**: Estilo consistente con otros checkboxes

### Validación:
- Usar `validateForm` con `mode: 'update'` desde `formValidation.ts`
- Validaciones específicas por tabla (ya existen en `formValidation.ts`)
- Mostrar errores debajo de cada campo

### Mensajes:
- Usar `MessageDisplay` para mensajes de éxito/error
- Mensaje de éxito: "Registro actualizado correctamente"
- Mensaje de error: Mostrar error específico del backend

## ✅ Checklist de Implementación

- [ ] Crear `hooks/useUpdateTable.ts`
- [ ] Crear `hooks/useUpdateForm.ts`
- [ ] Crear `components/SystemParameters/UpdateTab/UpdateTable.tsx`
- [ ] Crear `components/SystemParameters/UpdateTab/UpdateTableRow.tsx` (si necesario)
- [ ] Crear `components/SystemParameters/UpdateTab/UpdateFormModal.tsx`
- [ ] Crear `components/SystemParameters/UpdateTab/forms/NormalUpdateForm.tsx`
- [ ] Crear `components/SystemParameters/UpdateTab/UpdateTab.tsx`
- [ ] Integrar `UpdateTab` en `SystemParameters.tsx`
- [ ] Probar flujo completo de actualización
- [ ] Probar validaciones
- [ ] Probar cancelación
- [ ] Probar con diferentes tablas
- [ ] Verificar estilos y UX

## 🔍 Notas Adicionales

- **Formularios avanzados**: Si existen `AdvancedSensorUpdateForm`, `AdvancedMetricaSensorUpdateForm`, etc., integrarlos similar a como se hace en `InsertTab`
- **Selección múltiple**: Por ahora, solo selección simple. La selección múltiple se puede agregar después si es necesaria.
- **Búsqueda y filtrado**: Reutilizar lógica de `useStatusTable` o `useSearchAndFilter`
- **Paginación**: Reutilizar lógica de `usePagination` o `useStatusTable`
