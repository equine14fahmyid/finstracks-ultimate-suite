
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface LoadingSkeletonProps {
  variant?: 'table' | 'card' | 'form' | 'stats' | 'chart';
  rows?: number;
  className?: string;
}

export const LoadingSkeleton = ({ 
  variant = 'table', 
  rows = 5, 
  className = '' 
}: LoadingSkeletonProps) => {
  switch (variant) {
    case 'table':
      return (
        <div className={`space-y-3 ${className}`}>
          {/* Table Header */}
          <div className="flex space-x-4 mb-4">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 w-20" />
          </div>
          {/* Table Rows */}
          {Array(rows).fill(0).map((_, i) => (
            <div key={i} className="flex space-x-4">
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 w-20" />
            </div>
          ))}
        </div>
      );

    case 'card':
      return (
        <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
          {Array(rows).fill(0).map((_, i) => (
            <Card key={i} className="glass-card">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      );

    case 'form':
      return (
        <div className={`space-y-6 ${className}`}>
          {Array(rows).fill(0).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <div className="flex space-x-2 pt-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      );

    case 'stats':
      return (
        <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
          {Array(4).fill(0).map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );

    case 'chart':
      return (
        <Card className={`glass-card ${className}`}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      );

    default:
      return <Skeleton className={`h-12 w-full ${className}`} />;
  }
};
