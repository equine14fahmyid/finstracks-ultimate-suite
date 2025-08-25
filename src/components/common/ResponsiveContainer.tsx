
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  mobileClassName?: string;
  desktopClassName?: string;
}

export const ResponsiveContainer = ({ 
  children, 
  className, 
  mobileClassName, 
  desktopClassName 
}: ResponsiveContainerProps) => {
  const isMobile = useIsMobile();

  return (
    <div 
      className={cn(
        className,
        isMobile ? mobileClassName : desktopClassName
      )}
    >
      {children}
    </div>
  );
};

interface ResponsiveGridProps {
  children: ReactNode;
  cols?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap?: number;
  className?: string;
}

export const ResponsiveGrid = ({ 
  children, 
  cols = { mobile: 1, tablet: 2, desktop: 3 }, 
  gap = 4,
  className 
}: ResponsiveGridProps) => {
  const gridClasses = cn(
    'grid',
    `grid-cols-${cols.mobile}`,
    `md:grid-cols-${cols.tablet}`,
    `lg:grid-cols-${cols.desktop}`,
    `gap-${gap}`,
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};

interface ResponsiveStackProps {
  children: ReactNode;
  direction?: {
    mobile: 'row' | 'col';
    desktop: 'row' | 'col';
  };
  spacing?: number;
  className?: string;
}

export const ResponsiveStack = ({ 
  children, 
  direction = { mobile: 'col', desktop: 'row' }, 
  spacing = 4,
  className 
}: ResponsiveStackProps) => {
  const stackClasses = cn(
    'flex',
    direction.mobile === 'col' ? 'flex-col' : 'flex-row',
    direction.desktop === 'col' ? 'lg:flex-col' : 'lg:flex-row',
    `gap-${spacing}`,
    className
  );

  return (
    <div className={stackClasses}>
      {children}
    </div>
  );
};
