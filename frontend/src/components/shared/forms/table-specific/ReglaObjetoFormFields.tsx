// ============================================================================
// REGLA_OBJETO FORM FIELDS
// ============================================================================
// Componente específico para renderizar formulario de asignación de objetos a reglas

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DualListbox, SelectWithPlaceholder } from '../../../selectors';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { JoySenseService } from '../../../../services/backend-api';
import { getColumnDisplayNameTranslated } from '../../../../utils/systemParametersUtils';

// ============================================================================
// CASCADING LISTBOX (Componente interno)
// ============================================================================
interface CascadingLevel {
  id: number;
  label: string;
  parentId?: number;
}

interface CascadingListboxProps {
  paises: CascadingLevel[];
  empresas: CascadingLevel[];
  fundos: CascadingLevel[];
  ubicaciones: CascadingLevel[];
  selectedPaises: number[];
  selectedEmpresas: number[];
  selectedFundos: number[];
  selectedUbicaciones: number[];
  onPaisesChange: (ids: number[]) => void;
  onEmpresasChange: (ids: number[]) => void;
  onFundosChange: (ids: number[]) => void;
  onUbicacionesChange: (ids: number[]) => void;
  disabled?: boolean;
  themeColor?: 'green' | 'orange';
}

const CascadingListbox: React.FC<CascadingListboxProps> = ({
  paises,
  empresas,
  fundos,
  ubicaciones,
  selectedPaises,
  selectedEmpresas,
  selectedFundos,
  selectedUbicaciones,
  onPaisesChange,
  onEmpresasChange,
  onFundosChange,
  onUbicacionesChange,
  disabled = false,
  themeColor = 'orange'
}) => {
  const [filterPais, setFilterPais] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('');
  const [filterFundo, setFilterFundo] = useState('');
  const [filterUbicacion, setFilterUbicacion] = useState('');

  const filteredPaises = useMemo(() => {
    if (!filterPais.trim()) return paises;
    return paises.filter(p => p.label.toLowerCase().includes(filterPais.toLowerCase()));
  }, [paises, filterPais]);

  const empresasDisponibles = useMemo(() => {
    if (selectedPaises.length === 0) return [];
    return empresas.filter(e => selectedPaises.includes(e.parentId || 0));
  }, [empresas, selectedPaises]);

  const filteredEmpresas = useMemo(() => {
    if (!filterEmpresa.trim()) return empresasDisponibles;
    return empresasDisponibles.filter(e => e.label.toLowerCase().includes(filterEmpresa.toLowerCase()));
  }, [empresasDisponibles, filterEmpresa]);

  const fundosDisponibles = useMemo(() => {
    if (selectedEmpresas.length === 0) return [];
    return fundos.filter(f => selectedEmpresas.includes(f.parentId || 0));
  }, [fundos, selectedEmpresas]);

  const filteredFundos = useMemo(() => {
    if (!filterFundo.trim()) return fundosDisponibles;
    return fundosDisponibles.filter(f => f.label.toLowerCase().includes(filterFundo.toLowerCase()));
  }, [fundosDisponibles, filterFundo]);

  const ubicacionesDisponibles = useMemo(() => {
    if (selectedFundos.length === 0) return [];
    return ubicaciones.filter(u => selectedFundos.includes(u.parentId || 0));
  }, [ubicaciones, selectedFundos]);

  const filteredUbicaciones = useMemo(() => {
    if (!filterUbicacion.trim()) return ubicacionesDisponibles;
    return ubicacionesDisponibles.filter(u => u.label.toLowerCase().includes(filterUbicacion.toLowerCase()));
  }, [ubicacionesDisponibles, filterUbicacion]);

  const togglePais = (id: number) => {
    const updated = new Set(selectedPaises);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    onPaisesChange(Array.from(updated).sort((a, b) => a - b));
    onEmpresasChange([]);
    onFundosChange([]);
    onUbicacionesChange([]);
  };

  const toggleEmpresa = (id: number) => {
    const updated = new Set(selectedEmpresas);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    onEmpresasChange(Array.from(updated).sort((a, b) => a - b));
    onFundosChange([]);
    onUbicacionesChange([]);
  };

  const toggleFundo = (id: number) => {
    const updated = new Set(selectedFundos);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    onFundosChange(Array.from(updated).sort((a, b) => a - b));
    onUbicacionesChange([]);
  };

  const toggleUbicacion = (id: number) => {
    const updated = new Set(selectedUbicaciones);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    onUbicacionesChange(Array.from(updated).sort((a, b) => a - b));
  };

  const themeClasses = {
    green: {
      accent: 'text-green-500',
      header: 'text-green-400',
      highlight: 'bg-green-600/80',
      selectedBg: 'bg-green-600/20',
      borderFocus: 'focus:ring-green-500',
      hoverBg: 'hover:bg-neutral-700'
    },
    orange: {
      accent: 'text-orange-500',
      header: 'text-orange-400',
      highlight: 'bg-orange-600/80',
      selectedBg: 'bg-orange-600/20',
      borderFocus: 'focus:ring-orange-500',
      hoverBg: 'hover:bg-neutral-700'
    }
  };

  const theme = themeClasses[themeColor];

  const ColumnLevel = ({
    title,
    items,
    selectedIds,
    onToggle,
    disabled: colDisabled,
    filter,
    onFilterChange,
    showColumn
  }: {
    title: string;
    items: CascadingLevel[];
    selectedIds: number[];
    onToggle: (id: number) => void;
    disabled: boolean;
    filter: string;
    onFilterChange: (val: string) => void;
    showColumn: boolean;
  }) => {
    if (!showColumn) return null;

    const selectedSet = new Set(selectedIds);

    return (
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className={`font-bold font-mono tracking-wider ${theme.header} text-opacity-70 flex justify-between items-center`}>
          <span>{title.toUpperCase()}</span>
          <span className={`text-sm ${theme.accent}`}>({selectedIds.length})</span>
        </div>

        <input
          type="text"
          placeholder="Buscar..."
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          className={`w-full px-2 py-1.5 bg-neutral-900 border border-neutral-600 rounded text-white text-sm font-mono placeholder-neutral-500 focus:outline-none focus:ring-1 ${theme.borderFocus}`}
          disabled={colDisabled}
        />

        <div className="border border-neutral-600 rounded-lg bg-neutral-800 text-white font-mono text-sm h-[250px] overflow-y-auto custom-scrollbar flex flex-col">
          {items.length > 0 ? (
            items.map((item) => (
              <div
                key={item.id}
                className={`px-3 py-2 cursor-pointer transition-colors flex items-center gap-2 border-b border-neutral-700 last:border-b-0 ${
                  selectedSet.has(item.id)
                    ? `${theme.highlight} ${theme.selectedBg}`
                    : theme.hoverBg
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSet.has(item.id)}
                  onChange={() => onToggle(item.id)}
                  disabled={colDisabled}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="truncate text-xs">{item.label.toUpperCase()}</span>
              </div>
            ))
          ) : (
            <div className="px-3 py-4 text-neutral-500 text-xs font-mono text-center flex items-center justify-center h-full">
              NINGUNO DISPONIBLE
            </div>
          )}
        </div>

        <div className="text-xs font-mono text-neutral-400 text-center px-2 py-1">
          Total: <span className={theme.accent}>{items.length}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex gap-3 items-stretch ${disabled ? 'opacity-60' : ''}`}>
      <ColumnLevel
        title="País"
        items={filteredPaises}
        selectedIds={selectedPaises}
        onToggle={togglePais}
        disabled={disabled}
        filter={filterPais}
        onFilterChange={setFilterPais}
        showColumn={true}
      />

      {selectedPaises.length > 0 && (
        <ColumnLevel
          title="Empresa"
          items={filteredEmpresas}
          selectedIds={selectedEmpresas}
          onToggle={toggleEmpresa}
          disabled={disabled || empresasDisponibles.length === 0}
          filter={filterEmpresa}
          onFilterChange={setFilterEmpresa}
          showColumn={true}
        />
      )}

      {selectedEmpresas.length > 0 && (
        <ColumnLevel
          title="Fundo"
          items={filteredFundos}
          selectedIds={selectedFundos}
          onToggle={toggleFundo}
          disabled={disabled || fundosDisponibles.length === 0}
          filter={filterFundo}
          onFilterChange={setFilterFundo}
          showColumn={true}
        />
      )}

      {selectedFundos.length > 0 && (
        <ColumnLevel
          title="Ubicación"
          items={filteredUbicaciones}
          selectedIds={selectedUbicaciones}
          onToggle={toggleUbicacion}
          disabled={disabled || ubicacionesDisponibles.length === 0}
          filter={filterUbicacion}
          onFilterChange={setFilterUbicacion}
          showColumn={true}
        />
      )}
    </div>
  );
};

interface ReglaObjetoFormFieldsProps {
  visibleColumns: any[];
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  updateField: (field: string, value: any) => void;
  getThemeColor: (type: 'text' | 'bg' | 'hover' | 'focus' | 'border') => string;
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  isFieldRequired: (columnName: string) => boolean;
  disabled?: boolean;
  /** 'create' = selector de regla + detalles + cascada; 'update' = solo detalles read-only + cascada */
  mode?: 'create' | 'update';
  // Datos para la cascada
  paisesData?: any[];
  empresasData?: any[];
  fundosData?: any[];
  ubicacionesData?: any[];
  nodosData?: any[];
  localizacionesData?: any[];
  fuentesData?: any[];
  reglasData?: any[];
}

export const ReglaObjetoFormFields: React.FC<ReglaObjetoFormFieldsProps> = ({
  visibleColumns,
  formData,
  setFormData,
  updateField,
  getThemeColor,
  getUniqueOptionsForField,
  isFieldRequired,
  disabled = false,
  mode = 'create',
  paisesData = [],
  empresasData = [],
  fundosData = [],
  ubicacionesData = [],
  nodosData = [],
  localizacionesData = [],
  fuentesData = [],
  reglasData = []
}) => {
  const { t } = useLanguage();

  // Estado para reglas filtradas (solo en modo create)
  const [filteredReglas, setFilteredReglas] = useState<any[]>([]);
  const [filteredReglasLoaded, setFilteredReglasLoaded] = useState(false);

  // Ref para evitar que la sincronización pise la carga inicial en modo update
  const initialLoadCompleteRef = useRef(false);

  // Cargar reglas filtradas al montar (solo en modo create, sin regla_objeto)
  useEffect(() => {
    if (mode !== 'create') return;
    const loadFilteredReglas = async () => {
      try {
        const filtered = await JoySenseService.getCustomEndpoint('/regla-filtradas/sin_objeto');
        setFilteredReglas(Array.isArray(filtered) ? filtered : []);
        setFilteredReglasLoaded(true);
      } catch (error) {
        console.error('[ReglaObjetoFormFields] Error cargando reglas filtradas:', error);
        setFilteredReglas([]);
        setFilteredReglasLoaded(false);
      }
    };
    loadFilteredReglas();
  }, [mode]);

  // Estados locales para la cascada: arrays de IDs seleccionados en cada nivel
  const [selectedPaises, setSelectedPaises] = useState<number[]>([]);
  const [selectedEmpresas, setSelectedEmpresas] = useState<number[]>([]);
  const [selectedFundos, setSelectedFundos] = useState<number[]>([]);
  const [selectedUbicaciones, setSelectedUbicaciones] = useState<number[]>([]);

  // Limpiar selecciones cuando se resetea el formulario o cuando _objetosSeleccionados es vacío
  useEffect(() => {
    console.log('[CLEANUP EFFECT] reglaid=', formData.reglaid, '_objetosSeleccionados=', formData._objetosSeleccionados, 'initialLoadComplete=', initialLoadCompleteRef.current);
    
    if (!formData.reglaid || formData.reglaid === null || formData.reglaid === undefined) {
      setSelectedPaises([]);
      setSelectedEmpresas([]);
      setSelectedFundos([]);
      setSelectedUbicaciones([]);
      setActiveLevel('pais');
      if (mode === 'update') initialLoadCompleteRef.current = false;
    } else if (mode === 'update' && (!formData._objetosSeleccionados || formData._objetosSeleccionados.length === 0)) {
      // Si es update pero no hay objetos seleccionados, limpiar la cascada
      // PERO: no hacer esto si el init effect acaba de terminar (initialLoadCompleteRef es true)
      if (!initialLoadCompleteRef.current) {
        setSelectedPaises([]);
        setSelectedEmpresas([]);
        setSelectedFundos([]);
        setSelectedUbicaciones([]);
        setActiveLevel('pais');
      }
    }
  }, [formData.reglaid, formData._objetosSeleccionados, mode]);

  // Refs para evitar bucles infinitos en la sincronización con el padre
  const lastSyncRef = useRef<{
    objetos: string;
    fuenteid: number | null;
    activeLevel: string;
  }>({ objetos: '[]', fuenteid: null, activeLevel: 'pais' });

  // Nivel activo de la cascada (cuál es el nivel que estamos usando para el multi-select)
  const [activeLevel, setActiveLevel] = useState<string>('pais');

  // Inicializar campos de cascada cuando se cargan objetos existentes (para UPDATE)
  // Resolver cadena de padres para empresa/fundo/ubicación para que las columnas muestren opciones
  useEffect(() => {
    if (mode !== 'update') return;
    if (!formData._objetosSeleccionados || !Array.isArray(formData._objetosSeleccionados) || formData._objetosSeleccionados.length === 0) {
      initialLoadCompleteRef.current = false;
      return;
    }

    initialLoadCompleteRef.current = false; // Bloquear sync hasta terminar carga
    const fuente = fuentesData?.find(f => f.fuenteid === formData.fuenteid);
    const nivel = fuente?.fuente?.toLowerCase() || 'pais';
    const objetoid = formData._objetosSeleccionados[0];

    console.log('[INIT EFFECT] START:', {
      nivel,
      objetoid,
      fuenteid: formData.fuenteid,
      paisesData_len: paisesData?.length,
      empresasData_len: empresasData?.length,
      fundosData_len: fundosData?.length,
      ubicacionesData_len: ubicacionesData?.length
    });

    // Validar que tenemos los datos geográficos necesarios antes de intentar resolver
    const datosFaltantes = 
      !paisesData || paisesData.length === 0 ||
      (nivel !== 'pais' && (!empresasData || empresasData.length === 0)) ||
      (nivel === 'fundo' && (!fundosData || fundosData.length === 0)) ||
      (nivel === 'ubicacion' && (!ubicacionesData || ubicacionesData.length === 0));
    
    if (datosFaltantes) {
      console.log('[INIT EFFECT] DATOS FALTANTES - retornando', { datosFaltantes });
      initialLoadCompleteRef.current = true;
      return;
    }

    console.log('[INIT EFFECT] DATOS OK - procesando nivel', nivel);

    switch (nivel) {
      case 'pais':
        console.log('[INIT EFFECT] PAIS:', formData._objetosSeleccionados);
        setSelectedPaises(formData._objetosSeleccionados);
        setSelectedEmpresas([]);
        setSelectedFundos([]);
        setSelectedUbicaciones([]);
        setActiveLevel('pais');
        break;
      case 'empresa': {
        const empresa = empresasData?.find(e => e.empresaid === objetoid);
        const paisid = empresa?.paisid;
        console.log('[INIT EFFECT] EMPRESA:', { objetoid, empresa_encontrada: !!empresa, paisid });
        setSelectedPaises(paisid != null ? [paisid] : []);
        setSelectedEmpresas(formData._objetosSeleccionados);
        setSelectedFundos([]);
        setSelectedUbicaciones([]);
        setActiveLevel('empresa');
        break;
      }
      case 'fundo': {
        const fundo = fundosData?.find(f => f.fundoid === objetoid);
        const empresaid = fundo?.empresaid;
        const empresa = empresaid != null ? empresasData?.find(e => e.empresaid === empresaid) : null;
        const paisid = empresa?.paisid;
        console.log('[INIT EFFECT] FUNDO:', { objetoid, fundo_encontrado: !!fundo, empresaid, empresa_encontrada: !!empresa, paisid });
        setSelectedPaises(paisid != null ? [paisid] : []);
        setSelectedEmpresas(empresaid != null ? [empresaid] : []);
        setSelectedFundos(formData._objetosSeleccionados);
        setSelectedUbicaciones([]);
        setActiveLevel('fundo');
        break;
      }
      case 'ubicacion': {
        const ubicacion = ubicacionesData?.find(u => u.ubicacionid === objetoid);
        const fundoid = ubicacion?.fundoid;
        const fundo = fundoid != null ? fundosData?.find(f => f.fundoid === fundoid) : null;
        const empresaid = fundo?.empresaid;
        const empresa = empresaid != null ? empresasData?.find(e => e.empresaid === empresaid) : null;
        const paisid = empresa?.paisid;
        console.log('[INIT EFFECT] UBICACION:', { objetoid, ubicacion_encontrada: !!ubicacion, fundoid, fundo_encontrado: !!fundo, empresaid, empresa_encontrada: !!empresa, paisid });
        setSelectedPaises(paisid != null ? [paisid] : []);
        setSelectedEmpresas(empresaid != null ? [empresaid] : []);
        setSelectedFundos(fundoid != null ? [fundoid] : []);
        setSelectedUbicaciones(formData._objetosSeleccionados);
        setActiveLevel('ubicacion');
        break;
      }
      default:
        console.log('[INIT EFFECT] NIVEL NO RECONOCIDO:', nivel);
        break;
    }
    console.log('[INIT EFFECT] COMPLETADO - initialLoadCompleteRef = true');
    initialLoadCompleteRef.current = true;
  }, [mode, formData._objetosSeleccionados, formData.regla_objetoid, formData.fuenteid, fuentesData, empresasData, fundosData, ubicacionesData]);

  // Obtener la regla seleccionada y sus detalles
  const selectedRegla = useMemo(() => {
    if (!formData.reglaid) return null;
    return reglasData.find(r => r.reglaid === formData.reglaid);
  }, [formData.reglaid, reglasData]);

  // Determinar qué objetos están actualmente seleccionados (según el nivel activo)
  const getCurrentSelectedObjects = (): number[] => {
    switch(activeLevel) {
      case 'pais':
        return selectedPaises;
      case 'empresa':
        return selectedEmpresas;
      case 'fundo':
        return selectedFundos;
      case 'ubicacion':
        return selectedUbicaciones;
      default:
        return [];
    }
  };

  // Sincronizar con formData._objetosSeleccionados, fuenteid y origenid
  // En modo update, no sincronizar hasta que la carga inicial esté completa para no pisar valores
  useEffect(() => {
    if (mode === 'update' && !initialLoadCompleteRef.current) {
      console.log('[SYNC EFFECT] BLOQUEADO - initialLoadCompleteRef.current es false');
      return;
    }

    const currentSelectedObjects = getCurrentSelectedObjects();
    const objetosStr = JSON.stringify(currentSelectedObjects);
    const fuente = fuentesData?.find(f => f.fuente?.toLowerCase() === activeLevel.toLowerCase());
    const fuenteid = fuente?.fuenteid || null;

    console.log('[SYNC EFFECT]:', {
      mode,
      initialLoadCompleteRef: initialLoadCompleteRef.current,
      activeLevel,
      currentSelectedObjects,
      fuenteid,
      lastSync: lastSyncRef.current
    });

    // Solo actualizar si algo relevante cambió
    if (
      objetosStr !== lastSyncRef.current.objetos ||
      fuenteid !== lastSyncRef.current.fuenteid ||
      activeLevel !== lastSyncRef.current.activeLevel
    ) {
      console.log('[SYNC EFFECT] ACTUALIZANDO formData');
      // Actualizar objetos seleccionados
      updateField('_objetosSeleccionados', currentSelectedObjects);

      // Actualizar fuenteid
      if (fuenteid) {
        updateField('fuenteid', fuenteid);
      }

      // origenid siempre es 1 (Geografía)
      updateField('origenid', 1);

      // Guardar último estado sincronizado
      lastSyncRef.current = {
        objetos: objetosStr,
        fuenteid,
        activeLevel
      };
    }
  }, [mode, selectedPaises, selectedEmpresas, selectedFundos, selectedUbicaciones, activeLevel, fuentesData, updateField]);

  // Manejadores de cambio para los niveles de la cascada
  const handlePaisChange = (values: number[]) => {
    setSelectedPaises(values);
    // Limpiar selecciones posteriores automáticamente
    setSelectedEmpresas([]);
    setSelectedFundos([]);
    setSelectedUbicaciones([]);
    setActiveLevel(values.length > 0 ? 'empresa' : 'pais');
  };

  const handleEmpresaChange = (values: number[]) => {
    setSelectedEmpresas(values);
    // Limpiar selecciones posteriores automáticamente
    setSelectedFundos([]);
    setSelectedUbicaciones([]);
    setActiveLevel(values.length > 0 ? 'fundo' : 'empresa');
  };

  const handleFundoChange = (values: number[]) => {
    setSelectedFundos(values);
    // Limpiar selecciones posteriores automáticamente
    setSelectedUbicaciones([]);
    setActiveLevel(values.length > 0 ? 'ubicacion' : 'fundo');
  };

  const handleUbicacionChange = (values: number[]) => {
    setSelectedUbicaciones(values);
    setActiveLevel('ubicacion');
  };

  // Renderizar detalles de la regla
  const renderReglaDetails = () => {
    if (!selectedRegla) return (
      <div className="bg-neutral-800/50 border border-dashed border-neutral-600 rounded-lg p-6 flex items-center justify-center text-neutral-500 font-mono italic">
        SELECCIONE UNA REGLA PARA VER SUS DETALLES
      </div>
    );

    return (
      <div className="bg-neutral-800 border border-orange-500/30 rounded-lg p-4 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1">
            <span className="text-xs font-mono text-orange-500 uppercase tracking-tighter">Nombre</span>
            <p className="text-white font-mono font-bold truncate">{selectedRegla.nombre}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-mono text-orange-500 uppercase tracking-tighter">Prioridad</span>
            <p className="text-white font-mono font-bold">{selectedRegla.prioridad}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-mono text-orange-500 uppercase tracking-tighter">Ventana</span>
            <p className="text-white font-mono font-bold">{selectedRegla.ventana}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-mono text-orange-500 uppercase tracking-tighter">Cooldown</span>
            <p className="text-white font-mono font-bold">{selectedRegla.cooldown}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-mono text-orange-500 uppercase tracking-tighter">Criticidad</span>
            <p className="text-white font-mono font-bold">
              {getUniqueOptionsForField('criticidadid').find(o => o.value === selectedRegla.criticidadid)?.label || selectedRegla.criticidadid}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* REGLA: selector (create) o solo detalles read-only (update) */}
      <div className="bg-neutral-800/30 rounded-lg p-4 border border-neutral-700/50">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mode === 'create' && (
              <div className="md:col-span-1">
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  REGLA*
                </label>
                <SelectWithPlaceholder
                  value={formData.reglaid || ''}
                  onChange={(val) => updateField('reglaid', val ? Number(val) : null)}
                  options={(filteredReglasLoaded ? filteredReglas : reglasData || []).map(r => ({ value: r.reglaid, label: r.nombre }))}
                  placeholder="SELECCIONAR REGLA"
                  themeColor="orange"
                  disabled={disabled}
                />
              </div>
            )}
            <div className={mode === 'create' ? 'md:col-span-2' : 'md:col-span-3'}>
              <label className="block text-lg font-bold mb-2 font-mono tracking-wider text-neutral-400">
                DETALLES DE LA REGLA
              </label>
              {renderReglaDetails()}
            </div>
          </div>
        </div>
      </div>

      {/* SELECCIÓN DE OBJETOS (CASCADA CUÁDRUPLE) */}
      <div className="bg-neutral-800/30 rounded-lg p-4 border border-neutral-700/50">
        <label className={`block text-lg font-bold mb-4 font-mono tracking-wider ${getThemeColor('text')}`}>
          SELECCIONAR OBJETOS *
        </label>
        <div className="space-y-6">
          {/* Cascading Listbox */}
          <CascadingListbox
            paises={paisesData.map(p => ({ id: p.paisid, label: p.pais }))}
            empresas={empresasData.map(e => ({ id: e.empresaid, label: e.empresa, parentId: e.paisid }))}
            fundos={fundosData.map(f => ({ id: f.fundoid, label: f.fundo, parentId: f.empresaid }))}
            ubicaciones={ubicacionesData.map(u => ({ id: u.ubicacionid, label: u.ubicacion, parentId: u.fundoid }))}
            selectedPaises={selectedPaises}
            selectedEmpresas={selectedEmpresas}
            selectedFundos={selectedFundos}
            selectedUbicaciones={selectedUbicaciones}
            onPaisesChange={handlePaisChange}
            onEmpresasChange={handleEmpresaChange}
            onFundosChange={handleFundoChange}
            onUbicacionesChange={handleUbicacionChange}
            disabled={disabled || !formData.reglaid}
            themeColor="orange"
          />

          {/* Resumen de selección en cascada */}
          {formData.reglaid && (
            <div className="mt-6 p-4 bg-neutral-900/50 rounded border border-neutral-700 font-mono text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400 uppercase">Selección Actual:</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <span className="text-neutral-500 text-[10px]">PAÍSES</span>
                  <span className="text-orange-500 font-bold block">{selectedPaises.length}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-neutral-500 text-[10px]">EMPRESAS</span>
                  <span className={`font-bold block ${selectedPaises.length === 0 ? 'text-neutral-600' : 'text-orange-500'}`}>
                    {selectedEmpresas.length}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-neutral-500 text-[10px]">FUNDOS</span>
                  <span className={`font-bold block ${selectedEmpresas.length === 0 ? 'text-neutral-600' : 'text-orange-500'}`}>
                    {selectedFundos.length}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-neutral-500 text-[10px]">UBICACIONES</span>
                  <span className={`font-bold block ${selectedFundos.length === 0 ? 'text-neutral-600' : 'text-orange-500'}`}>
                    {selectedUbicaciones.length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
