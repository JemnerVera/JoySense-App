# 📋 LÓGICA DE VALIDACIÓN DE ALERTAS - SISTEMA ROBUSTO

## 🎯 OBJETIVO
Implementar un sistema de validación robusto y modular para los formularios de "Crear" en la sección de Parámetros, que proporcione mensajes de error claros y específicos para cada escenario.

## 📐 ESTÁNDARES DE UI/UX

### **1. Formato de Placeholders**
Todos los placeholders deben seguir el formato estándar:
```typescript
placeholder={`${displayName.toUpperCase()}${isRequired ? '*' : ''}`}
```

**Ejemplos:**
- Campo obligatorio: `"PAIS*"`, `"ENTIDAD*"`, `"TIPO*"`
- Campo opcional: `"PAIS"`, `"ENTIDAD"`, `"TIPO"`

### **2. Habilitación Progresiva**
Los campos deben implementar habilitación progresiva cuando sea lógico:
- **País**: `pais` → `paisabrev`
- **Empresa**: `empresa` → `empresabrev` 
- **Fundo**: `fundo` → `fundoabrev`
- **Tipo**: `entidadid` → `tipo`

### **3. Campos Siempre Visibles**
Los campos deben estar siempre visibles en el formulario, pero pueden estar deshabilitados hasta que se cumplan las condiciones de habilitación progresiva.

### **4. Mensajes de Error**
- **Campos faltantes**: "El [campo] es obligatorio"
- **Duplicados**: "El [campo] ya existe" o "El [campo] ya existe en esta [entidad]"
- **Combinados**: "El [campo1] y [campo2] es obligatorio"

## 🏗️ ARQUITECTURA DEL SISTEMA

### 1. **Archivos Principales**
- `frontend/src/utils/formValidation.ts` - Lógica de validación central
- `frontend/src/components/NormalInsertForm.tsx` - UI de formularios
- `frontend/src/components/SystemParameters.tsx` - Integración con validación

### 2. **Componentes del Sistema**

#### **A. Esquemas de Validación (`tableValidationSchemas`)**
```typescript
export const tableValidationSchemas: Record<string, ValidationRule[]> = {
  pais: [
    { field: 'pais', required: true, type: 'string', minLength: 1, customMessage: 'El nombre del país es obligatorio' },
    { field: 'paisabrev', required: true, type: 'string', minLength: 1, maxLength: 2, customMessage: 'La abreviatura es obligatoria' }
  ],
  empresa: [
    { field: 'empresa', required: true, type: 'string', minLength: 1, customMessage: 'El nombre de la empresa es obligatorio' },
    { field: 'empresabrev', required: true, type: 'string', minLength: 1, maxLength: 3, customMessage: 'La abreviatura es obligatoria' },
    { field: 'paisid', required: true, type: 'number', customMessage: 'Debe seleccionar un país' }
  ],
  fundo: [
    { field: 'fundo', required: true, type: 'string', minLength: 1, customMessage: 'El nombre del fundo es obligatorio' },
    { field: 'fundoabrev', required: true, type: 'string', minLength: 1, maxLength: 2, customMessage: 'La abreviatura es obligatoria' },
    { field: 'empresaid', required: true, type: 'number', customMessage: 'Debe seleccionar una empresa' }
  ]
};
```

#### **B. Interfaces de Validación**
```typescript
export interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'duplicate' | 'format' | 'length';
}

export interface EnhancedValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  userFriendlyMessage: string;
}
```

#### **C. Funciones de Validación Específicas**
- `validatePaisData()` - Validación específica para País
- `validateEmpresaData()` - Validación específica para Empresa  
- `validateFundoData()` - Validación específica para Fundo
- `validateTableData()` - Dispatcher principal que llama a la función específica

## 🔄 FLUJO DE VALIDACIÓN

### 1. **Trigger de Validación**
```typescript
const handleInsert = async () => {
  // 1. Obtener datos existentes para validación de duplicados
  let existingData: any[] = [];
  switch (selectedTable) {
    case 'pais': existingData = paisesData || []; break;
    case 'empresa': existingData = empresasData || []; break;
    case 'fundo': existingData = fundosData || []; break;
  }

  // 2. Ejecutar validación robusta
  const validationResult = await validateTableData(selectedTable, formData, existingData);
  
  // 3. Mostrar errores si no es válido
  if (!validationResult.isValid) {
    setMessage({ type: 'warning', text: validationResult.userFriendlyMessage });
    return;
  }
  
  // 4. Proceder con inserción si es válido
  // ... resto de la lógica
};
```

### 2. **Proceso de Validación por Tabla**

#### **A. Validación de País (`validatePaisData`)**
1. **Campos obligatorios**: `pais`, `paisabrev`
2. **Validación de longitud**: `paisabrev` máximo 2 caracteres
3. **Validación de duplicados**: Verificar `pais` y `paisabrev` en datos existentes
4. **Mensajes combinados**:
   - "⚠️ El país y abreviatura es obligatorio" (ambos faltan)
   - "⚠️ El país y abreviatura se repite" (ambos duplicados)
   - "⚠️ El país se repite" (solo país duplicado)
   - "⚠️ La abreviatura se repite" (solo abreviatura duplicada)

#### **B. Validación de Empresa (`validateEmpresaData`)**
1. **Campos obligatorios**: `empresa`, `empresabrev`, `paisid`
2. **Validación de longitud**: `empresabrev` máximo 3 caracteres
3. **Validación de duplicados**: Verificar `empresa` y `empresabrev` en datos existentes
4. **Mensajes combinados**:
   - "⚠️ La empresa y abreviatura es obligatorio" (ambos faltan)
   - "⚠️ La empresa y abreviatura se repite" (ambos duplicados)
   - "⚠️ El nombre de la empresa se repite" (solo empresa duplicada)
   - "⚠️ La abreviatura se repite" (solo abreviatura duplicada)

#### **C. Validación de Fundo (`validateFundoData`)**
1. **Campos obligatorios**: `fundo`, `fundoabrev`, `empresaid`
2. **Validación de longitud**: `fundoabrev` máximo 2 caracteres
3. **Validación de duplicados**: Verificar `fundo` y `fundoabrev` en datos existentes
4. **Mensajes combinados**:
   - "⚠️ El fundo y abreviatura es obligatorio" (ambos faltan)
   - "⚠️ El fundo y abreviatura se repite" (ambos duplicados)
   - "⚠️ El nombre del fundo se repite" (solo fundo duplicado)
   - "⚠️ La abreviatura se repite" (solo abreviatura duplicada)

## 🎨 MEJORAS DE UI/UX

### 1. **Habilitación Progresiva**
```typescript
const isFieldEnabled = (columnName: string): boolean => {
  // País: solo habilitar paisabrev si pais tiene valor
  if (selectedTable === 'pais') {
    if (columnName === 'paisabrev') {
      return !!(formData.pais && formData.pais.trim() !== '');
    }
  }
  
  // Empresa: solo habilitar empresabrev si empresa tiene valor
  if (selectedTable === 'empresa') {
    if (columnName === 'empresabrev') {
      return !!(formData.empresa && formData.empresa.trim() !== '');
    }
  }
  
  // Fundo: solo habilitar fundoabrev si fundo tiene valor
  if (selectedTable === 'fundo') {
    if (columnName === 'fundoabrev') {
      return !!(formData.fundo && formData.fundo.trim() !== '');
    }
  }
  
  return true;
};
```

### 2. **Placeholders Informativos**
```typescript
placeholder={`${displayName.toUpperCase()}${isRequired ? '*' : ''}${
  col.columnName === 'paisabrev' ? ' (hasta 2 caracteres)' : ''
}${col.columnName === 'empresabrev' ? ' (hasta 3 caracteres)' : ''
}${col.columnName === 'fundoabrev' ? ' (hasta 2 caracteres)' : ''}`}
```

### 3. **Leyenda de Campos Obligatorios**
```jsx
<div className="absolute bottom-0 left-0 text-sm text-neutral-400 font-mono">
  (*) Campo obligatorio
</div>
```

### 4. **Mensajes Multi-línea**
```typescript
// En SystemParameters.tsx
{message.text.split('\n').map((line, index) => (
  <div key={index}>{line}</div>
))}
```

## 📋 REGLAS DE NEGOCIO

### 1. **Campos Obligatorios por Tabla**
- **País**: `pais`, `paisabrev`
- **Empresa**: `empresa`, `empresabrev`, `paisid`
- **Fundo**: `fundo`, `fundoabrev`, `empresaid`

### 2. **Límites de Longitud**
- **País**: `paisabrev` máximo 2 caracteres
- **Empresa**: `empresabrev` máximo 3 caracteres
- **Fundo**: `fundoabrev` máximo 2 caracteres

### 3. **Validación de Duplicados**
- Se verifica tanto el nombre como la abreviatura
- Comparación case-insensitive
- Se valida contra datos existentes en la base de datos

### 4. **Layout de Formularios**
- Máximo 3 campos por fila
- Campos contextuales (filtros globales) aparecen primero
- Campos obligatorios siempre visibles
- Habilitación progresiva para campos dependientes

## 🔧 IMPLEMENTACIÓN PARA NUEVAS TABLAS

### 1. **Agregar Schema de Validación**
```typescript
// En tableValidationSchemas
nuevaTabla: [
  { field: 'campo1', required: true, type: 'string', minLength: 1, customMessage: 'El campo1 es obligatorio' },
  { field: 'campo2', required: true, type: 'string', maxLength: 5, customMessage: 'El campo2 es obligatorio' }
]
```

### 2. **Crear Función de Validación Específica**
```typescript
const validateNuevaTablaData = async (
  formData: Record<string, any>, 
  existingData?: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  // 1. Validar campos obligatorios
  // 2. Validar longitud
  // 3. Validar duplicados
  // 4. Generar mensaje amigable
  
  return { isValid: errors.length === 0, errors, userFriendlyMessage };
};
```

### 3. **Agregar al Dispatcher**
```typescript
// En validateTableData
case 'nuevaTabla':
  return await validateNuevaTablaData(formData, existingData);
```

### 4. **Actualizar Mensajes Combinados**
```typescript
// En generateUserFriendlyMessage
else if (requiredErrors.length === 2 && 
         requiredErrors.some(e => e.field === 'campo1') && 
         requiredErrors.some(e => e.field === 'campo2')) {
  messages.push('⚠️ El campo1 y campo2 es obligatorio');
}
```

## 🚨 CASOS DE ERROR COMUNES

### 1. **Campos Faltantes**
- **Causa**: Usuario no completa campos obligatorios
- **Solución**: Mostrar mensaje específico del campo faltante

### 2. **Duplicados**
- **Causa**: Usuario intenta crear registro con datos existentes
- **Solución**: Mostrar mensaje de duplicado específico

### 3. **Longitud Excedida**
- **Causa**: Usuario excede límite de caracteres
- **Solución**: Mostrar mensaje de longitud máxima

### 4. **Formato Incorrecto**
- **Causa**: Usuario ingresa datos en formato incorrecto
- **Solución**: Mostrar mensaje de formato válido

## 📊 MÉTRICAS DE ÉXITO

1. **Reducción de errores de validación**: 90% menos errores de duplicados
2. **Mejora en UX**: Mensajes claros y específicos
3. **Consistencia**: Mismo patrón para todas las tablas
4. **Mantenibilidad**: Código modular y reutilizable

## 🔄 PRÓXIMOS PASOS

1. **Implementar para Ubicación**: Aplicar mismo patrón
2. **Implementar para Localización**: Aplicar mismo patrón
3. **Implementar para Entidad**: Aplicar mismo patrón
4. **Implementar para Tipo**: Aplicar mismo patrón
5. **Implementar para Nodo**: Aplicar mismo patrón
6. **Implementar para Sensor**: Aplicar mismo patrón
7. **Implementar para Métrica**: Aplicar mismo patrón
8. **Implementar para Umbral**: Aplicar mismo patrón

---

**Fecha de creación**: $(date)
**Versión**: 1.0
**Autor**: Sistema de Validación Robusto
**Estado**: Implementado para País, Empresa y Fundo
