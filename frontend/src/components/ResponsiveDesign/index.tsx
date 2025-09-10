import React from 'react';

// Responsive Container Component
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  direction?: 'row' | 'column';
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  breakpoint = 'md',
  direction = 'row',
  gap = 'md',
  align = 'start',
  justify = 'start',
  wrap = false
}) => {
  const baseClasses = 'w-full';
  
  const directionClasses = {
    row: 'flex-row',
    column: 'flex-col'
  };

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  const breakpointClasses = {
    sm: 'sm:flex',
    md: 'md:flex',
    lg: 'lg:flex',
    xl: 'xl:flex',
    '2xl': '2xl:flex'
  };

  const flexClasses = [
    baseClasses,
    breakpointClasses[breakpoint],
    directionClasses[direction],
    gapClasses[gap],
    alignClasses[align],
    justifyClasses[justify],
    wrap ? 'flex-wrap' : 'flex-nowrap',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={flexClasses}>
      {children}
    </div>
  );
};

// Responsive Grid Component
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className = '',
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md'
}) => {
  const baseClasses = 'grid w-full';
  
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const getGridCols = () => {
    const classes = [];
    if (cols.default) classes.push(`grid-cols-${cols.default}`);
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
    if (cols['2xl']) classes.push(`2xl:grid-cols-${cols['2xl']}`);
    return classes.join(' ');
  };

  const gridClasses = [
    baseClasses,
    getGridCols(),
    gapClasses[gap],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};

// Responsive Text Component
interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  size?: {
    default?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
    sm?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
    md?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
    lg?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
    xl?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  };
  weight?: 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'gray';
  align?: 'left' | 'center' | 'right' | 'justify';
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  className = '',
  size = { default: 'base' },
  weight = 'normal',
  color = 'primary',
  align = 'left',
  as: Component = 'p'
}) => {
  const baseClasses = 'w-full';
  
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl'
  };

  const weightClasses = {
    thin: 'font-thin',
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold',
    black: 'font-black'
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-500',
    gray: 'text-gray-500'
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify'
  };

  const getResponsiveSize = () => {
    const classes = [];
    if (size.default) classes.push(sizeClasses[size.default]);
    if (size.sm) classes.push(`sm:${sizeClasses[size.sm]}`);
    if (size.md) classes.push(`md:${sizeClasses[size.md]}`);
    if (size.lg) classes.push(`lg:${sizeClasses[size.lg]}`);
    if (size.xl) classes.push(`xl:${sizeClasses[size.xl]}`);
    return classes.join(' ');
  };

  const textClasses = [
    baseClasses,
    getResponsiveSize(),
    weightClasses[weight],
    colorClasses[color],
    alignClasses[align],
    className
  ].filter(Boolean).join(' ');

  return (
    <Component className={textClasses}>
      {children}
    </Component>
  );
};

// Responsive Image Component
interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
}

const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  sizes = '100vw',
  loading = 'lazy',
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  objectFit = 'cover',
  objectPosition = 'center'
}) => {
  const baseClasses = 'w-full h-auto';
  
  const objectFitClasses = {
    contain: 'object-contain',
    cover: 'object-cover',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down'
  };

  const imageClasses = [
    baseClasses,
    objectFitClasses[objectFit],
    className
  ].filter(Boolean).join(' ');

  const style = {
    objectPosition,
    ...(width && { width }),
    ...(height && { height })
  };

  return (
    <img
      src={src}
      alt={alt}
      className={imageClasses}
      style={style}
      loading={priority ? 'eager' : loading}
      sizes={sizes}
      {...(placeholder === 'blur' && blurDataURL && {
        placeholder: 'blur',
        blurDataURL
      })}
    />
  );
};

// Responsive Card Component
interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: {
    default?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    sm?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    md?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    lg?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  };
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  border?: boolean;
  hover?: boolean;
}

const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className = '',
  padding = { default: 'md' },
  shadow = 'md',
  rounded = 'lg',
  border = true,
  hover = false
}) => {
  const baseClasses = 'bg-white dark:bg-gray-800 w-full';
  
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  const shadowClasses = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl'
  };

  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full'
  };

  const getResponsivePadding = () => {
    const classes = [];
    if (padding.default) classes.push(paddingClasses[padding.default]);
    if (padding.sm) classes.push(`sm:${paddingClasses[padding.sm]}`);
    if (padding.md) classes.push(`md:${paddingClasses[padding.md]}`);
    if (padding.lg) classes.push(`lg:${paddingClasses[padding.lg]}`);
    return classes.join(' ');
  };

  const cardClasses = [
    baseClasses,
    getResponsivePadding(),
    shadowClasses[shadow],
    roundedClasses[rounded],
    border ? 'border border-gray-200 dark:border-gray-700' : '',
    hover ? 'hover:shadow-lg transition-shadow duration-200' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses}>
      {children}
    </div>
  );
};

// Responsive Spacer Component
interface ResponsiveSpacerProps {
  size?: {
    default?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
    sm?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
    md?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
    lg?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  };
  direction?: 'vertical' | 'horizontal';
  className?: string;
}

const ResponsiveSpacer: React.FC<ResponsiveSpacerProps> = ({
  size = { default: 'md' },
  direction = 'vertical',
  className = ''
}) => {
  const sizeClasses = {
    none: '0',
    xs: '1',
    sm: '2',
    md: '4',
    lg: '6',
    xl: '8',
    '2xl': '12',
    '3xl': '16',
    '4xl': '20'
  };

  const getResponsiveSize = () => {
    const classes = [];
    if (size.default) classes.push(direction === 'vertical' ? `py-${sizeClasses[size.default]}` : `px-${sizeClasses[size.default]}`);
    if (size.sm) classes.push(direction === 'vertical' ? `sm:py-${sizeClasses[size.sm]}` : `sm:px-${sizeClasses[size.sm]}`);
    if (size.md) classes.push(direction === 'vertical' ? `md:py-${sizeClasses[size.md]}` : `md:px-${sizeClasses[size.md]}`);
    if (size.lg) classes.push(direction === 'vertical' ? `lg:py-${sizeClasses[size.lg]}` : `lg:px-${sizeClasses[size.lg]}`);
    return classes.join(' ');
  };

  const spacerClasses = [
    getResponsiveSize(),
    className
  ].filter(Boolean).join(' ');

  return <div className={spacerClasses} />;
};

// Responsive Visibility Component
interface ResponsiveVisibilityProps {
  children: React.ReactNode;
  show?: {
    default?: boolean;
    sm?: boolean;
    md?: boolean;
    lg?: boolean;
    xl?: boolean;
    '2xl'?: boolean;
  };
  hide?: {
    default?: boolean;
    sm?: boolean;
    md?: boolean;
    lg?: boolean;
    xl?: boolean;
    '2xl'?: boolean;
  };
  className?: string;
}

const ResponsiveVisibility: React.FC<ResponsiveVisibilityProps> = ({
  children,
  show,
  hide,
  className = ''
}) => {
  const getVisibilityClasses = () => {
    const classes = [];
    
    if (show) {
      if (show.default === false) classes.push('hidden');
      if (show.sm === false) classes.push('sm:hidden');
      if (show.md === false) classes.push('md:hidden');
      if (show.lg === false) classes.push('lg:hidden');
      if (show.xl === false) classes.push('xl:hidden');
      if (show['2xl'] === false) classes.push('2xl:hidden');
    }
    
    if (hide) {
      if (hide.default === true) classes.push('hidden');
      if (hide.sm === true) classes.push('sm:hidden');
      if (hide.md === true) classes.push('md:hidden');
      if (hide.lg === true) classes.push('lg:hidden');
      if (hide.xl === true) classes.push('xl:hidden');
      if (hide['2xl'] === true) classes.push('2xl:hidden');
    }
    
    return classes.join(' ');
  };

  const visibilityClasses = [
    getVisibilityClasses(),
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={visibilityClasses}>
      {children}
    </div>
  );
};

// Export all components
export {
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveText,
  ResponsiveImage,
  ResponsiveCard,
  ResponsiveSpacer,
  ResponsiveVisibility
};

