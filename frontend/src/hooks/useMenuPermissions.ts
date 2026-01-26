import { useState, useEffect } from 'react';
import { JoySenseService } from '../services/backend-api';

interface MenuAccess {
  menuid: number;
  menu: string;
  nivel: number;
  padreid: number | null;
  tiene_acceso: boolean;
}

export const useMenuPermissions = () => {
  const [menuAccess, setMenuAccess] = useState<MenuAccess[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMenuAccess = async () => {
      try {
        const access = await JoySenseService.getUserMenuAccess();
        setMenuAccess(access || []);
      } catch (error) {
        console.error('Error loading menu access:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMenuAccess();
  }, []);

  const hasAccess = (menuName: string): boolean => {
    return menuAccess.some(item => 
      item.menu === menuName && item.tiene_acceso
    );
  };

  const hasAccessById = (menuid: number): boolean => {
    return menuAccess.some(item => 
      item.menuid === menuid && item.tiene_acceso
    );
  };

  return {
    menuAccess,
    loading,
    hasAccess,
    hasAccessById
  };
};
