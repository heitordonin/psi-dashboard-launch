
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EnhancedForm } from '@/components/ui/enhanced-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { MarkAsPaidData } from '@/types/adminDocument';

const formSchema = z.object({
  paid_date: z.date({
    required_error: 'Data do pagamento é obrigatória',
  }),
  penalty_amount: z.coerce.number().min(0, 'Valor deve ser positivo').default(0),
});

interface MarkAsPaidModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: MarkAsPaidData) => void;
  isLoading?: boolean;
}

export const MarkAsPaidModal = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: MarkAsPaidModalProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      penalty_amount: 0,
    },
  });

  const handleSubmit = () => {
    form.handleSubmit((values) => {
      onConfirm({
        paid_date: format(values.paid_date, 'yyyy-MM-dd'),
        penalty_amount: values.penalty_amount,
      });
      onOpenChange(false);
      form.reset();
    })();
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  return (
    <EnhancedForm
      isOpen={open}
      onClose={handleClose}
      title="Marcar como Pago"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      submitText="Confirmar Pagamento"
    >
      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="paid_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data do Pagamento *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal touch-target",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione a data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="penalty_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Multa/Juros (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    className="touch-target"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </EnhancedForm>
  );
};
