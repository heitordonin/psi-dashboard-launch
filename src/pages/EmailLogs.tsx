
import { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Mail } from "lucide-react";
import { EmailLogFilter, EmailLogFilters } from "@/components/email-logs/EmailLogFilter";
import { EmailLogsList } from "@/components/email-logs/EmailLogsList";
import { useEmailLogs } from "@/hooks/useEmailLogs";

const EmailLogs = () => {
  const [filters, setFilters] = useState<EmailLogFilters>({
    search: "",
    status: "",
    startDate: "",
    endDate: ""
  });

  const { data: logs = [], isLoading } = useEmailLogs();

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !filters.search || 
      log.recipient_email.toLowerCase().includes(filters.search.toLowerCase()) ||
      log.patients?.full_name?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = !filters.status || log.status === filters.status;
    
    const matchesDateRange = (() => {
      if (!filters.startDate && !filters.endDate) return true;
      const logDate = new Date(log.created_at);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;
      
      if (startDate && logDate < startDate) return false;
      if (endDate && logDate > endDate) return false;
      return true;
    })();

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div style={{ backgroundColor: '#002472' }} className="border-b px-4 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-white hover:text-gray-200" />
                <div className="flex items-center gap-3">
                  <Mail className="h-6 w-6" style={{ color: '#03f6f9' }} />
                  <div>
                    <h1 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                      Logs de Email
                    </h1>
                    <p className="text-sm" style={{ color: '#03f6f9' }}>
                      Histórico de emails enviados
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-6 space-y-6">
              <EmailLogFilter
                filters={filters}
                onFilterChange={setFilters}
              />

              <EmailLogsList
                logs={filteredLogs}
                isLoading={isLoading}
              />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default EmailLogs;
