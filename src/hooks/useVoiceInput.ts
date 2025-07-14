import { useState, useRef, useCallback } from 'react';

interface UseVoiceInputProps {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  language?: string;
}

export const useVoiceInput = ({ 
  onResult, 
  onError, 
  language = 'pt-BR' 
}: UseVoiceInputProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Check if speech recognition is supported
  const checkSupport = useCallback(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setIsSupported(true);
        return true;
      }
    }
    setIsSupported(false);
    return false;
  }, []);

  const startListening = useCallback(() => {
    if (!checkSupport()) {
      onError?.('Reconhecimento de voz não suportado neste navegador');
      return;
    }

    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = language;

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setIsListening(false);
    };

    recognitionRef.current.onerror = (event: any) => {
      setIsListening(false);
      onError?.(event.error);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  }, [checkSupport, onResult, onError, language]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return {
    isListening,
    isSupported: checkSupport(),
    startListening,
    stopListening
  };
};