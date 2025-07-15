
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState = ({ 
  icon = '📊', 
  title, 
  description, 
  actionLabel, 
  onAction,
  className = ''
}: EmptyStateProps) => {
  return (
    <Card className={`glass-card border-0 ${className}`}>
      <CardContent className="text-center py-12">
        <div className="text-6xl mb-4">{icon}</div>
        <div className="text-lg font-medium text-muted-foreground mb-2">
          {title}
        </div>
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
          {description}
        </p>
        {actionLabel && onAction && (
          <Button onClick={onAction} className="gradient-primary">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default EmptyState;
