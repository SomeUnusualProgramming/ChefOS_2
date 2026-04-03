import { useState, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { Language, FridgeItem } from '@/types/chefos';
import { Mic, MicOff, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ChatInputProps {
  language: Language;
  onAddFridgeItems: (items: FridgeItem[]) => void;
}

// AI parser for extracting fridge items from natural language
function parseFridgeItemsFromText(text: string): FridgeItem[] {
  const items: FridgeItem[] = [];
  const now = new Date();
  
  // Common patterns for quantities and units
  const patterns = [
    // "2 kg chicken", "500g beef", "3 eggs"
    /(\d+(?:\.\d+)?)\s*(kg|g|grams?|ml|l|liters?|pcs?|pieces?|packs?|bottles?|jars?|cans?)?\s+(?:of\s+)?([\w\s]+)/gi,
    // "chicken 2kg", "milk 1l"
    /([\w\s]+?)\s+(\d+(?:\.\d+)?)\s*(kg|g|grams?|ml|l|liters?|pcs?|pieces?|packs?|bottles?|jars?|cans?)/gi,
    // Simple comma separated items
    /([^,]+)/g
  ];

  const lines = text.split(/[,.\n]+/).map(s => s.trim()).filter(s => s.length > 0);
  
  for (const line of lines) {
    if (line.length < 2) continue;

    let quantity = 1;
    let unit = 'pcs';
    let productName = line.toLowerCase()
      .replace(/\d+\s*(kg|g|ml|l|pieces?|pcs?|packs?|bottles?|jars?|cans?)/gi, '')
      .replace(/(kg|g|ml|l|pieces?|pcs?|packs?|bottles?|jars?|cans?)\s*\d+/gi, '')
      .replace(/\d+/g, '')
      .replace(/\b(of|some|a few|few|little|bit of)\b/gi, '')
      .trim();

    // Extract quantity
    const qtyMatch = line.match(/(\d+(?:\.\d+)?)/);
    if (qtyMatch) {
      quantity = parseFloat(qtyMatch[1]);
    }

    // Extract unit
    const unitMatch = line.match(/\b(kg|g|grams?|ml|l|liters?|pcs?|pieces?|packs?|bottles?|jars?|cans?)\b/i);
    if (unitMatch) {
      unit = unitMatch[1].toLowerCase();
      if (unit === 'g' || unit === 'gram' || unit === 'grams') unit = 'g';
      if (unit === 'kg') unit = 'kg';
      if (unit === 'ml') unit = 'ml';
      if (unit === 'l' || unit === 'liter' || unit === 'liters') unit = 'l';
      if (unit === 'piece' || unit === 'pieces' || unit === 'pc' || unit === 'pcs') unit = 'pcs';
      if (unit === 'pack' || unit === 'packs') unit = 'pack';
      if (unit === 'bottle' || unit === 'bottles') unit = 'bottle';
      if (unit === 'jar' || unit === 'jars') unit = 'jar';
      if (unit === 'can' || unit === 'cans') unit = 'can';
    }

    // Clean up product name
    productName = productName
      .split(' ')
      .filter(w => w.length > 0 && !w.match(/^(of|and|with|some|the|a|an)$/i))
      .join(' ')
      .trim();

    if (productName.length > 0) {
      // Estimate expiration based on product type
      let daysUntilExpiry = 7;
      const perishables = ['milk', 'chicken', 'meat', 'beef', 'pork', 'fish', 'yogurt', 'cream', 'cheese'];
      const semiPerishables = ['eggs', 'butter', 'ham', 'sausage', 'bacon'];
      const fresh = ['tomato', 'lettuce', 'spinach', 'mushroom', 'berry', 'berries', 'strawberry'];
      const longLasting = ['rice', 'pasta', 'flour', 'sugar', 'salt', 'oil', 'vinegar', 'sauce', 'honey'];
      
      const lowerName = productName.toLowerCase();
      if (perishables.some(p => lowerName.includes(p))) daysUntilExpiry = 3;
      else if (semiPerishables.some(p => lowerName.includes(p))) daysUntilExpiry = 14;
      else if (fresh.some(p => lowerName.includes(p))) daysUntilExpiry = 5;
      else if (longLasting.some(p => lowerName.includes(p))) daysUntilExpiry = 365;

      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

      items.push({
        id: `fridge-${Date.now()}-${items.length}`,
        product_name: productName.charAt(0).toUpperCase() + productName.slice(1),
        quantity,
        unit,
        expiration_date: expiryDate.toISOString().split('T')[0],
        added_date: now.toISOString().split('T')[0],
      });
    }
  }

  return items;
}

export default function ChatInput({ language, onAddFridgeItems }: ChatInputProps) {
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
    error 
  } = useSpeechRecognition(language === 'pl' ? 'pl-PL' : language === 'es' ? 'es-ES' : language === 'de' ? 'de-DE' : 'en-US');

  // Update input when transcript changes
  if (transcript && !isListening) {
    setInputText(prev => prev ? `${prev} ${transcript}`.trim() : transcript);
    resetTranscript();
  }

  const handleToggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      toast.info(t('chat.listening') || 'Listening... Speak now!');
    }
  }, [isListening, startListening, stopListening, t]);

  const handleSubmit = useCallback(async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const items = parseFridgeItemsFromText(inputText);
    
    if (items.length > 0) {
      onAddFridgeItems(items);
      toast.success(`Added ${items.length} item(s) from your voice input!`);
      setInputText('');
    } else {
      toast.error('Could not detect any products. Try: "2 kg chicken, 6 eggs, 1l milk"');
    }

    setIsProcessing(false);
  }, [inputText, onAddFridgeItems]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="mb-5">
      {/* Hint text */}
      <p className="text-xs text-muted-foreground mb-2 text-center">
        {t('chat.hint')}
      </p>

      {/* Input container */}
      <div className="relative">
        <div className={`
          glass-card rounded-2xl p-1 flex items-center gap-2
          transition-all duration-300
          ${isListening ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''}
        `}>
          {/* Voice button */}
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

          {/* Text input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('chat.placeholder')}
            disabled={isProcessing}
            className="
              flex-1 bg-transparent border-none outline-none
              text-sm text-foreground placeholder:text-muted-foreground
              py-2 px-1
            "
          />

          {/* Send button */}
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

        {/* Listening indicator */}
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

      {/* Error message */}
      {error && (
        <p className="text-[10px] text-destructive mt-2 text-center">
          {error === 'not-allowed' ? 'Microphone access denied. Please allow microphone access in your browser settings.' : 
           error === 'no-speech' ? 'No speech detected. Please try again.' : 
           `Speech recognition error: ${error}`}
        </p>
      )}
    </div>
  );
}
