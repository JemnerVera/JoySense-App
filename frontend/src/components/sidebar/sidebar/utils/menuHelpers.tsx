import React from 'react';
import type { SubMenuLevel3, SubMenuLevel4 } from '../../types';
import type { TableConfig } from '../../../../config/tables.config';
import {
  IconStatus,
  IconInsert,
  IconUpdate,
  IconMassive,
  IconAsignar,
  IconTable,
  IconTipo,
  IconMetrica,
  IconSensor,
  IconMetricaSensor,
  IconPais,
  IconEmpresa,
  IconFundo,
  IconUsuario,
  IconCriticidad,
  IconUmbral,
  IconRegla,
  IconEntidad,
  IconEntidadLocalizacion,
} from './menuIcons';

type TFunction = (key: string) => string;

export function createOperations(tableName: string, t: TFunction): SubMenuLevel4[] {
  const operations: SubMenuLevel4[] = [
    { id: 'status', label: t('parameters.operations.status'), icon: <IconStatus /> },
    { id: 'insert', label: t('parameters.operations.create'), icon: <IconInsert /> },
    { id: 'update', label: t('parameters.operations.update'), icon: <IconUpdate /> },
    { id: 'massive', label: t('parameters.operations.massive'), icon: <IconMassive /> },
  ];

  if (tableName.startsWith('permisos-')) {
    operations.push({ id: 'asignar', label: 'ASIGNAR', icon: <IconAsignar /> });
  }

  return operations;
}

export function getTableIcon(tableName: string): React.ReactNode {
  const iconMap: Record<string, React.ReactNode> = {
    tipo: <IconTipo />,
    metrica: <IconMetrica />,
    sensor: <IconSensor />,
    metricasensor: <IconMetricaSensor />,
    pais: <IconPais />,
    empresa: <IconEmpresa />,
    fundo: <IconFundo />,
    usuario: <IconUsuario />,
    criticidad: <IconCriticidad />,
    umbral: <IconUmbral />,
    regla: <IconRegla />,
    entidad: <IconEntidad />,
    entidad_localizacion: <IconEntidadLocalizacion />,
  };
  return iconMap[tableName] ?? <IconTable />;
}

export function createTablesLevel3(
  tables: TableConfig[],
  parentId: string,
  createOps: (name: string) => SubMenuLevel4[],
  getIcon: (name: string) => React.ReactNode
): SubMenuLevel3[] {
  return tables.map((table) => ({
    id: table.name,
    label: table.displayName.toUpperCase(),
    icon: getIcon(table.name),
    hasOperations: true,
    subMenus: createOps(`${parentId}-${table.name}`),
  }));
}
