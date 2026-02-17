import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { JoySenseService } from '../../../services/backend-api';
import { SelectWithPlaceholder } from '../../../components/selectors';
import { ReglaPerfilFormFields } from '../../../components/shared/forms/table-specific/ReglaPerfilFormFields';

interface ReglaPerfilUpdateTabProps {
  reglasData?: any[];
  perfilesData?: any[];
  relatedData?: any;
  onUpdateSuccess?: () => void;
}

export function ReglaPerfilUpdateTab({
  reglasData = [],
  perfilesData = [],
  relatedData = {},
  onUpdateSuccess
}: ReglaPerfilUpdateTabProps) {
  const { t } = useLanguage();
  const [selectedReglaid, setSelectedReglaid] = useState<number | null>(null);
  const [reglaPerfiles, setReglaPerfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Opciones de reglas activas
  const reglaOptions = React.useMemo(() => {
    return reglasData
      .filter(r => r.statusid === 1)
      .map(regla => ({
        value: regla.reglaid,
        label: regla.nombre || `Regla ${regla.reglaid}`
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [reglasData]);

  // Cargar perfiles cuando se selecciona una regla
  useEffect(() => {
    if (selectedReglaid) {
      loadReglaPerfiles(selectedReglaid);
    } else {
      setReglaPerfiles([]);
      setFormData({ reglaid: null });
    }
  }, [selectedReglaid]);

  const loadReglaPerfiles = async (reglaid: number) => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await JoySenseService.getTableData('regla_perfil', 1000);
      const perfiles = (data || []).filter((rp: any) => rp.reglaid === reglaid);
      setReglaPerfiles(perfiles);
      
      // Inicializar formData
      setFormData({
        reglaid: reglaid,
        _perfilesSeleccionados: perfiles.filter(p => p.statusid === 1).map(p => p.perfilid),
        _perfilesStatus: Object.fromEntries(
          perfiles.map(p => [p.perfilid, p.statusid])
        )
      });
    } catch (error) {
      console.error('Error cargando perfiles:', error);
      setMessage({ type: 'error', text: 'Error al cargar los perfiles' });
      setReglaPerfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = useCallback(async () => {
    if (!selectedReglaid) {
      setMessage({ type: 'error', text: 'Selecciona una regla' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const errors: string[] = [];
      
      // Obtener lista de perfiles seleccionados (soportar ambos formatos)
      let perfilesSeleccionados: number[] = [];
      
      if (Array.isArray(formData._perfilesSeleccionados)) {
        // Nuevo formato: array de IDs del DualListbox
        perfilesSeleccionados = formData._perfilesSeleccionados;
      } else if (formData._perfilesStatus) {
        // Formato antiguo: objeto con statusid
        const perfilesStatus = formData._perfilesStatus as Record<number, number>;
        perfilesSeleccionados = Object.entries(perfilesStatus)
          .filter(([_, statusid]) => statusid === 1)
          .map(([perfilid, _]) => parseInt(perfilid));
      }

      // Obtener lista de perfiles que están actualmente en la regla
      const perfilesActuales = reglaPerfiles
        .filter(rp => rp.statusid === 1)
        .map(rp => rp.perfilid);

      // Perfiles a eliminar (estaban activos pero ya no están seleccionados)
      const perfilesAEliminar = reglaPerfiles
        .filter(rp => rp.statusid === 1 && !perfilesSeleccionados.includes(rp.perfilid));

      // Perfiles a agregar (nuevos seleccionados que no están en la regla)
      const perfilesAAgregar = perfilesSeleccionados
        .filter(perfilid => !perfilesActuales.includes(perfilid));

      // Eliminar perfiles
      for (const perfil of perfilesAEliminar) {
        const result = await JoySenseService.deleteTableRow('regla_perfil', perfil.regla_perfilid.toString());
        if (result?.error) {
          errors.push(`Error eliminando Perfil ${perfil.perfilid}: ${result.error}`);
        }
      }

      // Agregar nuevos perfiles
      for (const perfilid of perfilesAAgregar) {
        const result = await JoySenseService.insertTableRow('regla_perfil', {
          reglaid: selectedReglaid,
          perfilid: perfilid,
          statusid: 1,
          usercreatedid: 1, // TODO: usar user actual
          datecreated: new Date().toISOString()
        });
        if (result?.error) {
          errors.push(`Error creando Perfil ${perfilid}: ${result.error}`);
        }
      }

      if (errors.length > 0) {
        setMessage({ type: 'error', text: errors.join('\n') });
      } else {
        setMessage({ type: 'success', text: 'Perfiles actualizados correctamente' });
        // Recargar datos
        await loadReglaPerfiles(selectedReglaid);
        onUpdateSuccess?.();
      }
    } catch (error) {
      console.error('Error actualizando perfiles:', error);
      setMessage({ type: 'error', text: 'Error al actualizar los perfiles' });
    } finally {
      setSaving(false);
    }
  }, [selectedReglaid, formData, reglaPerfiles, onUpdateSuccess]);

  const handleCancel = useCallback(() => {
    setSelectedReglaid(null);
    setFormData({});
    setMessage(null);
  }, []);

  const visibleColumns = useMemo(() => [
    { columnName: 'reglaid', required: true },
    { columnName: 'perfilid', required: true },
    { columnName: 'statusid', required: false }
  ], []);

  const getThemeColor = (type: 'text' | 'bg' | 'hover' | 'focus' | 'border') => {
    const colors = {
      text: 'text-orange-500',
      bg: 'bg-orange-500',
      hover: 'hover:bg-orange-600',
      focus: 'focus:ring-orange-500',
      border: 'border-orange-500'
    };
    return colors[type];
  };

  const renderField = (col: any) => {
    // No renderizar campos especiales aquí
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Mensaje de estado */}
      {message && (
        <div className={`p-4 rounded-lg font-mono text-sm ${
          message.type === 'success'
            ? 'bg-green-500/20 border border-green-500 text-green-400'
            : 'bg-red-500/20 border border-red-500 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Selector de REGLA */}
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
        <label className="block text-lg font-bold mb-2 font-mono tracking-wider text-orange-500">
          SELECCIONAR REGLA
        </label>
        <SelectWithPlaceholder
          value={selectedReglaid || null}
          onChange={(value) => setSelectedReglaid(value ? Number(value) : null)}
          options={reglaOptions}
          placeholder="SELECCIONAR REGLA"
          themeColor="orange"
        />
      </div>

      {/* Formulario de actualización (solo si hay regla seleccionada) */}
      {selectedReglaid && (
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
          <h3 className="text-lg font-bold font-mono tracking-wider text-orange-500 mb-4">
            ACTUALIZAR PERFILES DE LA REGLA
          </h3>

          {loading ? (
            <div className="text-center py-8 text-gray-400 font-mono">
              Cargando perfiles...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Formulario con ReglaPerfilFormFields */}
              <ReglaPerfilFormFields
                visibleColumns={visibleColumns}
                formData={formData}
                setFormData={setFormData}
                renderField={renderField}
                getThemeColor={getThemeColor}
                getUniqueOptionsForField={() => reglaOptions}
                reglasData={reglasData}
                perfilesData={perfilesData}
                existingPerfiles={reglaPerfiles}
                isUpdateMode={true}
              />

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center pt-4">
                <button
                  onClick={handleUpdate}
                  disabled={saving || loading}
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-mono tracking-wider"
                >
                  {saving ? 'Guardando...' : '💾 Guardar Cambios'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving || loading}
                  className="px-6 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors font-mono tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🗑️ Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mensaje cuando no hay regla seleccionada */}
      {!selectedReglaid && (
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 text-center">
          <p className="text-gray-400 font-mono text-sm">
            Selecciona una regla para actualizar sus perfiles
          </p>
        </div>
      )}
    </div>
  );
}
