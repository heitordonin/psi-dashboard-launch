import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseCategory, ExpenseWithCategory } from "@/types/expense";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  category_id: z.string().min(1, "Categoria é obrigatória"),
  amount: z.string().min(1, "Valor é obrigatório"),
  payment_date: z.string().min(1, "Data de pagamento é obrigatória"),
  penalty_interest: z.string().optional(),
  description: z.string().optional(),
  is_residential: z.boolean().default(false),
  competency: z.string().optional(),
});

interface ExpenseFormProps {
  expense?: ExpenseWithCategory | null;
  onClose: () => void;
}

export const ExpenseForm = ({ expense, onClose }: ExpenseFormProps) => {
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as ExpenseCategory[];
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category_id: expense?.category_id || "",
      amount: expense?.amount?.toString() || "",
      payment_date: expense?.payment_date || "",
      penalty_interest: expense?.penalty_interest?.toString() || "0",
      description: expense?.description || "",
      is_residential: expense?.is_residential || false,
      competency: expense?.competency || "",
    },
  });

  useEffect(() => {
    if (expense && categories) {
      const category = categories.find(c => c.id === expense.category_id);
      setSelectedCategory(category || null);
    }
  }, [expense, categories]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const expenseData = {
        category_id: values.category_id,
        amount: parseFloat(values.amount),
        payment_date: values.payment_date,
        penalty_interest: parseFloat(values.penalty_interest || "0"),
        description: values.description || null,
        is_residential: values.is_residential,
        competency: values.competency || null,
        residential_adjusted_amount: values.is_residential && selectedCategory?.is_residential 
          ? parseFloat(values.amount) * 0.2 
          : null,
      };

      if (expense) {
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', expense.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('expenses')
          .insert(expenseData);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: expense ? "Despesa atualizada" : "Despesa criada",
        description: expense 
          ? "A despesa foi atualizada com sucesso." 
          : "A despesa foi criada com sucesso.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao salvar despesa: " + error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Validar competência se necessário
    if (selectedCategory?.requires_competency && !values.competency) {
      form.setError("competency", {
        type: "required",
        message: "Competência é obrigatória para esta categoria"
      });
      return;
    }

    // Validar formato da competência (MM/AAAA)
    if (values.competency && !/^\d{2}\/\d{4}$/.test(values.competency)) {
      form.setError("competency", {
        type: "pattern",
        message: "Formato deve ser MM/AAAA"
      });
      return;
    }

    mutation.mutate(values);
  };

  const handleCategoryChange = (categoryId: string) => {
    const category = categories?.find(c => c.id === categoryId);
    setSelectedCategory(category || null);
    form.setValue("category_id", categoryId);
    
    // Reset campos condicionais
    if (!category?.is_residential) {
      form.setValue("is_residential", false);
    }
    
    if (!category?.requires_competency) {
      form.setValue("competency", "");
    }
  };

  const watchIsResidential = form.watch("is_residential");
  const watchAmount = form.watch("amount");

  // Calcular automaticamente o valor residencial ajustado
  useEffect(() => {
    if (watchIsResidential && selectedCategory?.is_residential && watchAmount) {
      const adjustedAmount = parseFloat(watchAmount) * 0.2;
      console.log(`Valor residencial ajustado: ${adjustedAmount}`);
    }
  }, [watchIsResidential, watchAmount, selectedCategory]);

  return (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle>
          {expense ? "Editar Despesa" : "Nova Despesa"}
        </SheetTitle>
      </SheetHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria *</FormLabel>
                <Select onValueChange={handleCategoryChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.code} - {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor *</FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value}
                    onChange={(value) => field.onChange(value.toString())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Pagamento *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="penalty_interest"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Multa/Juros</FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value}
                    onChange={(value) => field.onChange(value.toString())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedCategory?.is_residential && (
            <FormField
              control={form.control}
              name="is_residential"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Despesa é residencial?
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Se marcado, será calculado 20% do valor como ajuste residencial
                    </p>
                  </div>
                </FormItem>
              )}
            />
          )}

          {selectedCategory?.requires_competency && (
            <FormField
              control={form.control}
              name="competency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Competência *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="MM/AAAA" 
                      maxLength={7}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descrição opcional da despesa"
                    rows={3}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className="flex-1"
            >
              {mutation.isPending 
                ? (expense ? "Atualizando..." : "Criando...") 
                : (expense ? "Atualizar" : "Criar")
              }
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
