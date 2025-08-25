
import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner = React.memo(({ size = 'md', className }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin text-primary',
        sizeClasses[size],
        className
      )} 
    />
  );
});

interface LoadingCardProps {
  className?: string;
  lines?: number;
}

const LoadingCard = React.memo(({ className, lines = 3 }: LoadingCardProps) => {
  return (
    <div className={cn('animate-pulse space-y-3', className)}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-muted rounded',
            i === 0 && 'w-3/4',
            i === 1 && 'w-1/2',
            i === 2 && 'w-2/3'
          )}
        />
      ))}
    </div>
  );
});

interface LoadingTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

const LoadingTable = React.memo(({ rows = 5, columns = 4, className }: LoadingTableProps) => {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {[...Array(columns)].map((_, i) => (
          <div key={i} className="h-6 bg-muted animate-pulse rounded w-20" />
        ))}
      </div>
      
      {/* Rows */}
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {[...Array(columns)].map((_, colIndex) => (
            <div key={colIndex} className="h-8 bg-muted/60 animate-pulse rounded" />
          ))}
        </div>
      ))}
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';
LoadingCard.displayName = 'LoadingCard';
LoadingTable.displayName = 'LoadingTable';

export { LoadingSpinner, LoadingCard, LoadingTable };
