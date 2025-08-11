import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseCategory, ExpenseWithCategory } from "@/types/expense";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { ExpenseDateField } from "@/components/ExpenseDateField";
import { safeParseCurrency } from "@/utils/valueParser";

const formSchema = z.object({
  category_id: z.string().min(1, "Categoria é obrigatória"),
  amount: z.union([z.string(), z.number()]).refine(val => {
    const num = safeParseCurrency(val);
    return num > 0;
  }, "Valor deve ser maior que zero"),
  payment_date: z.string().min(1, "Data de pagamento é obrigatória"),
  penalty_interest: z.union([z.string(), z.number()]).refine(val => {
    const num = safeParseCurrency(val);
    return num >= 0;
  }, "Multa/Juros deve ser maior ou igual a zero"),
  description: z.string().optional(),
  is_residential: z.boolean().default(false),
  competency: z.string().optional(),
  residential_adjusted_amount: z.union([z.string(), z.number()]).optional(),
});

interface ExpenseFormProps {
  expense?: ExpenseWithCategory | null;
  onClose: () => void;
}

export const ExpenseForm = ({ expense, onClose }: ExpenseFormProps) => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const [categorySearchOpen, setCategorySearchOpen] = useState(false);
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

  // Use centralized value parser

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      console.log('Salvando despesa com valores:', values);
      console.log('Tipo do amount:', typeof values.amount, 'Valor:', values.amount);
      console.log('Tipo do penalty_interest:', typeof values.penalty_interest, 'Valor:', values.penalty_interest);
      console.log('Tipo do residential_adjusted_amount:', typeof values.residential_adjusted_amount, 'Valor:', values.residential_adjusted_amount);
      
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }
      
      const parsedAmount = safeParseCurrency(values.amount);
      const parsedPenaltyInterest = safeParseCurrency(values.penalty_interest ?? 0);
      const parsedResidentialAmount = safeParseCurrency(values.residential_adjusted_amount ?? 0);

      console.log('Valores parseados - Amount:', parsedAmount, 'Penalty:', parsedPenaltyInterest, 'Residential:', parsedResidentialAmount);

      const expenseData = {
        category_id: values.category_id,
        amount: parsedAmount,
        payment_date: values.payment_date,
        penalty_interest: parsedPenaltyInterest,
        description: values.description || null,
        is_residential: values.is_residential,
        competency: values.competency || null,
        residential_adjusted_amount: parsedResidentialAmount || null,
        owner_id: user.id
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
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    if (selectedCategory?.requires_competency && !values.competency) {
      form.setError("competency", {
        type: "required",
        message: "Competência é obrigatória para esta categoria"
      });
      return;
    }

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
    
    if (!category?.is_residential) {
      form.setValue("is_residential", false);
    }
    
    if (!category?.requires_competency) {
      form.setValue("competency", "");
    }
  };

  const watchIsResidential = form.watch("is_residential");
  const watchAmount = form.watch("amount");

  useEffect(() => {
    let adjustedAmount;
    
    if (selectedCategory?.is_residential && watchIsResidential) {
      adjustedAmount = Number(watchAmount) * 0.20;
    } else {
      adjustedAmount = Number(watchAmount);
    }
    
    form.setValue('residential_adjusted_amount', adjustedAmount);
    console.log(`Valor residencial ajustado: ${adjustedAmount} (20% aplicado: ${selectedCategory?.is_residential && watchIsResidential})`);
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
                <Popover open={categorySearchOpen} onOpenChange={setCategorySearchOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={categorySearchOpen}
                        className="w-full justify-between"
                      >
                        {field.value
                          ? categories?.find((category) => category.id === field.value)?.name
                          : "Buscar categoria..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar categoria..." />
                      <CommandList>
                        {categoriesLoading ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            Carregando categorias...
                          </div>
                        ) : categoriesError ? (
                          <div className="p-2 text-sm text-red-500">
                            Erro ao carregar categorias
                          </div>
                        ) : !categories || categories.length === 0 ? (
                          <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                        ) : (
                          <>
                            <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                            <CommandGroup>
                              {categories.map((category) => (
                                <CommandItem
                                  key={category.id}
                                  value={category.name}
                                  onSelect={() => {
                                    handleCategoryChange(category.id);
                                    setCategorySearchOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === category.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {category.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                    value={field.value ?? ""}
                    onChange={(val) => field.onChange(val ?? "")}
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
              <ExpenseDateField
                value={field.value || ''}
                onValueChange={field.onChange}
                required
              />
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
                    value={field.value ?? ""}
                    onChange={(val) => field.onChange(val ?? "")}
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
                      onChange={(e) => {
                        // Remove caracteres não numéricos
                        let value = e.target.value.replace(/\D/g, '');
                        
                        // Aplica máscara MM/AAAA
                        if (value.length >= 2) {
                          value = value.substring(0, 2) + '/' + value.substring(2, 6);
                        }
                        
                        field.onChange(value);
                      }}
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
