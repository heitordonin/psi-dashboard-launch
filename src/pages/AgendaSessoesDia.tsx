import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, CalendarIcon, Search, Clock, User, Mail, Phone, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAppointments } from "@/hooks/useAppointments";
import { CalendarFilters, Appointment } from "@/types/appointment";

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Agendado', variant: 'default' as const },
  { value: 'completed', label: 'Realizada', variant: 'secondary' as const },
  { value: 'no_show', label: 'Faltou', variant: 'destructive' as const },
  { value: 'cancelled', label: 'Cancelada', variant: 'outline' as const },
];

export default function AgendaSessoesDia() {
  const [filters, setFilters] = useState<CalendarFilters>({
    date: new Date(),
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const { appointments, isLoading, updateAppointment } = useAppointments(filters);

  const handleStatusChange = (appointmentId: string, newStatus: Appointment['status']) => {
    updateAppointment({ id: appointmentId, status: newStatus });
  };

  const getStatusBadge = (status: Appointment['status']) => {
    const statusOption = STATUS_OPTIONS.find(opt => opt.value === status);
    return (
      <Badge variant={statusOption?.variant || 'default'}>
        {statusOption?.label || status}
      </Badge>
    );
  };

  const formatAppointmentTime = (startDateTime: string, endDateTime: string) => {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <a href="/agenda">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Agenda
          </a>
        </Button>
        <h1 className="text-2xl font-bold">Sessões do Dia</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.date ? (
                      format(filters.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    ) : (
                      "Selecione uma data"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.date}
                    onSelect={(date) => {
                      setFilters(prev => ({ ...prev, date }));
                      setShowCalendar(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient_name">Nome do Paciente</Label>
              <Input
                id="patient_name"
                type="text"
                placeholder="Buscar por nome..."
                value={filters.patient_name || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, patient_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient_email">E-mail do Paciente</Label>
              <Input
                id="patient_email"
                type="email"
                placeholder="Buscar por e-mail..."
                value={filters.patient_email || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, patient_email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  status: value === 'all' ? undefined : value as Appointment['status']
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando sessões...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhuma sessão encontrada para os filtros selecionados.
            </p>
          </div>
        ) : (
          appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{appointment.title}</h3>
                      {getStatusBadge(appointment.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>
                          {formatAppointmentTime(appointment.start_datetime, appointment.end_datetime)}
                        </span>
                      </div>

                      {appointment.patient_name && (
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{appointment.patient_name}</span>
                        </div>
                      )}

                      {appointment.patient_email && (
                        <div className="flex items-center">
                          <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{appointment.patient_email}</span>
                        </div>
                      )}

                      {appointment.patient_phone && (
                        <div className="flex items-center">
                          <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{appointment.patient_phone}</span>
                        </div>
                      )}
                    </div>

                    {appointment.notes && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Observações:</strong> {appointment.notes}
                      </div>
                    )}
                  </div>

                  <div className="ml-4 space-y-2">
                    <Select
                      value={appointment.status}
                      onValueChange={(value) => handleStatusChange(appointment.id, value as Appointment['status'])}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}