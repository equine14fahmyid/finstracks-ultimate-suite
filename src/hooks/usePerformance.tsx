
import { useState, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  navigationTiming?: PerformanceTiming;
}

export const usePerformance = (componentName?: string) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [renderStart, setRenderStart] = useState<number>(0);

  const startMeasure = useCallback(() => {
    setRenderStart(performance.now());
  }, []);

  const endMeasure = useCallback(() => {
    if (renderStart > 0) {
      const renderTime = performance.now() - renderStart;
      
      const newMetrics: PerformanceMetrics = {
        renderTime,
        memoryUsage: (performance as any).memory?.usedJSHeapSize,
        navigationTiming: performance.timing
      };

      setMetrics(newMetrics);

      if (componentName && renderTime > 100) {
        console.warn(`Performance Warning: ${componentName} took ${renderTime.toFixed(2)}ms to render`);
      }
    }
  }, [renderStart, componentName]);

  // Auto measure render cycles
  useEffect(() => {
    startMeasure();
    return () => {
      endMeasure();
    };
  }, []);

  return {
    metrics,
    startMeasure,
    endMeasure
  };
};

export const useDebounceCallback = <T extends any[]>(
  callback: (...args: T) => void,
  delay: number
) => {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback((...args: T) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  }, [callback, delay, timeoutId]);

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return debouncedCallback;
};

export const useMemoizedCallback = <T extends any[], R>(
  callback: (...args: T) => R,
  deps: React.DependencyList
) => {
  return useCallback(callback, deps);
};
