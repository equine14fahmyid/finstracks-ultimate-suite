
import { useState, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  pageLoadTime: number;
  renderTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  networkSpeed: 'slow' | 'normal' | 'fast';
}

interface PerformanceAlert {
  type: 'warning' | 'error';
  message: string;
  metric: keyof PerformanceMetrics;
  value: number;
  threshold: number;
}

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    renderTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0,
    networkSpeed: 'normal'
  });
  
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Thresholds for performance alerts
  const thresholds = {
    pageLoadTime: 3000, // 3 seconds
    renderTime: 100, // 100ms
    apiResponseTime: 2000, // 2 seconds
    memoryUsage: 50 * 1024 * 1024 // 50MB
  };

  const measurePageLoad = useCallback(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.navigationStart;
      setMetrics(prev => ({ ...prev, pageLoadTime: loadTime }));
      
      if (loadTime > thresholds.pageLoadTime) {
        setAlerts(prev => [...prev, {
          type: 'warning',
          message: 'Page load time is slower than expected',
          metric: 'pageLoadTime',
          value: loadTime,
          threshold: thresholds.pageLoadTime
        }]);
      }
    }
  }, []);

  const measureApiResponse = useCallback((startTime: number, endTime: number) => {
    const responseTime = endTime - startTime;
    setMetrics(prev => ({ ...prev, apiResponseTime: responseTime }));
    
    if (responseTime > thresholds.apiResponseTime) {
      setAlerts(prev => [...prev, {
        type: 'warning',
        message: 'API response time is slower than expected',
        metric: 'apiResponseTime',
        value: responseTime,
        threshold: thresholds.apiResponseTime
      }]);
    }
  }, []);

  const measureMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usage = memory.usedJSHeapSize;
      setMetrics(prev => ({ ...prev, memoryUsage: usage }));
      
      if (usage > thresholds.memoryUsage) {
        setAlerts(prev => [...prev, {
          type: 'error',
          message: 'Memory usage is higher than expected',
          metric: 'memoryUsage',
          value: usage,
          threshold: thresholds.memoryUsage
        }]);
      }
    }
  }, []);

  const measureNetworkSpeed = useCallback(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const speed = connection.effectiveType;
      
      let networkSpeed: 'slow' | 'normal' | 'fast' = 'normal';
      if (speed === 'slow-2g' || speed === '2g') {
        networkSpeed = 'slow';
      } else if (speed === '4g') {
        networkSpeed = 'fast';
      }
      
      setMetrics(prev => ({ ...prev, networkSpeed }));
    }
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    
    // Measure initial metrics
    measurePageLoad();
    measureMemoryUsage();
    measureNetworkSpeed();
    
    // Set up periodic monitoring
    const interval = setInterval(() => {
      measureMemoryUsage();
      measureNetworkSpeed();
    }, 30000); // Every 30 seconds
    
    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  }, [measurePageLoad, measureMemoryUsage, measureNetworkSpeed]);

  useEffect(() => {
    const cleanup = startMonitoring();
    return cleanup;
  }, [startMonitoring]);

  // API wrapper for measuring response times
  const wrapApiCall = useCallback(async <T>(apiCall: () => Promise<T>): Promise<T> => {
    const startTime = performance.now();
    try {
      const result = await apiCall();
      const endTime = performance.now();
      measureApiResponse(startTime, endTime);
      return result;
    } catch (error) {
      const endTime = performance.now();
      measureApiResponse(startTime, endTime);
      throw error;
    }
  }, [measureApiResponse]);

  return {
    metrics,
    alerts,
    isMonitoring,
    clearAlerts,
    wrapApiCall,
    // Performance utilities
    formatBytes: (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    formatTime: (ms: number) => {
      if (ms < 1000) return `${ms.toFixed(0)}ms`;
      return `${(ms / 1000).toFixed(2)}s`;
    }
  };
};
