interface PerformanceMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  navigationType?: string;
}

interface CoreWebVitals {
  CLS: number | null;
  FID: number | null;
  FCP: number | null;
  LCP: number | null;
  TTFB: number | null;
}

class PerformanceMonitor {
  private metrics: CoreWebVitals = {
    CLS: null,
    FID: null,
    FCP: null,
    LCP: null,
    TTFB: null
  };

  private observers: PerformanceObserver[] = [];
  // Analytics removed - performance monitoring disabled

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();
    this.observeTTFB();

    // Send metrics when page is being unloaded
    window.addEventListener('beforeunload', () => {
      this.sendMetrics();
    });

    // Send metrics after 30 seconds
    setTimeout(() => {
      this.sendMetrics();
    }, 30000);
  }

  private observeLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        if (lastEntry) {
          this.metrics.LCP = lastEntry.startTime;
          this.logMetric('LCP', lastEntry.startTime);
        }
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('LCP monitoring not supported:', error);
    }
  }

  private observeFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry: any) => {
          if (entry.processingStart && entry.startTime) {
            const fid = entry.processingStart - entry.startTime;
            this.metrics.FID = fid;
            this.logMetric('FID', fid);
          }
        });
      });

      observer.observe({ type: 'first-input', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FID monitoring not supported:', error);
    }
  }

  private observeCLS(): void {
    try {
      let clsValue = 0;
      let sessionValue = 0;
      let sessionEntries: any[] = [];

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0];
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

            if (sessionValue && 
                entry.startTime - lastSessionEntry.startTime < 1000 &&
                entry.startTime - firstSessionEntry.startTime < 5000) {
              sessionValue += entry.value;
              sessionEntries.push(entry);
            } else {
              sessionValue = entry.value;
              sessionEntries = [entry];
            }

            if (sessionValue > clsValue) {
              clsValue = sessionValue;
              this.metrics.CLS = clsValue;
              this.logMetric('CLS', clsValue);
            }
          }
        });
      });

      observer.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('CLS monitoring not supported:', error);
    }
  }

  private observeFCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.FCP = entry.startTime;
            this.logMetric('FCP', entry.startTime);
          }
        });
      });

      observer.observe({ type: 'paint', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FCP monitoring not supported:', error);
    }
  }

  private observeTTFB(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry: any) => {
          if (entry.responseStart && entry.requestStart) {
            const ttfb = entry.responseStart - entry.requestStart;
            this.metrics.TTFB = ttfb;
            this.logMetric('TTFB', ttfb);
          }
        });
      });

      observer.observe({ type: 'navigation', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('TTFB monitoring not supported:', error);
    }
  }

  private logMetric(name: string, value: number): void {
    const rating = this.getRating(name, value);
    console.log(`🔍 Performance Metric: ${name} = ${value.toFixed(2)}ms (${rating})`);
  }

  private getRating(metric: string, value: number): string {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 }
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return '✅ Good';
    if (value <= threshold.poor) return '⚠️ Needs Improvement';
    return '❌ Poor';
  }

  public getMetrics(): CoreWebVitals {
    return { ...this.metrics };
  }

  public getPerformanceScore(): number {
    const metrics = this.getMetrics();
    let score = 0;
    let count = 0;

    // LCP Score (25%)
    if (metrics.LCP !== null) {
      if (metrics.LCP <= 2500) score += 25;
      else if (metrics.LCP <= 4000) score += 15;
      count++;
    }

    // FID Score (25%)
    if (metrics.FID !== null) {
      if (metrics.FID <= 100) score += 25;
      else if (metrics.FID <= 300) score += 15;
      count++;
    }

    // CLS Score (25%)
    if (metrics.CLS !== null) {
      if (metrics.CLS <= 0.1) score += 25;
      else if (metrics.CLS <= 0.25) score += 15;
      count++;
    }

    // FCP Score (25%)
    if (metrics.FCP !== null) {
      if (metrics.FCP <= 1800) score += 25;
      else if (metrics.FCP <= 3000) score += 15;
      count++;
    }

    return count > 0 ? Math.round(score / count * 4) : 0; // Scale to 100
  }

  private async sendMetrics(): Promise<void> {
    try {
      const metrics = this.getMetrics();
      const performanceScore = this.getPerformanceScore();
      
      const data = {
        ...metrics,
        performanceScore,
        url: window.location.pathname,
        userAgent: navigator.userAgent,
        connection: (navigator as any).connection?.effectiveType || 'unknown',
        timestamp: new Date().toISOString()
      };

      // Only send if we have at least one metric
      const hasMetrics = Object.values(metrics).some(value => value !== null);
      if (!hasMetrics) return;

      // Analytics removed - no longer sending performance data
      console.log('Performance metrics collected:', metrics);
    } catch (error) {
      console.warn('Failed to send performance metrics:', error);
    }
  }

  public disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  // Manual metric reporting
  public reportCustomMetric(name: string, value: number): void {
    console.log(`📊 Custom Metric: ${name} = ${value}ms`);
    
    // Analytics removed - no longer sending custom metrics
    console.log('Custom metric:', {
      name,
      value,
      url: window.location.pathname,
      timestamp: new Date().toISOString()
    });
  }

  // Resource timing analysis
  public analyzeResourceTiming(): {
    totalResources: number;
    slowResources: PerformanceResourceTiming[];
    largeResources: PerformanceResourceTiming[];
    cacheHits: PerformanceResourceTiming[];
    avgLoadTime: number;
  } {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const analysis = {
      totalResources: resources.length,
      slowResources: resources.filter(r => r.duration > 1000),
      largeResources: resources.filter(r => r.transferSize > 100000),
      cacheHits: resources.filter(r => r.transferSize === 0),
      avgLoadTime: resources.reduce((sum, r) => sum + r.duration, 0) / resources.length
    };

    console.log('📈 Resource Analysis:', analysis);
    return analysis;
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export function initPerformanceMonitoring(): PerformanceMonitor {
  if (!performanceMonitor && typeof window !== 'undefined') {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor as PerformanceMonitor;
}

export function getPerformanceMonitor(): PerformanceMonitor | null {
  return performanceMonitor;
}

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = React.useState<CoreWebVitals>({
    CLS: null,
    FID: null,
    FCP: null,
    LCP: null,
    TTFB: null
  });

  const [performanceScore, setPerformanceScore] = React.useState<number>(0);

  React.useEffect(() => {
    const monitor = initPerformanceMonitoring();
    
    const updateMetrics = () => {
      setMetrics(monitor.getMetrics());
      setPerformanceScore(monitor.getPerformanceScore());
    };

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    
    // Initial update
    updateMetrics();

    return () => {
      clearInterval(interval);
    };
  }, []);

  return { metrics, performanceScore };
}

// Import React for the hook
import React from 'react';

export default PerformanceMonitor;
