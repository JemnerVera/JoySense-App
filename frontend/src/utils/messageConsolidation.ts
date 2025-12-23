/**
 * Utilidad para consolidar mensajes de error similares
 * Agrupa mensajes del mismo tipo para hacerlos más legibles
 */

/**
 * Consolida mensajes de error similares
 * Ejemplo: 
 * ["El nombre de la empresa es obligatorio", "La abreviatura es obligatoria", "Debe seleccionar un país"]
 * -> ["El nombre de la empresa y abreviatura son obligatorios", "Debe seleccionar un país"]
 */
export function consolidateErrorMessages(messages: string[]): string[] {
  if (messages.length === 0) return [];

  const consolidated: string[] = [];
  const obligatorioGroup: Array<{ original: string; field: string }> = [];
  const requeridoGroup: Array<{ original: string; field: string }> = [];
  const otros: string[] = [];

  // Separar mensajes por tipo
  messages.forEach(msg => {
    const trimmedMsg = msg.trim();
    
    // Mensajes que terminan con "es obligatorio" o "es obligatoria"
    if (trimmedMsg.match(/es obligatori[oa]$/i)) {
      // Extraer el nombre del campo (todo antes de "es obligatorio/a")
      // Ejemplo: "El nombre de la empresa es obligatorio" -> "El nombre de la empresa"
      // Ejemplo: "La abreviatura es obligatoria" -> "La abreviatura"
      const fieldName = trimmedMsg.replace(/\s*es obligatori[oa]$/i, '').trim();
      obligatorioGroup.push({ original: trimmedMsg, field: fieldName });
    }
    // Mensajes que terminan con "es requerido" o "es requerida"
    else if (trimmedMsg.match(/es requerid[oa]$/i)) {
      // Extraer el nombre del campo
      const fieldName = trimmedMsg.replace(/\s*es requerid[oa]$/i, '').trim();
      requeridoGroup.push({ original: trimmedMsg, field: fieldName });
    }
    // Otros mensajes (como "Debe seleccionar un país")
    else {
      otros.push(trimmedMsg);
    }
  });

  // Consolidar mensajes de "obligatorio"
  if (obligatorioGroup.length > 0) {
    if (obligatorioGroup.length === 1) {
      // Un solo campo - mantener el mensaje original
      consolidated.push(obligatorioGroup[0].original);
    } else if (obligatorioGroup.length === 2) {
      // Dos campos: mantener el primero completo, simplificar el segundo
      const [first, second] = obligatorioGroup;
      
      // Simplificar el segundo campo: quitar artículos iniciales y "nombre de la"
      // Ejemplo: "La abreviatura" -> "abreviatura"
      // Ejemplo: "El nombre de la empresa" -> "empresa"
      let secondField = second.field
        .replace(/^(el|la|los|las)\s+/i, '')
        .replace(/^nombre\s+de\s+la?\s+/i, '')
        .trim();
      
      // Si el segundo campo simplificado es muy corto o igual al original, usar el original
      if (secondField.length < 3 || secondField === second.field) {
        secondField = second.field;
      }
      
      // Formato: "El nombre de la empresa y abreviatura son obligatorios"
      consolidated.push(`${first.field} y ${secondField} son obligatorios`);
    } else {
      // Múltiples campos: "X, Y y Z son obligatorios"
      const fields = obligatorioGroup.map(item => item.field);
      const last = fields[fields.length - 1];
      const rest = fields.slice(0, -1);
      consolidated.push(`${rest.join(', ')} y ${last} son obligatorios`);
    }
  }

  // Consolidar mensajes de "requerido"
  if (requeridoGroup.length > 0) {
    if (requeridoGroup.length === 1) {
      // Un solo campo - mantener el mensaje original
      consolidated.push(requeridoGroup[0].original);
    } else if (requeridoGroup.length === 2) {
      // Dos campos: mantener el primero completo, simplificar el segundo
      const [first, second] = requeridoGroup;
      
      // Simplificar el segundo campo: quitar artículos iniciales y "nombre de la"
      // Ejemplo: "La abreviatura" -> "abreviatura"
      // Ejemplo: "El nombre de la empresa" -> "empresa"
      let secondField = second.field
        .replace(/^(el|la|los|las)\s+/i, '')
        .replace(/^nombre\s+de\s+la?\s+/i, '')
        .trim();
      
      // Si el segundo campo simplificado es muy corto o igual al original, usar el original
      if (secondField.length < 3 || secondField === second.field) {
        secondField = second.field;
      }
      
      // Formato: "El nombre de la empresa y abreviatura son requeridos"
      consolidated.push(`${first.field} y ${secondField} son requeridos`);
    } else {
      // Múltiples campos: "X, Y y Z son requeridos"
      const fields = requeridoGroup.map(item => item.field);
      const last = fields[fields.length - 1];
      const rest = fields.slice(0, -1);
      consolidated.push(`${rest.join(', ')} y ${last} son requeridos`);
    }
  }

  // Agregar otros mensajes sin modificar
  consolidated.push(...otros);

  return consolidated;
}

/**
 * Consolida un string de mensajes separados por \n
 */
export function consolidateErrorMessagesString(messagesString: string): string {
  if (!messagesString) return '';
  
  const messages = messagesString.split('\n').filter(msg => msg.trim());
  const consolidated = consolidateErrorMessages(messages);
  return consolidated.join('\n');
}

