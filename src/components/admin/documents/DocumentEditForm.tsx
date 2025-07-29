import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Save, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  full_name?: string;
  display_name?: string;
}

interface DocumentEditFormProps {
  document: any;
  users: User[];
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const DocumentEditForm = ({
  document,
  users,
  onSave,
  onCancel,
  isLoading
}: DocumentEditFormProps) => {
  const [formData, setFormData] = useState({
    user_id: document.user_id || "",
    competency: document.competency || "",
    due_date: document.due_date || "",
    amount: document.amount || 0,
    observations: document.observations || ""
  });

  const [competencyDate, setCompetencyDate] = useState<Date | undefined>(
    document.competency ? new Date(document.competency) : undefined
  );
  const [dueDateDate, setDueDateDate] = useState<Date | undefined>(
    document.due_date ? new Date(document.due_date) : undefined
  );

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCompetencyDateSelect = (date: Date | undefined) => {
    setCompetencyDate(date);
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd");
      handleInputChange("competency", formattedDate);
    }
  };

  const handleDueDateSelect = (date: Date | undefined) => {
    setDueDateDate(date);
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd");
      handleInputChange("due_date", formattedDate);
    }
  };

  const handleAmountChange = (value: number) => {
    handleInputChange("amount", value);
  };

  const handleSubmit = () => {
    const submitData = {
      user_id: formData.user_id,
      competency: formData.competency,
      due_date: formData.due_date,
      amount: typeof formData.amount === 'number' ? formData.amount : parseFloat(formData.amount) || 0
      // Nota: observations não é salvo no banco ainda
    };
    onSave(submitData);
  };

  const isFormValid = () => {
    return (
      formData.user_id &&
      formData.competency &&
      formData.due_date &&
      formData.amount &&
      (typeof formData.amount === 'number' ? formData.amount : parseFloat(formData.amount)) > 0
    );
  };

  const getUserDisplayName = (user: User) => {
    return user.full_name || user.display_name || `Usuário ${user.id}`;
  };

  return (
    <div className="space-y-6">
      {/* User Selection */}
      <div className="space-y-2">
        <Label htmlFor="user">Usuário *</Label>
        <Select value={formData.user_id} onValueChange={(value) => handleInputChange("user_id", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um usuário" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {getUserDisplayName(user)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category (Fixed) */}
      <div className="space-y-2">
        <Label>Categoria</Label>
        <Input value="DARF Carnê-Leão" disabled className="bg-muted" />
      </div>

      {/* Competency Date */}
      <div className="space-y-2">
        <Label>Competência *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !competencyDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {competencyDate ? (
                format(competencyDate, "dd/MM/yyyy", { locale: ptBR })
              ) : (
                "Selecione a competência"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={competencyDate}
              onSelect={handleCompetencyDateSelect}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Due Date */}
      <div className="space-y-2">
        <Label>Vencimento *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dueDateDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDateDate ? (
                format(dueDateDate, "dd/MM/yyyy", { locale: ptBR })
              ) : (
                "Selecione o vencimento"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDateDate}
              onSelect={handleDueDateSelect}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount">Valor *</Label>
        <CurrencyInput
          value={formData.amount}
          onChange={handleAmountChange}
          placeholder="R$ 0,00"
          className="w-full"
        />
      </div>

      {/* Observations */}
      <div className="space-y-2">
        <Label htmlFor="observations">Observações</Label>
        <Textarea
          id="observations"
          placeholder="Adicione observações sobre este documento..."
          value={formData.observations}
          onChange={(e) => handleInputChange("observations", e.target.value)}
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid() || isLoading}
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Salvando..." : "Salvar"}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
      </div>

      {/* Form Status */}
      <div className="text-xs text-muted-foreground">
        <p>* Campos obrigatórios</p>
        {!isFormValid() && (
          <p className="text-destructive mt-1">
            Preencha todos os campos obrigatórios para salvar
          </p>
        )}
      </div>
    </div>
  );
};