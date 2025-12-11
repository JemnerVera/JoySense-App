# 📋 Plan de Implementación: Restaurar Formulario de Crear

## 🎯 Objetivo
Restaurar el diseño y funcionalidades del formulario de "Crear" tal como estaba antes de la refactorización, manteniendo una estructura funcional, limpia y organizada.

---

## 🔍 Análisis del Diseño Anterior

### 1. **Estilos de Botones**

#### Botón Guardar:
- **Color**: `bg-orange-500` con hover `bg-orange-600`
- **Texto**: Blanco, font-mono, tracking-wider
- **Icono**: ➕ (emoji)
- **Estado disabled**: `opacity-50 cursor-not-allowed`
- **Texto cuando loading**: "GUARDANDO..."
- **Posición**: Centrado, junto a botón Cancelar
- **Clases**: `px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-mono tracking-wider`

#### Botón Cancelar:
- **Color**: `bg-gray-200 dark:bg-neutral-800` con border `border-gray-300 dark:border-neutral-600`
- **Hover**: `hover:bg-gray-300 dark:hover:bg-neutral-700`
- **Texto**: `text-gray-900 dark:text-white`
- **Icono**: ❌ (emoji)
- **Clases**: `px-6 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors font-medium flex items-center space-x-2 font-mono tracking-wider`

#### Posición de Botones:
- **Contenedor**: `flex justify-center items-center mt-8 space-x-4`
- **Centrados horizontalmente**
- **Espaciado**: `space-x-4` entre botones

### 2. **Estilos de Inputs**

#### Inputs de Texto/Número:
- **Background**: `bg-neutral-800` (habilitado) / `bg-neutral-700` (deshabilitado)
- **Border**: `border-neutral-600`
- **Texto**: `text-white text-base`
- **Placeholder**: `placeholder-neutral-400 font-mono`
- **Focus**: `focus:ring-2 focus:ring-orange-500 focus:border-orange-500`
- **Disabled**: `opacity-50 cursor-not-allowed`
- **Clases completas**: `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white text-base placeholder-neutral-400 font-mono bg-neutral-800 border-neutral-600`

#### Labels:
- **Texto**: `text-lg font-bold font-mono tracking-wider`
- **Color**: `text-orange-500` (habilitado) / `text-gray-500` (deshabilitado)
- **Clases**: `block text-lg font-bold mb-2 font-mono tracking-wider text-orange-500`

### 3. **Placeholders de Inputs**

- **Formato**: `DISPLAY_NAME.toUpperCase()`
- **Ejemplo**: Si el campo es "pais", el placeholder es "PAÍS"
- **Estilo**: `placeholder-neutral-400 font-mono`
- **Uso**: Siempre mostrar el nombre de la columna en mayúsculas

### 4. **Estilos y Funcionalidad de Combobox**

#### Componente: `SelectWithPlaceholder`
- **Background**: `bg-gray-200 dark:bg-neutral-800`
- **Border**: `border-gray-300 dark:border-neutral-600`
- **Focus**: `focus:ring-2 focus:ring-orange-500 focus:border-orange-500`
- **Texto**: `text-gray-800 dark:text-white font-mono`
- **Placeholder**: Muestra el placeholder en mayúsculas cuando no hay valor
- **Funcionalidad**:
  - Dropdown personalizado con búsqueda
  - Opciones en mayúsculas
  - Opción seleccionada con fondo `bg-orange-500`
  - Hover: `hover:bg-gray-100 dark:hover:bg-neutral-800`
  - Búsqueda integrada en el dropdown

### 5. **Mensajes de Alerta al Cambiar de Pestaña/Parámetro**

#### Funcionalidad Requerida:
- **Detección**: Cuando el usuario intenta cambiar de pestaña o parámetro y hay datos sin guardar
- **Confirmación**: Mostrar diálogo de confirmación antes de perder datos
- **Mensaje**: "¿Está seguro? Los datos ingresados se perderán."
- **Implementación**: 
  - Hook `useUnsavedChanges` o similar
  - Interceptar cambios de `activeSubTab` y `selectedTable`
  - Usar `window.confirm()` o componente modal personalizado
  - Solo mostrar si `formState.isDirty === true`

#### Ubicación:
- En `SystemParameters.tsx` antes de cambiar `activeSubTab` o `selectedTable`
- Verificar `hasUnsavedChanges()` antes de permitir el cambio

### 6. **Mensajes de Alerta Amarilla (Warning)**

#### Cuándo Mostrar:
- Cuando se intenta guardar con datos incompletos
- Cuando hay errores de validación
- Cuando hay datos inválidos

#### Estilo:
- **Background**: `bg-yellow-600 bg-opacity-20`
- **Border**: `border border-yellow-500`
- **Texto**: `text-white font-mono tracking-wider`
- **Componente**: `MessageDisplay` con `type: 'warning'`

#### Mensajes Típicos:
- "Por favor complete todos los campos requeridos"
- "Los datos ingresados no son válidos"
- "Error de validación: [detalle específico]"

---

## 🏗️ Plan de Implementación

### Fase 1: Crear Componente InsertTab

**Archivo**: `frontend/src/components/SystemParameters/InsertTab/InsertTab.tsx`

**Responsabilidades**:
- Orquestar el formulario de inserción
- Manejar mensajes de inserción
- Integrar formularios especiales (MultipleSensorForm, etc.)
- Mostrar InsertionMessage

**Estructura**:
```typescript
interface InsertTabProps {
  tableName: string;
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  loading: boolean;
  onInsert: () => void;
  onCancel: () => void;
  // ... otros props necesarios
}

export const InsertTab: React.FC<InsertTabProps> = ({ ... }) => {
  // Determinar qué formulario usar según la tabla
  // Renderizar formulario apropiado
  // Mostrar InsertionMessage si hay registros insertados
  // Manejar mensajes de error/warning
}
```

### Fase 2: Actualizar Estilos de Botones

**Archivo**: `frontend/src/components/SystemParameters/InsertTab/InsertTab.tsx` o componente de botones compartido

**Cambios**:
- Aplicar estilos exactos del diseño anterior
- Botón Guardar: `bg-orange-500`, icono ➕, texto "GUARDAR" / "GUARDANDO..."
- Botón Cancelar: `bg-gray-200 dark:bg-neutral-800`, icono ❌, texto "CANCELAR"
- Posición centrada con `flex justify-center items-center mt-8 space-x-4`

### Fase 3: Actualizar Estilos de Inputs

**Archivo**: `frontend/src/components/NormalInsertForm.tsx` (ya existe)

**Cambios**:
- Asegurar que todos los inputs usen:
  - `bg-neutral-800 border-neutral-600`
  - `text-white placeholder-neutral-400 font-mono`
  - `focus:ring-2 focus:ring-orange-500 focus:border-orange-500`
- Placeholders en mayúsculas: `${displayName.toUpperCase()}`

### Fase 4: Verificar/Actualizar SelectWithPlaceholder

**Archivo**: `frontend/src/components/SelectWithPlaceholder.tsx` (ya existe)

**Verificar**:
- ✅ Estilos correctos (ya están bien)
- ✅ Placeholder en mayúsculas (ya está)
- ✅ Funcionalidad de búsqueda (ya está)
- ✅ Estilos de hover y selección (ya están)

### Fase 5: Implementar Alertas al Cambiar de Pestaña/Parámetro

**Archivo**: `frontend/src/components/SystemParameters.tsx`

**Implementación**:
1. Crear hook `useUnsavedChangesWarning` o usar `hasUnsavedChanges` existente
2. Interceptar cambios en `handleSubTabChange` y `handleTableSelect`
3. Mostrar confirmación si hay cambios sin guardar:
   ```typescript
   const handleSubTabChange = useCallback((tab: 'status' | 'insert' | 'update' | 'massive') => {
     if (formState.isDirty && activeSubTab === 'insert') {
       if (!window.confirm('¿Está seguro? Los datos ingresados se perderán.')) {
         return; // Cancelar cambio
       }
     }
     setActiveSubTab(tab);
     onSubTabChange?.(tab);
     setMessage(null);
     if (tab === 'insert') resetForm();
   }, [formState.isDirty, activeSubTab, onSubTabChange, resetForm]);
   ```

### Fase 6: Implementar Mensajes de Alerta Amarilla

**Archivo**: `frontend/src/components/SystemParameters.tsx` y `frontend/src/components/SystemParameters/InsertTab/InsertTab.tsx`

**Implementación**:
1. En `handleInsert`, antes de validar:
   ```typescript
   const validationResult = validateForm();
   if (!validationResult.isValid) {
     setMessage({ 
       type: 'warning', 
       text: validationResult.errors.join('\n') || 'Por favor complete todos los campos requeridos' 
     });
     return;
   }
   ```

2. Actualizar `MessageDisplay` para mostrar warnings correctamente (ya está implementado)

3. Mostrar mensajes específicos según el error de validación

### Fase 7: Integrar InsertTab en SystemParameters

**Archivo**: `frontend/src/components/SystemParameters.tsx`

**Cambios**:
- Reemplazar `renderForm('insert')` con `<InsertTab ... />`
- Pasar todas las props necesarias
- Mantener lógica de mensajes y estado

---

## 📝 Checklist de Implementación

### Estilos
- [ ] Botones con estilos exactos (orange-500 para guardar, gray-200 para cancelar)
- [ ] Inputs con `bg-neutral-800`, `border-neutral-600`, `text-white`, `placeholder-neutral-400`
- [ ] Labels con `text-orange-500`, `font-bold`, `font-mono`, `tracking-wider`
- [ ] Placeholders en mayúsculas
- [ ] SelectWithPlaceholder con estilos correctos (ya está)

### Funcionalidad
- [ ] Alerta al cambiar de pestaña si hay datos sin guardar
- [ ] Alerta al cambiar de parámetro si hay datos sin guardar
- [ ] Mensajes de warning amarillos para datos incompletos/erróneos
- [ ] Validación antes de guardar
- [ ] InsertionMessage mostrando registros insertados

### Componentes
- [ ] Crear `InsertTab.tsx` como componente principal
- [ ] Integrar formularios especiales (MultipleSensorForm, etc.)
- [ ] Integrar NormalInsertForm para tablas normales
- [ ] Mostrar InsertionMessage cuando hay registros insertados

### Hooks y Utilidades
- [ ] Usar `hasUnsavedChanges()` para detectar cambios sin guardar
- [ ] Usar `validateForm()` para validación
- [ ] Usar `useInsertionMessages` si existe
- [ ] Usar `useReplicate` si existe

---

## 🎨 Especificaciones de Estilo Detalladas

### Botón Guardar
```tsx
<button
  onClick={onInsert}
  disabled={loading}
  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-mono tracking-wider"
>
  <span>➕</span>
  <span>{loading ? 'GUARDANDO...' : 'GUARDAR'}</span>
</button>
```

### Botón Cancelar
```tsx
<button
  onClick={onCancel}
  className="px-6 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors font-medium flex items-center space-x-2 font-mono tracking-wider"
>
  <span>❌</span>
  <span>CANCELAR</span>
</button>
```

### Input
```tsx
<input
  type="text"
  value={value}
  disabled={!isEnabled}
  onChange={(e) => { /* ... */ }}
  placeholder={`${displayName.toUpperCase()}`}
  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white text-base placeholder-neutral-400 font-mono ${
    isEnabled 
      ? 'bg-neutral-800 border-neutral-600' 
      : 'bg-neutral-700 border-neutral-600 opacity-50 cursor-not-allowed'
  }`}
/>
```

### Label
```tsx
<label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${
  isEnabled ? 'text-orange-500' : 'text-gray-500'
}`}>
  {displayName.toUpperCase()}
</label>
```

---

## 🚀 Orden de Implementación

1. **Crear InsertTab.tsx** - Componente principal que orquesta todo
2. **Actualizar estilos de botones** - Aplicar estilos exactos
3. **Actualizar estilos de inputs** - Asegurar consistencia
4. **Implementar alertas de cambio** - Interceptar cambios de pestaña/parámetro
5. **Implementar mensajes warning** - Alertas amarillas para validación
6. **Integrar en SystemParameters** - Reemplazar renderForm con InsertTab
7. **Testing** - Verificar que todo funcione como antes

---

## 📌 Notas Importantes

- Mantener la estructura modular y limpia
- Reutilizar componentes existentes cuando sea posible
- Los estilos deben ser exactos al diseño anterior
- Los mensajes deben ser claros y en español
- Las alertas deben ser no intrusivas pero visibles
