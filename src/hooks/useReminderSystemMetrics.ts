import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ReminderSystemMetrics {
  date_range: {
    start_date: string;
    end_date: string;
  };
  overall_statistics: {
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    success_rate_percentage: string;
    avg_duration_ms: number;
    total_reminders_processed: number;
    total_successful_reminders: number;
    total_failed_reminders: number;
    total_rate_limited_reminders: number;
    overall_reminder_success_rate: string;
  };
  alerts_summary: {
    total_active_alerts: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  logs_summary: {
    critical: number;
    error: number;
    warn: number;
    info: number;
    debug: number;
  };
  daily_metrics: Array<{
    execution_date: string;
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    avg_duration_ms: number;
    total_reminders_sent: number;
    total_successful_reminders: number;
    total_failed_reminders: number;
    total_rate_limited_reminders: number;
    success_rate_percentage: number;
  }>;
  recent_executions: Array<{
    id: string;
    execution_id: string;
    started_at: string;
    completed_at: string | null;
    duration_ms: number | null;
    status: string;
    total_reminders: number;
    successful_reminders: number;
    failed_reminders: number;
    rate_limited_reminders: number;
    error_message: string | null;
    performance_data: any;
  }>;
  active_alerts: Array<{
    id: string;
    alert_type: string;
    severity: string;
    title: string;
    message: string;
    details: any;
    status: string;
    triggered_at: string;
    execution_id: string | null;
  }>;
  recent_logs: Array<{
    id: string;
    execution_id: string;
    log_level: string;
    message: string;
    context: any;
    timestamp: string;
    appointment_id: string | null;
    user_id: string | null;
    reminder_type: string | null;
    error_details: any;
  }>;
  timestamp: string;
}

export const useReminderSystemMetrics = (
  startDate?: string, 
  endDate?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['reminder-system-metrics', startDate, endDate],
    queryFn: async (): Promise<ReminderSystemMetrics> => {
      console.log('📊 Fetching reminder system metrics...');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const { data, error } = await supabase.functions.invoke(
        'get-reminder-system-metrics',
        {
          body: {},
          method: 'GET',
        }
      );

      if (error) {
        console.error('Error fetching reminder system metrics:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from reminder system metrics');
      }

      console.log('✅ Reminder system metrics fetched successfully');
      return data;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Hook for real-time monitoring (more frequent updates)
export const useReminderSystemMonitoring = () => {
  return useQuery({
    queryKey: ['reminder-system-monitoring'],
    queryFn: async (): Promise<ReminderSystemMetrics> => {
      const { data, error } = await supabase.functions.invoke(
        'get-reminder-system-metrics',
        {
          body: {},
          method: 'GET',
        }
      );

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from reminder system monitoring');
      }

      return data;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

// Utility functions for metrics analysis
export const getHealthStatus = (metrics: ReminderSystemMetrics): 'healthy' | 'warning' | 'critical' => {
  const { overall_statistics, alerts_summary } = metrics;
  
  // Critical conditions
  if (alerts_summary.critical > 0) return 'critical';
  if (parseFloat(overall_statistics.success_rate_percentage) < 50) return 'critical';
  if (parseFloat(overall_statistics.overall_reminder_success_rate) < 70) return 'critical';
  
  // Warning conditions
  if (alerts_summary.high > 0) return 'warning';
  if (parseFloat(overall_statistics.success_rate_percentage) < 80) return 'warning';
  if (parseFloat(overall_statistics.overall_reminder_success_rate) < 90) return 'warning';
  if (overall_statistics.avg_duration_ms > 30000) return 'warning'; // More than 30 seconds
  
  return 'healthy';
};

export const formatDuration = (durationMs: number): string => {
  if (durationMs < 1000) return `${durationMs}ms`;
  if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s`;
  return `${(durationMs / 60000).toFixed(1)}min`;
};

export const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export const getLogLevelColor = (level: string): string => {
  switch (level) {
    case 'critical': return 'text-red-700 bg-red-100';
    case 'error': return 'text-red-600 bg-red-50';
    case 'warn': return 'text-yellow-600 bg-yellow-50';
    case 'info': return 'text-blue-600 bg-blue-50';
    case 'debug': return 'text-gray-600 bg-gray-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};