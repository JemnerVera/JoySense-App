# 🚨 FUNCIONALIDADES CRÍTICAS A PRESERVAR EN EL REFACTORING

## 📋 RESUMEN

Este documento identifica las funcionalidades críticas que **DEBEN** preservarse al 100% durante el refactoring de `SystemParameters.tsx`. Estas funcionalidades fueron implementadas después del intento anterior de refactoring y son esenciales para el funcionamiento correcto de la aplicación.

## 🎯 FUNCIONALIDADES CRÍTICAS

### **1. SISTEMA DE VALIDACIÓN ROBUSTO** ⚠️ CRÍTICO

#### **Ubicación**: `frontend/src/utils/formValidation.ts` (3,092 líneas)

#### **Funcionalidades**:
- **Validación específica por tabla** con esquemas configurables
- **Validación de actualización** con verificación de dependencias
- **Mensajes de error individuales** y combinados
- **Validación de duplicados** excluyendo registro actual
- **Verificación de relaciones padre-hijo** antes de inactivar

#### **Funciones Críticas**:
```typescript
// Validación de inserción
export function validateFormData(tableName: string, formData: Record<string, any>): ValidationResult

// Validación de actualización
export const validateTableUpdate = async (
  tableName: string,
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData?: any[]
): Promise<EnhancedValidationResult>

// Validaciones específicas por tabla
const validatePaisUpdate = async (formData, originalData, existingData): Promise<EnhancedValidationResult>
const validateEmpresaUpdate = async (formData, originalData, existingData): Promise<EnhancedValidationResult>
// ... más validaciones específicas

// Verificación de dependencias
const checkPaisDependencies = async (paisid: number): Promise<boolean>
const checkEmpresaDependencies = async (empresaid: number): Promise<boolean>
// ... más verificaciones de dependencias
```

#### **Esquemas de Validación**:
```typescript
export const tableValidationSchemas: Record<string, ValidationRule[]> = {
  pais: [
    { field: 'pais', required: true, type: 'string', minLength: 1, customMessage: 'El país es obligatorio' },
    { field: 'paisabrev', required: true, type: 'string', maxLength: 2, customMessage: 'La abreviatura es obligatoria (hasta 2 caracteres)' }
  ],
  empresa: [
    { field: 'empresa', required: true, type: 'string', minLength: 1, customMessage: 'La empresa es obligatoria' },
    { field: 'empresabrev', required: true, type: 'string', maxLength: 3, customMessage: 'La abreviatura es obligatoria (hasta 3 caracteres)' }
  ],
  // ... más esquemas
}
```

#### **⚠️ CRÍTICO**: Esta funcionalidad es la más compleja y debe preservarse completamente.

---

### **2. SISTEMA DE PROTECCIÓN DE PÉRDIDA DE DATOS** ⚠️ CRÍTICO

#### **Componentes**:
- `ProtectedSubTabButton.tsx` - Protección de cambio de subpestañas
- `ProtectedParameterButton.tsx` - Protección de cambio de parámetros
- `DataLossModal.tsx` - Modal de confirmación

#### **Hooks**:
- `useDataLossProtection.ts` - Lógica de protección
- `useDataLossModal.ts` - Manejo de modales
- `useSimpleChangeDetection.ts` - Detección de cambios

#### **Funcionalidades**:
- **Protección de cambio de subpestañas** (Estado, Crear, Actualizar, Masivo)
- **Protección de cambio de parámetros** (País, Empresa, Fundo, etc.)
- **Modales de confirmación** con mensajes específicos
- **Detección de cambios sin guardar** en formularios

#### **Implementación Crítica**:
```typescript
// Protección de cambio de subpestaña
const checkSubTabChange = useCallback((
  config: DataLossProtectionConfig,
  targetSubTab: string
): boolean => {
  const { formData, selectedTable, activeSubTab, multipleData, onConfirmAction, onCancelAction } = config;
  
  const hasChanges = hasUnsavedChanges({
    formData,
    selectedTable,
    activeSubTab,
    multipleData
  });

  if (hasChanges) {
    showModal(
      'subtab',
      getSubTabName(activeSubTab),
      getSubTabName(targetSubTab),
      onConfirmAction,
      onCancelAction
    );
    return true; // Modal mostrado, bloquear cambio
  }

  return false; // No hay cambios, permitir cambio
}, [hasUnsavedChanges, showModal]);
```

#### **⚠️ CRÍTICO**: Esta funcionalidad es esencial para la UX y debe preservarse completamente.

---

### **3. ESTRUCTURA DE SIDEBAR DE TRES NIVELES** ⚠️ CRÍTICO

#### **Componentes**:
- `AuxiliarySidebar.tsx` - Sidebar auxiliar principal
- `ParametersSidebar.tsx` - Sidebar de parámetros (segundo nivel)
- `ParametersOperationsSidebar.tsx` - Sidebar de operaciones (tercer nivel)

#### **Funcionalidades**:
- **Navegación jerárquica**: Main → Parameters → Operations
- **Colapso inteligente** con iconos centrados
- **Texto personalizado** cuando está colapsado ("...")
- **Integración con filtros globales**

#### **Implementación Crítica**:
```typescript
// Estructura de tres niveles
const AuxiliarySidebar: React.FC<AuxiliarySidebarProps> = ({
  isExpanded,
  activeTab,
  selectedTable,
  activeSubTab,
  showThirdLevel = false
}) => {
  const isParameters = activeTab === 'parameters' || activeTab.startsWith('parameters-');
  
  if (isParameters) {
    // Si showThirdLevel es true, solo renderizar el tercer sidebar
    if (showThirdLevel) {
      return (
        <ParametersOperationsSidebar
          selectedTable={selectedTable || ''}
          activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
          onSubTabChange={onSubTabChange || (() => {})}
          isExpanded={isExpanded}
          // ... más props
        />
      );
    }

    // Si no es showThirdLevel, renderizar solo el segundo sidebar
    return (
      <ParametersSidebar
        selectedTable={selectedTable || ''}
        onTableSelect={onTableSelect || (() => {})}
        activeSubTab={(activeSubTab as 'status' | 'insert' | 'update' | 'massive') || 'status'}
        onSubTabChange={onSubTabChange || (() => {})}
        isExpanded={isExpanded}
        // ... más props
      />
    );
  }
  
  // ... más lógica
};
```

#### **⚠️ CRÍTICO**: Esta estructura tiene dependencias complejas y debe preservarse completamente.

---

### **4. HABILITACIÓN PROGRESIVA DE CAMPOS** ⚠️ CRÍTICO

#### **Ubicación**: `frontend/src/components/NormalInsertForm.tsx`

#### **Funcionalidades**:
- **Lógica específica por tabla** para habilitación progresiva
- **Campos que se habilitan secuencialmente** según la lógica de negocio
- **Integración con validación** robusta

#### **Implementación Crítica**:
```typescript
// Función para determinar si un campo debe estar habilitado (habilitación progresiva)
const isFieldEnabled = (columnName: string): boolean => {
  // Para País: solo habilitar paisabrev si pais tiene valor
  if (selectedTable === 'pais') {
    if (columnName === 'paisabrev') {
      return !!(formData.pais && formData.pais.trim() !== '');
    }
    if (columnName === 'pais') {
      return true; // Siempre habilitado
    }
  }
  
  // Para Empresa: solo habilitar empresabrev si empresa tiene valor
  if (selectedTable === 'empresa') {
    if (columnName === 'empresabrev') {
      return !!(formData.empresa && formData.empresa.trim() !== '');
    }
    if (columnName === 'empresa') {
      return true; // Siempre habilitado
    }
  }
  
  // Para Nodo: habilitación progresiva nodo -> deveui -> resto
  if (selectedTable === 'nodo') {
    if (columnName === 'nodo') {
      return true; // Siempre habilitado
    }
    if (columnName === 'deveui') {
      return !!(formData.nodo && formData.nodo.trim() !== '');
    }
    // Para el resto de campos (appeui, appkey, atpin, statusid)
    if (['appeui', 'appkey', 'atpin', 'statusid'].includes(columnName)) {
      return !!(formData.nodo && formData.nodo.trim() !== '' && formData.deveui && formData.deveui.trim() !== '');
    }
  }
  
  // ... más lógica para otras tablas
  
  return true; // Por defecto, habilitado
};
```

#### **Lógica por Tabla**:
- **País**: `pais` → `paisabrev`
- **Empresa**: `empresa` → `empresabrev`
- **Fundo**: `fundo` → `fundoabrev`
- **Tipo**: `entidadid` → `tipo`
- **Nodo**: `nodo` → `deveui` → resto de campos
- **Métrica**: `metrica` → `unidad`

#### **⚠️ CRÍTICO**: Esta lógica es específica de cada tabla y debe preservarse completamente.

---

### **5. SISTEMA DE PLACEHOLDERS ESTÁNDAR** ⚠️ CRÍTICO

#### **Ubicación**: `frontend/src/components/NormalInsertForm.tsx`

#### **Funcionalidades**:
- **Formato estándar** para campos obligatorios/opcionales
- **Leyenda de campos obligatorios** en esquina inferior izquierda
- **Integración con validación** robusta

#### **Implementación Crítica**:
```typescript
// Función para determinar si un campo es obligatorio
const isFieldRequired = (columnName: string): boolean => {
  const schema = tableValidationSchemas[selectedTable];
  if (!schema) return false;
  
  const rule = schema.find(rule => rule.field === columnName);
  return rule ? rule.required : false;
};

// Renderizado de campo con placeholder estándar
const renderField = (col: any) => {
  const isRequired = isFieldRequired(col.columnName);
  const displayName = getColumnDisplayName(col.columnName);
  
  return (
    <div key={col.columnName} className="space-y-2">
      <label className="block text-sm font-medium text-neutral-300">
        {displayName}
      </label>
      <input
        type="text"
        value={formData[col.columnName] || ''}
        onChange={(e) => setFormData({ ...formData, [col.columnName]: e.target.value })}
        placeholder={`${displayName.toUpperCase()}${isRequired ? '*' : ''}`}
        disabled={!isFieldEnabled(col.columnName)}
        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
};

// Leyenda de campos obligatorios
<div className="absolute bottom-0 left-0 text-sm text-neutral-400 font-mono">
  (*) Campo obligatorio
</div>
```

#### **Formato Estándar**:
- **Campo obligatorio**: `"PAIS*"`, `"ENTIDAD*"`, `"TIPO*"`
- **Campo opcional**: `"PAIS"`, `"ENTIDAD"`, `"TIPO"`

#### **⚠️ CRÍTICO**: Este formato es estándar en toda la aplicación y debe preservarse completamente.

---

### **6. VALIDACIÓN DE ACTUALIZACIÓN POR TABLA** ⚠️ CRÍTICO

#### **Ubicación**: `frontend/src/utils/formValidation.ts`

#### **Funcionalidades**:
- **Validación específica** para cada tabla en formularios de actualización
- **Verificación de dependencias** antes de inactivar registros
- **Mensajes de error individuales** para cada campo
- **Validación de duplicados** excluyendo el registro actual

#### **Funciones Críticas Implementadas**:
```typescript
// Validaciones de actualización por tabla
const validatePaisUpdate = async (formData, originalData, existingData): Promise<EnhancedValidationResult>
const validateEmpresaUpdate = async (formData, originalData, existingData): Promise<EnhancedValidationResult>
const validateFundoUpdate = async (formData, originalData, existingData): Promise<EnhancedValidationResult>
const validateUbicacionUpdate = async (formData, originalData, existingData): Promise<EnhancedValidationResult>
const validateLocalizacionUpdate = async (formData, originalData, existingData): Promise<EnhancedValidationResult>
const validateEntidadUpdate = async (formData, originalData, existingData): Promise<EnhancedValidationResult>
const validateTipoUpdate = async (formData, originalData, existingData): Promise<EnhancedValidationResult>
const validateNodoUpdate = async (formData, originalData, existingData): Promise<EnhancedValidationResult>
const validateMetricaUpdate = async (formData, originalData, existingData): Promise<EnhancedValidationResult>
const validateUmbralUpdate = async (formData, originalData, existingData): Promise<EnhancedValidationResult>
const validatePerfilUmbralUpdate = async (formData, originalData, existingData): Promise<EnhancedValidationResult>
const validateCriticidadUpdate = async (formData, originalData, existingData): Promise<EnhancedValidationResult>
const validateMedioUpdate = async (formData, originalData, existingData): Promise<EnhancedValidationResult>
const validateContactoUpdate = async (formData, originalData, existingData): Promise<EnhancedValidationResult>
const validateUsuarioUpdate = async (formData, originalData, existingData): Promise<EnhancedValidationResult>
const validatePerfilUpdate = async (formData, originalData, existingData): Promise<EnhancedValidationResult>
const validateUsuarioPerfilUpdate = async (formData, originalData, existingData): Promise<EnhancedValidationResult>

// Verificaciones de dependencias
const checkPaisDependencies = async (paisid: number): Promise<boolean>
const checkEmpresaDependencies = async (empresaid: number): Promise<boolean>
const checkFundoDependencies = async (fundoid: number): Promise<boolean>
const checkUbicacionDependencies = async (ubicacionid: number): Promise<boolean>
const checkEntidadDependencies = async (entidadid: number): Promise<boolean>
const checkTipoDependencies = async (tipoid: number): Promise<boolean>
const checkNodoDependencies = async (nodoid: number): Promise<boolean>
const checkMetricaDependencies = async (metricaid: number): Promise<boolean>
const checkUmbralDependencies = async (umbralid: number): Promise<boolean>
const checkCriticidadDependencies = async (criticidadid: number): Promise<boolean>
const checkMedioDependencies = async (medioid: number): Promise<boolean>
const checkUsuarioDependencies = async (usuarioid: number): Promise<boolean>
const checkPerfilDependencies = async (perfilid: number): Promise<boolean>
```

#### **Lógica de Validación**:
1. **Validar campos obligatorios** con mensajes específicos
2. **Validar duplicados** excluyendo el registro actual
3. **Verificar dependencias** antes de inactivar
4. **Generar mensajes amigables** para el usuario

#### **⚠️ CRÍTICO**: Esta funcionalidad es la más compleja y debe preservarse completamente.

---

## 🔍 DEPENDENCIAS CRÍTICAS

### **Dependencias de Componentes Hijos**:

#### **NormalInsertForm**:
- **Requiere**: `getUniqueOptionsForField`, `visibleColumns`, `formData`
- **Proporciona**: Validación robusta, habilitación progresiva
- **Integración**: Sistema de validación, placeholders estándar

#### **AdvancedSensorUpdateForm**:
- **Requiere**: `selectedRows`, `getUniqueOptionsForField`
- **Proporciona**: Actualización avanzada de sensores
- **Integración**: Sistema de selección múltiple

#### **MassiveSensorForm**:
- **Requiere**: `getUniqueOptionsForField`, datos relacionados
- **Proporciona**: Inserción masiva de sensores
- **Integración**: Sistema de validación masiva

#### **MultipleSensorForm**:
- **Requiere**: Estados específicos, validaciones
- **Proporciona**: Inserción múltiple de sensores
- **Integración**: Sistema de validación múltiple

### **Dependencias de Hooks**:

#### **useDataLossProtection**:
- **Requiere**: `formData`, `selectedTable`, `activeSubTab`
- **Proporciona**: Protección contra pérdida de datos
- **Integración**: Modales de confirmación

#### **useInsertionMessages**:
- **Requiere**: Estados de inserción
- **Proporciona**: Mensajes de éxito/error
- **Integración**: Sistema de notificaciones

#### **useReplicate**:
- **Requiere**: Datos de formulario
- **Proporciona**: Funcionalidad de replicación
- **Integración**: Botones de replicación

### **Dependencias de Servicios**:

#### **JoySenseService**:
- **CRUD operations** para todas las tablas
- **Validación de dependencias**
- **Integración con Supabase**

#### **formValidation**:
- **Validación robusta** por tabla
- **Verificación de duplicados**
- **Validación de dependencias**

---

## ⚠️ REGLAS CRÍTICAS PARA EL REFACTORING

### **✅ HACER:**
1. **Preservar todas las nuevas funcionalidades** implementadas
2. **Mantener compatibilidad** con el sistema de validación robusto
3. **Preservar la estructura de sidebar** de tres niveles
4. **Mantener la protección de pérdida de datos**
5. **Preservar la habilitación progresiva** de campos
6. **Mantener el sistema de placeholders** estándar
7. **Preservar todas las validaciones** de actualización
8. **Testing exhaustivo** en cada fase
9. **Documentar todos los cambios** realizados
10. **Mantener las APIs** existentes de componentes hijos

### **❌ NO HACER:**
1. **Romper la integración** con el sistema de validación
2. **Perder la funcionalidad** de protección de datos
3. **Cambiar la estructura** de sidebar sin mapear dependencias
4. **Modificar la lógica** de habilitación progresiva
5. **Alterar los placeholders** estándar
6. **Perder las validaciones** de dependencias
7. **Saltar fases** del refactoring
8. **Ignorar tests** de regresión
9. **Cambiar interfaces** de componentes hijos sin entender su uso completo
10. **Separar componentes** sin mapear dependencias

---

## 📊 MÉTRICAS DE ÉXITO

### **Antes del Refactoring:**
- **Líneas de código**: 14,317
- **Funcionalidades críticas**: 6 sistemas complejos
- **Dependencias**: Múltiples y complejas
- **Mantenibilidad**: Baja

### **Después del Refactoring:**
- **Líneas por componente**: < 500
- **Funcionalidades preservadas**: 100%
- **Dependencias**: Claramente definidas
- **Mantenibilidad**: Alta
- **Funcionalidad**: 100% preservada

---

## 📝 NOTAS IMPORTANTES

1. **El refactoring anterior falló** porque no consideró las nuevas funcionalidades
2. **Las nuevas funcionalidades son críticas** y deben preservarse completamente
3. **El sistema de validación robusto** es la funcionalidad más compleja
4. **La protección de pérdida de datos** es esencial para la UX
5. **La estructura de sidebar de tres niveles** tiene dependencias complejas
6. **Cada fase debe ser probada exhaustivamente** antes de continuar
7. **La preservación de funcionalidad es prioritaria** sobre la elegancia del código
8. **Este documento debe ser consultado** en cada paso del refactoring

---

**Fecha de creación**: $(date)
**Autor**: AI Assistant
**Estado**: Documento crítico para refactoring
**Prioridad**: MÁXIMA
**Uso**: Consulta obligatoria durante el refactoring
