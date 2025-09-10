// Configuration for application styles and themes
export const STYLES_CONFIG = {
  // Color scheme
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
  },
  
  // Spacing
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  
  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  // Component styles
  components: {
    button: {
      base: 'inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200',
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
      warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
      error: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    },
    input: {
      base: 'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
      error: 'border-red-300 focus:ring-red-500 focus:border-red-500',
    },
    card: {
      base: 'bg-white overflow-hidden shadow rounded-lg',
      header: 'px-4 py-5 sm:px-6 bg-gray-50',
      body: 'px-4 py-5 sm:p-6',
      footer: 'px-4 py-4 sm:px-6 bg-gray-50',
    },
    table: {
      base: 'min-w-full divide-y divide-gray-200',
      header: 'bg-gray-50',
      headerCell: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
      body: 'bg-white divide-y divide-gray-200',
      bodyCell: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
    },
  },
  
  // Layout
  layout: {
    sidebar: {
      width: '16rem',
      collapsedWidth: '4rem',
    },
    header: {
      height: '4rem',
    },
    content: {
      maxWidth: '7xl',
      padding: '1.5rem',
    },
  },
  
  // Breakpoints (matching Tailwind CSS)
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Z-index layers
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },
};

// Utility functions for style generation
export const getButtonStyles = (variant: keyof typeof STYLES_CONFIG.components.button = 'primary') => {
  const base = STYLES_CONFIG.components.button.base;
  const variantStyles = STYLES_CONFIG.components.button[variant];
  return `${base} ${variantStyles}`;
};

export const getInputStyles = (hasError = false) => {
  const base = STYLES_CONFIG.components.input.base;
  const errorStyles = hasError ? STYLES_CONFIG.components.input.error : '';
  return `${base} ${errorStyles}`;
};

export const getCardStyles = (section: 'base' | 'header' | 'body' | 'footer' = 'base') => {
  return STYLES_CONFIG.components.card[section];
};

export const getTableStyles = (element: 'base' | 'header' | 'headerCell' | 'body' | 'bodyCell') => {
  return STYLES_CONFIG.components.table[element];
};

// Theme utilities
export const getThemeColor = (color: string, shade: number = 500) => {
  const colorPath = color.split('.');
  let colorObj: any = STYLES_CONFIG.colors;
  
  for (const path of colorPath) {
    colorObj = colorObj[path];
    if (!colorObj) return '';
  }
  
  return colorObj[shade] || '';
};

// Responsive utilities
export const getResponsiveValue = (values: { [key: string]: string }) => {
  return Object.entries(values)
    .map(([breakpoint, value]) => {
      if (breakpoint === 'default') return value;
      return `${breakpoint}:${value}`;
    })
    .join(' ');
};

export default STYLES_CONFIG;
