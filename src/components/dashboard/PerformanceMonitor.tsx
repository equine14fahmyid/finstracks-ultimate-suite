
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { Activity, AlertTriangle, CheckCircle, Clock, Cpu, Wifi } from 'lucide-react';

const PerformanceMonitor = () => {
  const { 
    metrics, 
    alerts, 
    isMonitoring, 
    clearAlerts, 
    formatBytes, 
    formatTime 
  } = usePerformanceMonitor();

  const getNetworkIcon = (speed: string) => {
    switch (speed) {
      case 'slow': return <Wifi className="h-4 w-4 text-red-500" />;
      case 'fast': return <Wifi className="h-4 w-4 text-green-500" />;
      default: return <Wifi className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getPerformanceScore = () => {
    let score = 100;
    
    if (metrics.pageLoadTime > 3000) score -= 20;
    if (metrics.renderTime > 100) score -= 15;
    if (metrics.apiResponseTime > 2000) score -= 25;
    if (metrics.memoryUsage > 50 * 1024 * 1024) score -= 20;
    if (metrics.networkSpeed === 'slow') score -= 20;
    
    return Math.max(0, score);
  };

  const score = getPerformanceScore();
  const scoreColor = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Monitor
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isMonitoring ? 'success' : 'secondary'}>
              {isMonitoring ? 'Active' : 'Inactive'}
            </Badge>
            <div className={`text-2xl font-bold ${scoreColor}`}>
              {score}%
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Clock className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <div className="text-xs text-muted-foreground">Page Load</div>
            <div className="font-semibold">{formatTime(metrics.pageLoadTime)}</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Cpu className="h-4 w-4 mx-auto mb-1 text-purple-500" />
            <div className="text-xs text-muted-foreground">Memory</div>
            <div className="font-semibold">{formatBytes(metrics.memoryUsage)}</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Activity className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <div className="text-xs text-muted-foreground">API Response</div>
            <div className="font-semibold">{formatTime(metrics.apiResponseTime)}</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-muted/50">
            {getNetworkIcon(metrics.networkSpeed)}
            <div className="text-xs text-muted-foreground">Network</div>
            <div className="font-semibold capitalize">{metrics.networkSpeed}</div>
          </div>
        </div>

        {/* Performance Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Performance Alerts ({alerts.length})
              </h4>
              <Button variant="outline" size="sm" onClick={clearAlerts}>
                Clear All
              </Button>
            </div>
            
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert, index) => (
                <div 
                  key={index}
                  className="p-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{alert.message}</div>
                      <div className="text-xs text-muted-foreground">
                        {alert.metric}: {formatTime(alert.value)} (threshold: {formatTime(alert.threshold)})
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Tips */}
        {score < 80 && (
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-sm text-blue-900 dark:text-blue-100">
                  Performance Tips
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {score < 60 ? 
                    "Consider optimizing your queries and reducing component re-renders." :
                    "Good performance! Minor optimizations can still help."
                  }
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceMonitor;
