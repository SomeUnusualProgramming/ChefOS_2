import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { Language, FridgeItem, Meal, ShoppingItem } from '@/types/chefos';
import { API_BASE_URL } from '@/config/api';
import { Mic, MicOff, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface ProposedAction {
  id: string;
  type: 'fridge_add' | 'shopping_add' | 'meal_add' | 'meal_remove' | 'shopping_remove';
  data: FridgeItem | ShoppingItem | Meal | { mealId: string } | { itemId: string } | FridgeItem[] | ShoppingItem[];
  description: string;
  icon: 'fridge' | 'shopping' | 'meal';
}

export interface AIAction {
  type: 'fridge_add' | 'fridge_remove' | 'fridge_update' | 'meal_add' | 'meal_remove' | 'shopping_add' | 'shopping_remove' | 'shopping_toggle' | 'propose' | 'unknown';
  data?: FridgeItem | Meal | ShoppingItem | { productName: string } | { mealId: string } | { itemId: string } | FridgeItem[] | ShoppingItem[] | ProposedAction[];
  message: string;
}

interface ChatInputProps {
  language: Language;
  onAIAction: (action: AIAction) => void;
  fridge: FridgeItem[];
  meals: Meal[];
  shoppingList: ShoppingItem[];
}

export default function ChatInput({ language, onAIAction, fridge, meals, shoppingList }: ChatInputProps) {
  const { t } = useTranslation(language);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error,
  } = useSpeechRecognition(language === 'pl' ? 'pl-PL' : language === 'es' ? 'es-ES' : language === 'de' ? 'de-DE' : 'en-US');

  const handleToggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      toast.info(t('chat.listening') || 'Listening... Speak now!');
    }
  }, [isListening, startListening, stopListening, t]);

  useEffect(() => {
    if (transcript && !isListening) {
      setInputText(prev => (prev ? `${prev} ${transcript}`.trim() : transcript));
      resetTranscript();
    }
  }, [transcript, isListening, resetTranscript]);

  const handleSubmit = useCallback(async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/agents/chat-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          language,
          fridge,
          meals,
          shoppingList,
        }),
      });

      if (!response.ok) {
        if (response.status === 503 || response.status === 502) {
          throw new Error('Backend AI unavailable - check if docker is running');
        }
        throw new Error('Backend AI request failed');
      }

      const action = (await response.json()) as AIAction;

      if (action.type !== 'unknown') {
        onAIAction(action);
        toast.success(action.message);
        setInputText('');
      } else {
        toast.error(action.message || 'Nie rozumiem polecenia. Spróbuj inaczej.');
      }
    } catch (e) {
      console.error(e);
      const errorMsg = e instanceof Error ? e.message : '';
      if (errorMsg.includes('Backend AI unavailable') || errorMsg.includes('Failed to fetch')) {
        toast.error('Nie udało się połączyć z backendem AI. Upewnij się że backend działa: docker-compose up -d');
      } else {
        toast.error('Błąd podczas przetwarzania żądania AI');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, language, fridge, meals, shoppingList, onAIAction]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="mb-5">
      <p className="text-xs text-muted-foreground mb-2 text-center">
        {t('chat.hint') || 'Wpisz komendę lub użyj głosu'}
      </p>
      <div className="relative">
        <div className={`
          glass-card rounded-2xl p-1 flex items-center gap-2
          transition-all duration-300
          ${isListening ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''}
        `}>
          {isSupported && (
            <button
              onClick={handleToggleListening}
              disabled={isProcessing}
              className={`
                shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                transition-all duration-300
                ${isListening
                  ? 'bg-destructive text-destructive-foreground animate-pulse'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
                }
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('chat.placeholder') || 'Napisz do AI... np. "dodaj kurczaka do lodówki"'}
            disabled={isProcessing}
            className="
              flex-1 bg-transparent border-none outline-none
              text-sm text-foreground placeholder:text-muted-foreground
              py-2 px-1
            "
          />

          <button
            onClick={handleSubmit}
            disabled={!inputText.trim() || isProcessing}
            className={`
              shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
              bg-primary text-primary-foreground
              transition-all duration-200
              hover:opacity-90 active:scale-95
              ${(!inputText.trim() || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>

        {isListening && (
          <div className="absolute -bottom-6 left-0 right-0 flex justify-center">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-[10px] text-muted-foreground ml-1">{t('chat.listening') || 'Listening...'}</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-[10px] text-destructive mt-2 text-center">
          {error === 'not-allowed' ? 'Microphone access denied. Please allow microphone access in your browser settings.' :
           error === 'no-speech' ? 'No speech detected. Please try again.' :
           `Speech recognition error: ${error}`}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-1 justify-center">
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-full">
          &quot;dodaj mleko do lodówki&quot;
        </span>
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-full">
          &quot;zaplanuj obiad z kurczakiem&quot;
        </span>
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-full">
          &quot;kup chleb&quot;
        </span>
      </div>
    </div>
  );
}
