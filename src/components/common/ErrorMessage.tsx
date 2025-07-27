
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  showIcon?: boolean;
  variant?: 'default' | 'destructive';
}

export const ErrorMessage = ({ 
  title = 'Terjadi Kesalahan', 
  message, 
  onRetry, 
  showIcon = true,
  variant = 'destructive'
}: ErrorMessageProps) => {
  return (
    <Alert variant={variant} className="my-4">
      {showIcon && <AlertCircle className="h-4 w-4" />}
      <AlertDescription className="flex items-center justify-between">
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
        </div>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="ml-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
