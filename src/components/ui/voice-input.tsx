import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface VoiceInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onVoiceResult?: (transcript: string) => void;
}

export function VoiceInput({ 
  onVoiceResult, 
  onChange, 
  className,
  ...props 
}: VoiceInputProps) {
  const [value, setValue] = useState(props.value || '');

  const { isListening, isSupported, startListening, stopListening } = useVoiceInput({
    onResult: (transcript) => {
      setValue(transcript);
      onVoiceResult?.(transcript);
      
      // Trigger onChange event
      const event = {
        target: { value: transcript }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(event);
    },
    onError: (error) => {
      console.error('Voice input error:', error);
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onChange?.(e);
  };

  if (!isSupported) {
    return <Input {...props} onChange={handleInputChange} className={className} />;
  }

  return (
    <div className="relative">
      <Input
        {...props}
        value={value}
        onChange={handleInputChange}
        className={cn(
          "pr-12",
          isListening && "voice-input-active",
          className
        )}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
        onClick={isListening ? stopListening : startListening}
      >
        {isListening ? (
          <MicOff className="w-4 h-4 text-destructive" />
        ) : (
          <Mic className="w-4 h-4 text-muted-foreground hover:text-primary" />
        )}
      </Button>
    </div>
  );
}