# 📋 LÓGICA DE VALIDACIÓN PARA FORMULARIOS DE ACTUALIZACIÓN

## 🎯 Objetivo
Implementar validación robusta en formularios de "Actualizar" que incluya:
1. **Validación de campos obligatorios** (no permitir campos vacíos)
2. **Validación de duplicados** (no permitir valores repetidos)
3. **Validación de relaciones padre-hijo** (no permitir inactivar si hay registros dependientes)

## 🔧 Implementación por Tabla

### **Tabla: PAIS**

#### **Campos a Validar:**
- `pais` (VARCHAR, NOT NULL) - Campo obligatorio
- `paisabrev` (VARCHAR, NOT NULL) - Campo obligatorio, máximo 2 caracteres

#### **Validaciones Requeridas:**

1. **Campos Obligatorios:**
   - `pais` no puede estar vacío
   - `paisabrev` no puede estar vacío

2. **Validación de Duplicados:**
   - `pais` no puede repetirse (case-insensitive)
   - `paisabrev` no puede repetirse (case-insensitive)

3. **Validación de Relaciones Padre-Hijo:**
   - **NO permitir inactivar** (`statusid = 0`) si hay registros en `empresa` que referencian este país
   - Verificar en tabla `empresa` campo `paisid`

#### **Mensajes de Error:**
- "⚠️ El país es obligatorio"
- "⚠️ La abreviatura es obligatoria"
- "⚠️ El país ya existe"
- "⚠️ La abreviatura ya existe"
- "⚠️ No se puede inactivar el país porque tiene empresas asociadas"

#### **Lógica de Validación:**
```typescript
const validatePaisUpdate = async (
  formData: Record<string, any>,
  originalData: Record<string, any>,
  existingData: any[]
): Promise<EnhancedValidationResult> => {
  const errors: ValidationError[] = [];
  
  // 1. Validar campos obligatorios
  if (!formData.pais || formData.pais.trim() === '') {
    errors.push({
      field: 'pais',
      message: 'El país es obligatorio',
      type: 'required'
    });
  }
  
  if (!formData.paisabrev || formData.paisabrev.trim() === '') {
    errors.push({
      field: 'paisabrev',
      message: 'La abreviatura es obligatoria',
      type: 'required'
    });
  }
  
  // 2. Validar duplicados (excluyendo el registro actual)
  if (formData.pais && formData.pais.trim() !== '') {
    const paisExists = existingData.some(item => 
      item.paisid !== originalData.paisid && 
      item.pais && 
      item.pais.toLowerCase() === formData.pais.toLowerCase()
    );
    
    if (paisExists) {
      errors.push({
        field: 'pais',
        message: 'El país ya existe',
        type: 'duplicate'
      });
    }
  }
  
  if (formData.paisabrev && formData.paisabrev.trim() !== '') {
    const paisabrevExists = existingData.some(item => 
      item.paisid !== originalData.paisid && 
      item.paisabrev && 
      item.paisabrev.toLowerCase() === formData.paisabrev.toLowerCase()
    );
    
    if (paisabrevExists) {
      errors.push({
        field: 'paisabrev',
        message: 'La abreviatura ya existe',
        type: 'duplicate'
      });
    }
  }
  
  // 3. Validar relaciones padre-hijo (solo si se está inactivando)
  if (formData.statusid === 0 && originalData.statusid !== 0) {
    // Verificar si hay empresas que referencian este país
    const hasDependentRecords = await checkPaisDependencies(originalData.paisid);
    
    if (hasDependentRecords) {
      errors.push({
        field: 'statusid',
        message: 'No se puede inactivar el país porque tiene empresas asociadas',
        type: 'constraint'
      });
    }
  }
  
  // 4. Generar mensaje amigable
  const userFriendlyMessage = generateUserFriendlyMessage(errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    userFriendlyMessage
  };
};
```

#### **Función de Verificación de Dependencias:**
```typescript
const checkPaisDependencies = async (paisid: number): Promise<boolean> => {
  try {
    // Verificar en tabla empresa
    const empresas = await JoySenseService.getEmpresas();
    return empresas.some(empresa => empresa.paisid === paisid);
  } catch (error) {
    console.error('Error checking pais dependencies:', error);
    return false; // En caso de error, permitir la operación
  }
};
```

## 🔄 Flujo de Validación en Actualizar

1. **Usuario edita campos** en formulario de Actualizar
2. **Usuario hace clic en "Actualizar"**
3. **Sistema valida** usando `validatePaisUpdate`
4. **Si hay errores**: Muestra mensaje de alerta, NO actualiza
5. **Si no hay errores**: Procede con la actualización

## 📝 Notas de Implementación

- **Validación en tiempo real**: Se puede implementar validación mientras el usuario escribe
- **Validación al guardar**: Validación completa al hacer clic en "Actualizar"
- **Mensajes contextuales**: Mensajes específicos para cada tipo de error
- **Prevención de pérdida de datos**: No actualizar si hay errores de validación

## 🔧 Método de Implementación Estándar

### **Estructura de Validación por Tabla:**

1. **Función Principal de Validación:**
   ```typescript
   const validate[Tabla]Update = async (
     formData: Record<string, any>,
     originalData: Record<string, any>,
     existingData: any[]
   ): Promise<EnhancedValidationResult> => {
     const errors: ValidationError[] = [];
     
     // 1. Validar campos obligatorios
     // 2. Validar duplicados (excluyendo el registro actual)
     // 3. Validar relaciones padre-hijo (solo si se está inactivando)
     // 4. Generar mensaje amigable
     
     return {
       isValid: errors.length === 0,
       errors,
       userFriendlyMessage: generateUpdateUserFriendlyMessage(errors)
     };
   };
   ```

2. **Función de Verificación de Dependencias:**
   ```typescript
   const check[Tabla]Dependencies = async (id: number): Promise<boolean> => {
     try {
       // Verificar en tablas relacionadas usando getTableData()
       // Retornar true si hay dependencias, false si no las hay
     } catch (error) {
       console.error('Error checking dependencies:', error);
       return false; // En caso de error, permitir la operación
     }
   };
   ```

3. **Integración en validateTableUpdate:**
   ```typescript
   case '[tabla]':
     return await validate[Tabla]Update(formData, originalData, existingData || []);
   ```

### **Tablas Implementadas:**

✅ **País** - Verificar dependencias en `empresa`
✅ **Empresa** - Verificar dependencias en `fundo`
✅ **Fundo** - Verificar dependencias en `ubicacion`
✅ **Ubicación** - Verificar dependencias en `localizacion`
✅ **Entidad** - Verificar dependencias en `tipo` y `localizacion`
✅ **Tipo** - Verificar dependencias en `sensor`, `metricasensor` y `umbral`
✅ **Nodo** - Verificar dependencias en `sensor`, `metricasensor` y `localizacion`
✅ **Métrica** - Verificar dependencias en `metricasensor` y `umbral`

### **Próximas Tablas a Implementar:**

🔄 **Umbral** - Verificar dependencias en `perfilumbral`
🔄 **Perfil** - Verificar dependencias en `usuarioperfil` y `perfilumbral`
🔄 **Usuario** - Verificar dependencias en `usuarioperfil` y `contacto`
