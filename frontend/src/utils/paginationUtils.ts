/**
 * Utilidades para paginación de tablas agrupadas
 */

/**
 * Calcula el total de páginas para una tabla agrupada
 */
export function getTotalPagesForGroupedTable(
  groupedData: { [key: string]: any[] },
  itemsPerPage: number
): number {
  const totalGroups = Object.keys(groupedData).length;
  return Math.ceil(totalGroups / itemsPerPage);
}

/**
 * Obtiene los datos paginados para una tabla agrupada
 */
export function getPaginatedGroupedData(
  groupedData: { [key: string]: any[] },
  currentPage: number,
  itemsPerPage: number
): { [key: string]: any[] } {
  const groupKeys = Object.keys(groupedData);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedKeys = groupKeys.slice(startIndex, endIndex);
  
  const paginatedData: { [key: string]: any[] } = {};
  paginatedKeys.forEach(key => {
    paginatedData[key] = groupedData[key];
  });
  
  return paginatedData;
}

/**
 * Navega a la siguiente página de una tabla agrupada
 */
export function goToNextPage(
  currentPage: number,
  totalPages: number,
  setCurrentPage: (page: number) => void
): void {
  if (currentPage < totalPages) {
    setCurrentPage(currentPage + 1);
  }
}

/**
 * Navega a la página anterior de una tabla agrupada
 */
export function goToPrevPage(
  currentPage: number,
  setCurrentPage: (page: number) => void
): void {
  if (currentPage > 1) {
    setCurrentPage(currentPage - 1);
  }
}

/**
 * Navega a la primera página de una tabla agrupada
 */
export function goToFirstPage(setCurrentPage: (page: number) => void): void {
  setCurrentPage(1);
}

/**
 * Navega a la última página de una tabla agrupada
 */
export function goToLastPage(
  totalPages: number,
  setCurrentPage: (page: number) => void
): void {
  setCurrentPage(totalPages);
}
