import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseCategory, ExpenseWithCategory } from "@/types/expense";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  category_id: z.string().min(1, "Categoria é obrigatória"),
  amount: z.number().min(0.01, "Valor deve ser maior que zero"),
  payment_date: z.string().min(1, "Data de pagamento é obrigatória"),
  penalty_interest: z.number().min(0, "Multa/Juros deve ser maior ou igual a zero"),
  description: z.string().optional(),
  is_residential: z.boolean().default(false),
  competency: z.string().optional(),
  residential_adjusted_amount: z.number().optional(),
});

interface ExpenseFormProps {
  expense?: ExpenseWithCategory | null;
  onClose: () => void;
}

export const ExpenseForm = ({ expense, onClose }: ExpenseFormProps) => {
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      console.log('Buscando categorias de despesa...');
      try {
        const { data, error } = await supabase
          .from('expense_categories')
          .select('*')
          .order('name');

        if (error) {
          console.error('Erro ao buscar categorias:', error);
          throw error;
        }
        
        console.log('Categorias encontradas:', data);
        return data as ExpenseCategory[];
      } catch (err) {
        console.error('Erro na query de categorias:', err);
        throw err;
      }
    }
  });

  // Log dos dados das categorias para debug
  useEffect(() => {
    if (categoriesError) {
      console.error('Erro nas categorias:', categoriesError);
      toast({
        title: "Erro ao carregar categorias",
        description: "Erro: " + categoriesError.message,
        variant: "destructive",
      });
    }
  }, [categoriesError, toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category_id: expense?.category_id || "",
      amount: expense?.amount || 0,
      payment_date: expense?.payment_date || "",
      penalty_interest: expense?.penalty_interest || 0,
      description: expense?.description || "",
      is_residential: expense?.is_residential || false,
      competency: expense?.competency || "",
      residential_adjusted_amount: expense?.residential_adjusted_amount || 0,
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
      console.log('Salvando despesa com valores:', values);
      
      const expenseData = {
        category_id: values.category_id,
        amount: values.amount,
        payment_date: values.payment_date,
        penalty_interest: values.penalty_interest,
        description: values.description || null,
        is_residential: values.is_residential,
        competency: values.competency || null,
        residential_adjusted_amount: values.residential_adjusted_amount || null,
        // Don't send owner_id - let Supabase fill it via default auth.uid()
      };

      console.log('Dados a serem salvos:', expenseData);

      if (expense) {
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', expense.id);

        if (error) {
          console.error('Erro ao atualizar despesa:', error);
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('expenses')
          .insert(expenseData);

        if (error) {
          console.error('Erro ao criar despesa:', error);
          throw error;
        }
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
      console.error('Erro na mutação:', error);
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

    // Parse currency values properly
    const parsedAmount = typeof values.amount === 'string' 
      ? parseFloat(values.amount.toString().replace(/\./g, "").replace(",", ".")) 
      : Number(values.amount);
    
    const parsedPenaltyInterest = typeof values.penalty_interest === 'string' 
      ? parseFloat(values.penalty_interest.toString().replace(/\./g, "").replace(",", ".")) 
      : Number(values.penalty_interest);
    
    const parsedResidentialAmount = typeof values.residential_adjusted_amount === 'string' 
      ? parseFloat(values.residential_adjusted_amount.toString().replace(/\./g, "").replace(",", ".")) 
      : Number(values.residential_adjusted_amount || 0);

    const submissionValues = {
      ...values,
      amount: parsedAmount,
      penalty_interest: parsedPenaltyInterest,
      residential_adjusted_amount: parsedResidentialAmount
    };

    mutation.mutate(submissionValues);
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

  // Fix: Calcular automaticamente o valor residencial ajustado com 20%
  useEffect(() => {
    if (selectedCategory?.is_residential) {
      const adjusted = watchIsResidential ? Number(watchAmount) * 0.20 : Number(watchAmount);
      form.setValue('residential_adjusted_amount', adjusted);
      console.log(`Valor residencial ajustado: ${adjusted} (20% aplicado: ${watchIsResidential})`);
    }
  }, [watchIsResidential, watchAmount, selectedCategory, form]);

  return (
    <div className="space-y-6">
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
                    {categoriesLoading ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        Carregando categorias...
                      </div>
                    ) : categoriesError ? (
                      <div className="p-2 text-sm text-red-500">
                        Erro ao carregar categorias
                      </div>
                    ) : !categories || categories.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        Nenhuma categoria encontrada
                      </div>
                    ) : (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    )}
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
                    name="amount"
                    value={field.value}
                    onChange={field.onChange}
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
                    name="penalty_interest"
                    value={field.value}
                    onChange={field.onChange}
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
