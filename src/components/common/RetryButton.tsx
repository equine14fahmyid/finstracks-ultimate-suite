
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface RetryButtonProps {
  onRetry: () => void;
  loading?: boolean;
  error?: string;
  className?: string;
  variant?: 'button-only' | 'card';
}

export const RetryButton = ({ 
  onRetry, 
  loading = false, 
  error, 
  className = '',
  variant = 'button-only'
}: RetryButtonProps) => {
  if (variant === 'card') {
    return (
      <Card className={`glass-card border-destructive/20 ${className}`}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-sm text-muted-foreground mb-4 text-center">
            {error || 'Gagal memuat data'}
          </p>
          <Button 
            onClick={onRetry} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Mencoba lagi...' : 'Coba Lagi'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Button 
      onClick={onRetry} 
      disabled={loading}
      variant="outline"
      size="sm"
      className={className}
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Mencoba lagi...' : 'Coba Lagi'}
    </Button>
  );
};
