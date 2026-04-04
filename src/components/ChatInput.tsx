import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { Language, FridgeItem, Meal, ShoppingItem } from '@/types/chefos';
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

// Check if text looks like a valid product name (has vowels, reasonable length)
function looksLikeValidProduct(text: string): boolean {
  if (text.length < 3 || text.length > 50) return false;
  // Must contain at least one vowel (real words have vowels)
  const hasVowel = /[aeiouyąęóśłżźćń]/i.test(text);
  // Should not be just consonants or random letters
  const consonantRatio = (text.match(/[bcdfghjklmnpqrstvwxz]/gi) || []).length / text.length;
  return hasVowel && consonantRatio < 0.8;
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

    // Validate product name looks like a real word
    if (looksLikeValidProduct(productName)) {
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

// Extract quantity from text
function extractQuantity(text: string): { quantity: number; unit: string; cleanText: string } {
  let quantity = 1;
  let unit = 'pcs';
  let cleanText = text;

  const qtyMatch = text.match(/(\d+(?:\.\d+)?)\s*(kg|g|grams?|ml|l|liters?|pcs?|pieces?|packs?|bottles?|jars?|cans?|szt|porcji|gram|litry?)?/i);
  if (qtyMatch) {
    quantity = parseFloat(qtyMatch[1]);
    if (qtyMatch[2]) {
      unit = qtyMatch[2].toLowerCase();
      if (unit === 'g' || unit === 'gram' || unit === 'grams') unit = 'g';
      if (unit === 'kg') unit = 'kg';
      if (unit === 'ml') unit = 'ml';
      if (unit === 'l' || unit === 'liters' || unit === 'litry') unit = 'l';
      if (unit === 'piece' || unit === 'pieces' || unit === 'pc' || unit === 'pcs' || unit === 'szt') unit = 'pcs';
      if (unit === 'pack' || unit === 'packs') unit = 'pack';
      if (unit === 'bottle' || unit === 'bottles') unit = 'bottle';
      if (unit === 'jar' || unit === 'jars') unit = 'jar';
      if (unit === 'can' || unit === 'cans') unit = 'can';
      if (unit === 'porcji') unit = 'portion';
    }
    cleanText = text.replace(qtyMatch[0], '').trim();
  }

  cleanText = cleanText
    .replace(/\b(of|some|a few|few|little|bit of|kilogram|kilograms)\b/gi, '')
    .replace(/\d+/g, '')
    .trim();

  return { quantity, unit, cleanText };
}

// Parse meal from text
function parseMealFromText(text: string, existingMeals: Meal[]): Meal | null {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  let mealType: Meal['meal_type'] = 'lunch';
  const lowerText = text.toLowerCase();

  if (lowerText.match(/\b(sniadanie|śniadanie|breakfast|rano|poranek)\b/)) mealType = 'breakfast';
  else if (lowerText.match(/\b(lunch|obiad|dinner|kolacja|wieczorem)\b/)) mealType = 'dinner';
  else if (lowerText.match(/\b(przekąska|snack|przekaska)\b/)) mealType = 'snack';
  else if (lowerText.match(/\b(lunch|drugie śniadanie|drugie sniadanie)\b/)) mealType = 'lunch';

  let mealName = text
    .replace(/\b(dodaj|dodajcie|add|chcę|chce|zjeść|zjesc|na|dziś|dzis|dzisiaj|jutro|obiad|śniadanie|sniadanie|kolacja|lunch|przekąska|przekaska|snack|breakfast|dinner|lunch)\b/gi, '')
    .replace(/\d+\s*(kcal|kalorii|g|gram|protein|carbs|fat)/gi, '')
    .trim();

  const quotedMatch = text.match(/["']([^"']+)["']/);
  if (quotedMatch) mealName = quotedMatch[1];

  if (!mealName || !looksLikeValidProduct(mealName)) return null;

  let calories = 400;
  const calMatch = text.match(/(\d+)\s*(kcal|kalorii|cal)/i);
  if (calMatch) calories = parseInt(calMatch[1]);

  const ingredients: { product_name: string; quantity: number; unit: string }[] = [];
  const ingredientPatterns = [
    /z\s+([\w\s,]+)/i,
    /with\s+([\w\s,]+)/i,
    /składniki[:\s]+([\w\s,]+)/i,
    /ingredients[:\s]+([\w\s,]+)/i,
  ];

  for (const pattern of ingredientPatterns) {
    const match = text.match(pattern);
    if (match) {
      const parts = match[1].split(/[,\si]+/).filter(p => p.length > 2);
      parts.forEach(part => {
        ingredients.push({ product_name: part.trim(), quantity: 1, unit: 'portion' });
      });
      break;
    }
  }

  return {
    id: `meal-${Date.now()}`,
    day: todayStr,
    meal_type: mealType,
    name: mealName.charAt(0).toUpperCase() + mealName.slice(1),
    products: ingredients.length > 0 ? ingredients : [{ product_name: 'Generic ingredients', quantity: 1, unit: 'portion' }],
    calories,
    macros: { protein: Math.round(calories * 0.25 / 4), carbs: Math.round(calories * 0.5 / 4), fat: Math.round(calories * 0.25 / 9) },
  };
}

// Parse shopping item from text
function parseShoppingItemFromText(text: string): ShoppingItem | null {
  const { quantity, unit, cleanText } = extractQuantity(text);

  let productName = cleanText
    .replace(/\b(kup|kupić|dodaj|do|listy|zakupów|shopping|list|lista|kupie)\b/gi, '')
    .trim();

  if (!productName || !looksLikeValidProduct(productName)) return null;

  return {
    id: `shopping-${Date.now()}`,
    product_name: productName.charAt(0).toUpperCase() + productName.slice(1),
    quantity,
    unit,
    purchased: false,
  };
}

// Main parser - analyzes user intent and PROPOSES actions (does NOT execute)
function parseUserIntent(text: string, fridge: FridgeItem[], meals: Meal[], shoppingList: ShoppingItem[]): AIAction {
  const lowerText = text.toLowerCase();
  const proposedActions: ProposedAction[] = [];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Helper to generate unique IDs
  const generateId = (prefix: string, index: number) => `${prefix}-${Date.now()}-${index}`;

  // === INTENTION: EXPLICIT FRIDGE ADD ===
  const explicitFridgeKeywords = /\b(dodaj|dodajcie|mam|kupiłem|kupiłam|wpisz|wloz|włóż|wlozylam|wlozylem|dodac|dodać|add|bought|got|purchased|have|włożyłem|włożyłam)\b.*\b(do lodówki|do lodowki|lodówkę|lodowke|lodówki|lodowki|fridge|refrigerator)\b/;
  if (explicitFridgeKeywords.test(lowerText)) {
    const items = parseFridgeItemsFromText(text);
    items.forEach((item, idx) => {
      proposedActions.push({
        id: generateId('propose-fridge', idx),
        type: 'fridge_add',
        data: item,
        description: `Dodać "${item.product_name}" (${item.quantity} ${item.unit}) do lodówki`,
        icon: 'fridge'
      });
    });
  }

  // === INTENTION: EXPLICIT SHOPPING ADD ===
  const explicitShoppingKeywords = /\b(dodaj|dodajcie|wpisz|włóż|wloz|kup|kupić|kupic|buy|add|put|potrzebuję|potrzebuje|potrzebujemy|need|need to buy|idę do sklepu|ide do sklepu|w sklepie|zakupy)\b/;
  if (explicitShoppingKeywords.test(lowerText)) {
    // Extract products from shopping context
    const shoppingPatterns = [
      /(\d+(?:\.\d+)?)\s*(kg|g|szt|porcji|litry?)?\s+(?:wołowin[ęy]|kurczaka|ryżu|makaronu|mleka|chleba|jaj(?:ek|ka)|warzyw|owoców|mięsa|ryby)/gi,
      /(?:kupić|kupie|kup|chcę|chce)\s+(?:sobie\s+)?(.+?)(?:\s+(?:na|do|w|z)\s+|$)/i,
    ];

    const shoppingItems: ShoppingItem[] = [];

    // Look for "chcę na obiad wołowinę" pattern - extract the meal ingredient
    const mealIngredientMatch = lowerText.match(/(?:chcę|chce|zjem|zjeść|zjesc|na\s+(?:obiad|kolację|sniadanie|lunch))\s+(.+?)(?:\s+(?:z|na|do|i|a)\s+|$)/i);
    if (mealIngredientMatch && !explicitFridgeKeywords.test(lowerText)) {
      const ingredientText = mealIngredientMatch[1].trim();
      // Check if it's a valid product name
      if (looksLikeValidProduct(ingredientText) && ingredientText.length > 2) {
        const { quantity, unit, cleanText } = extractQuantity(ingredientText);
        const cleanProduct = cleanText
          .replace(/\b(chcę|chce|na|dziś|dzis|dzisiaj|jutro|obiad|kolację|kolacje|sniadanie|lunch|zjeść|zjesc)\b/gi, '')
          .trim();
        if (cleanProduct && looksLikeValidProduct(cleanProduct)) {
          shoppingItems.push({
            id: generateId('shopping', 0),
            product_name: cleanProduct.charAt(0).toUpperCase() + cleanProduct.slice(1),
            quantity: quantity,
            unit: unit,
            purchased: false,
          });
        }
      }
    }

    // Parse remaining text for shopping items
    const lines = text.split(/[,\.\n;]+/).map(s => s.trim()).filter(s => s.length > 2);
    for (const line of lines) {
      const item = parseShoppingItemFromText(line);
      if (item && !shoppingItems.some(si => si.product_name.toLowerCase() === item.product_name.toLowerCase())) {
        shoppingItems.push(item);
      }
    }

    shoppingItems.forEach((item, idx) => {
      proposedActions.push({
        id: generateId('propose-shopping', idx),
        type: 'shopping_add',
        data: item,
        description: `Dodać "${item.product_name}" (${item.quantity} ${item.unit}) do listy zakupów`,
        icon: 'shopping'
      });
    });

    // If shopping items detected and no explicit fridge add, also propose meal planning
    if (shoppingItems.length > 0) {
      const mealTypeMatch = lowerText.match(/\b(obiad|kolacja|kolację|sniadanie|śniadanie|lunch|przekąska)\b/);
      const mealType: Meal['meal_type'] = mealTypeMatch
        ? mealTypeMatch[1].includes('śniadanie') || mealTypeMatch[1].includes('sniadanie') ? 'breakfast'
        : mealTypeMatch[1].includes('lunch') ? 'lunch'
        : mealTypeMatch[1].includes('kolacja') || mealTypeMatch[1].includes('kolacj') ? 'dinner'
        : mealTypeMatch[1].includes('przekąska') ? 'snack'
        : 'dinner'
        : 'dinner';

      const mainIngredient = shoppingItems[0];
      const mealName = `${mainIngredient.product_name} na ${mealType === 'breakfast' ? 'śniadanie' : mealType === 'lunch' ? 'lunch' : mealType === 'dinner' ? 'kolację' : 'przekąskę'}`;

      proposedActions.push({
        id: generateId('propose-meal', 0),
        type: 'meal_add',
        data: {
          id: generateId('meal', 0),
          day: todayStr,
          meal_type: mealType,
          name: mealName,
          products: shoppingItems.map(si => ({ product_name: si.product_name, quantity: si.quantity, unit: si.unit })),
          calories: 500,
          macros: { protein: 30, carbs: 50, fat: 20 }
        } as Meal,
        description: `Zaplanować "${mealName}"`,
        icon: 'meal'
      });
    }
  }

  // === INTENTION: MEAL PLANNING (without shopping) ===
  const mealKeywords = /\b(zaplanuj|zrob|zrób|plan|schedule|make|create|chcę zjeść|chce zjesc|jem|obiad|kolacja|śniadanie|sniadanie)\b/;
  if (mealKeywords.test(lowerText) && proposedActions.length === 0) {
    const meal = parseMealFromText(text, meals);
    if (meal) {
      proposedActions.push({
        id: generateId('propose-meal', 0),
        type: 'meal_add',
        data: meal,
        description: `Zaplanować posiłek: "${meal.name}" (${meal.meal_type}, ${meal.calories} kcal)`,
        icon: 'meal'
      });
    }
  }

  // === INTENTION: MEAL REMOVE ===
  const removeMealKeywords = /\b(usuń|usun|odwołaj|odwolaj|cancel|remove|delete|nie chcę|nie chce|rezygnuję|skip)\b.*\b(posiłek|posilek|obiad|kolacji|meal)\b/;
  if (removeMealKeywords.test(lowerText)) {
    const mealMatch = lowerText.match(/(?:usuń|usun|odwołaj|odwolaj|cancel|remove|nie chcę|nie chce|skip)\s+(?:z\s+planu\s+)?(?:posiłku|posilku|obiadu|obiad|kolacji|kolacja|meal\s+)?["']?(.+?)["']?$/i);
    if (mealMatch) {
      const mealName = mealMatch[1].trim().toLowerCase();
      const matchingMeal = meals.find(m => m.name.toLowerCase().includes(mealName) || mealName.includes(m.name.toLowerCase()));
      if (matchingMeal) {
        proposedActions.push({
          id: generateId('propose-remove-meal', 0),
          type: 'meal_remove',
          data: { mealId: matchingMeal.id },
          description: `Usunąć z planu: "${matchingMeal.name}"`,
          icon: 'meal'
        });
      }
    }
  }

  // === INTENTION: REMOVE FROM SHOPPING LIST ===
  const removeShoppingKeywords = /\b(kupiłem|kupilem|kupiłam|kupilam|mam już|mam juz|already have|bought|got|skreśl|skresl)\b/;
  if (removeShoppingKeywords.test(lowerText)) {
    const productMatch = lowerText.match(/(?:kupiłem|kupilem|kupiłam|kupilam|mam już|mam juz|already have|bought|got)\s+(?:już\s+)?["']?(.+?)["']?$/i);
    if (productMatch) {
      const productName = productMatch[1].trim().toLowerCase();
      const matchingItem = shoppingList.find(s => s.product_name.toLowerCase().includes(productName) || productName.includes(s.product_name.toLowerCase()));
      if (matchingItem) {
        proposedActions.push({
          id: generateId('propose-remove-shopping', 0),
          type: 'shopping_remove',
          data: { itemId: matchingItem.id },
          description: `Usunąć z listy zakupów: "${matchingItem.product_name}"`,
          icon: 'shopping'
        });
      }
    }
  }

  // === DEFAULT: If no explicit intent but text contains valid products, propose shopping ===
  if (proposedActions.length === 0) {
    const items = parseFridgeItemsFromText(text);
    if (items.length > 0) {
      // Ask user what they want to do with these items
      items.forEach((item, idx) => {
        proposedActions.push({
          id: generateId('propose-shopping', idx),
          type: 'shopping_add',
          data: {
            id: generateId('shopping', idx),
            product_name: item.product_name,
            quantity: item.quantity,
            unit: item.unit,
            purchased: false
          } as ShoppingItem,
          description: `Dodać "${item.product_name}" (${item.quantity} ${item.unit}) do listy zakupów`,
          icon: 'shopping'
        });
      });
    }
  }

  // Return proposals if any found
  if (proposedActions.length > 0) {
    return {
      type: 'propose',
      data: proposedActions,
      message: `Znaleziono ${proposedActions.length} propozycji. Wybierz, które chcesz zatwierdzić:`
    };
  }

  return { type: 'unknown', message: 'Nie rozumiem. Spróbuj: "Idę do sklepu, chcę kupić wołowinę na obiad" lub "Zaplanuj obiad z kurczakiem"' };
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
    error 
  } = useSpeechRecognition(language === 'pl' ? 'pl-PL' : language === 'es' ? 'es-ES' : language === 'de' ? 'de-DE' : 'en-US');

  const handleToggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      toast.info(t('chat.listening') || 'Listening... Speak now!');
    }
  }, [isListening, startListening, stopListening, t]);

  // Handle transcript updates in useEffect instead of during render
  useEffect(() => {
    if (transcript && !isListening) {
      setInputText(prev => prev ? `${prev} ${transcript}`.trim() : transcript);
      resetTranscript();
    }
  }, [transcript, isListening, resetTranscript]);

  const handleSubmit = useCallback(async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const action = parseUserIntent(inputText, fridge, meals, shoppingList);

    if (action.type !== 'unknown') {
      onAIAction(action);
      toast.success(action.message);
      setInputText('');
    } else {
      toast.error(action.message);
    }

    setIsProcessing(false);
  }, [inputText, onAIAction, fridge, meals, shoppingList]);

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
        {t('chat.hint') || 'Wpisz komendę lub użyj głosu'}
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
            placeholder={t('chat.placeholder') || 'Napisz do AI... np. "dodaj kurczaka do lodówki"'}
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

      {/* Quick hints */}
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
