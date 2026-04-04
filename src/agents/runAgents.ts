import { FridgeItem, Meal, ShoppingItem, AISuggestion, UserProfile } from '@/types/chefos';
import { isSuspiciousProductName, findBestProductMatch, getCategoryIcon, isKnownProduct, ParsedProduct } from '@/data/productDatabase';
import { Apple } from 'lucide-react';

function uid() { return Math.random().toString(36).slice(2, 10); }
function today() { return new Date().toISOString().split('T')[0]; }

function getDaysUntilExpiry(item: FridgeItem): number {
  const exp = new Date(item.expiration_date);
  const now = new Date();
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// FridgeAgent: check freshness, suggest usage
function runFridgeAgent(fridge: FridgeItem[]): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const now = new Date().toISOString();

  if (fridge.length === 0) {
    suggestions.push({
      id: uid(), agent: 'fridge', type: 'action',
      message: 'Your fridge is empty! Add some products to get started with meal planning.',
      dismissed: false, timestamp: now,
    });
    return suggestions;
  }

  for (const item of fridge) {
    const days = getDaysUntilExpiry(item);
    if (days < 0) {
      suggestions.push({
        id: uid(), agent: 'fridge', type: 'warning',
        message: `⚠️ ${item.product_name} has expired! Consider removing it.`,
        dismissed: false, timestamp: now,
      });
    } else if (days <= 2) {
      suggestions.push({
        id: uid(), agent: 'fridge', type: 'warning',
        message: `🕐 ${item.product_name} expires in ${days} day(s). Use it soon!`,
        dismissed: false, timestamp: now,
      });
    }
  }

  if (fridge.length > 3) {
    const names = fridge.slice(0, 3).map(i => i.product_name).join(', ');
    suggestions.push({
      id: uid(), agent: 'fridge', type: 'info',
      message: `You have ${fridge.length} products including ${names}. Ready for meal planning!`,
      dismissed: false, timestamp: now,
    });
  }

  return suggestions;
}

// FridgeCleanupAgent: detect and suggest fixes for problematic fridge items
export interface FridgeCleanupSuggestion {
  item: FridgeItem;
  issues: ('unknown_product' | 'suspicious_name' | 'no_category' | 'typo')[ ];
  suggestedName?: string;
  suggestedCategory?: string;
  confidence: number;
  action: 'review' | 'delete' | 'ignore';
}

function runFridgeCleanupAgent(fridge: FridgeItem[]): { suggestions: AISuggestion[]; cleanupItems: FridgeCleanupSuggestion[] } {
  const suggestions: AISuggestion[] = [];
  const cleanupItems: FridgeCleanupSuggestion[] = [];
  const now = new Date().toISOString();

  for (const item of fridge) {
    const issues: ('unknown_product' | 'suspicious_name' | 'no_category' | 'typo')[] = [];
    let suggestedName: string | undefined;
    let suggestedCategory: string | undefined;
    let confidence = 1;
    let action: 'review' | 'delete' | 'ignore' = 'ignore';

    // Check 1: Suspicious name patterns (commands, gibberish)
    const suspicious = isSuspiciousProductName(item.product_name);
    if (!suspicious.isValid) {
      issues.push('suspicious_name');
      action = 'delete';
      confidence = 0;
    }

    // Check 2: Unknown product (not in database)
    if (!isKnownProduct(item.product_name)) {
      issues.push('unknown_product');
      action = action === 'delete' ? 'delete' : 'review';
      confidence = 0;

      // Try to find best match for suggestion
      const match = findBestProductMatch(item.product_name, 0.6);
      if (match) {
        suggestedName = match.product.pl;
        suggestedCategory = match.product.category;
        confidence = match.confidence;
        if (match.isTypo) {
          issues.push('typo');
        }
      }
    }

    // Check 3: No category or "other" category
    if (!item.category || item.category === 'other') {
      issues.push('no_category');
      if (action === 'ignore') action = 'review';

      // Suggest category if we have a match
      if (!suggestedCategory) {
        const match = findBestProductMatch(item.product_name, 0.5);
        if (match) {
          suggestedCategory = match.product.category;
          suggestedName = suggestedName || match.product.pl;
        }
      }
    }

    // Only add to cleanup if there are issues
    if (issues.length > 0) {
      cleanupItems.push({
        item,
        issues,
        suggestedName,
        suggestedCategory,
        confidence,
        action
      });
    }
  }

  // Create AI suggestions for cleanup
  if (cleanupItems.length > 0) {
    const criticalCount = cleanupItems.filter(c => c.action === 'delete').length;
    const reviewCount = cleanupItems.filter(c => c.action === 'review').length;

    if (criticalCount > 0) {
      suggestions.push({
        id: uid(),
        agent: 'fridge_cleanup',
        type: 'warning',
        message: `🧹 Znaleziono ${criticalCount} produktów wymagających usunięcia (podejrzane nazwy/komendy). Kliknij aby posprzątać lodówkę.`,
        dismissed: false,
        timestamp: now,
        action: 'cleanup',
        data: { cleanupItems: cleanupItems.filter(c => c.action === 'delete') }
      });
    }

    if (reviewCount > 0) {
      suggestions.push({
        id: uid(),
        agent: 'fridge_cleanup',
        type: 'action',
        message: `📝 ${reviewCount} produktów w lodówce wymaga uwagi (brak kategorii/nieznane produkty). Kliknij aby przejrzeć.`,
        dismissed: false,
        timestamp: now,
        action: 'review',
        data: { cleanupItems: cleanupItems.filter(c => c.action === 'review') }
      });
    }
  }

  return { suggestions, cleanupItems };
}

// ChefAgent: generate meal suggestions
const MEAL_TEMPLATES = [
  { name: 'Grilled Chicken Salad', type: 'lunch' as const, cal: 450, p: 35, c: 20, f: 25, products: ['chicken breast', 'lettuce', 'tomato', 'olive oil'] },
  { name: 'Oatmeal with Berries', type: 'breakfast' as const, cal: 320, p: 10, c: 55, f: 8, products: ['oats', 'berries', 'milk', 'honey'] },
  { name: 'Salmon with Rice', type: 'dinner' as const, cal: 550, p: 40, c: 45, f: 18, products: ['salmon', 'rice', 'broccoli', 'lemon'] },
  { name: 'Greek Yogurt Bowl', type: 'breakfast' as const, cal: 280, p: 20, c: 30, f: 10, products: ['yogurt', 'granola', 'banana', 'honey'] },
  { name: 'Pasta Primavera', type: 'dinner' as const, cal: 480, p: 15, c: 65, f: 16, products: ['pasta', 'bell pepper', 'zucchini', 'parmesan'] },
  { name: 'Turkey Wrap', type: 'lunch' as const, cal: 400, p: 30, c: 35, f: 14, products: ['turkey', 'tortilla', 'avocado', 'lettuce'] },
  { name: 'Protein Smoothie', type: 'snack' as const, cal: 250, p: 25, c: 30, f: 5, products: ['protein powder', 'banana', 'milk'] },
  { name: 'Stir-fry Vegetables with Tofu', type: 'dinner' as const, cal: 380, p: 20, c: 35, f: 18, products: ['tofu', 'broccoli', 'carrot', 'soy sauce'] },
];

function runChefAgent(fridge: FridgeItem[], profile: UserProfile): { meals: Meal[]; suggestions: AISuggestion[] } {
  const suggestions: AISuggestion[] = [];
  const now = new Date().toISOString();
  const meals: Meal[] = [];

  const fridgeNames = new Set(fridge.map(f => f.product_name.toLowerCase()));

  // Generate 7-day plan
  for (let d = 0; d < 7; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d);
    const dayStr = date.toISOString().split('T')[0];

    for (const mealType of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
      const templates = MEAL_TEMPLATES.filter(t => t.type === mealType);
      if (templates.length === 0) continue;
      const tmpl = templates[(d + mealType.length) % templates.length];

      meals.push({
        id: uid(),
        day: dayStr,
        meal_type: mealType,
        name: tmpl.name,
        products: tmpl.products.map(p => ({ product_name: p, quantity: 1, unit: 'portion' })),
        calories: tmpl.cal,
        macros: { protein: tmpl.p, carbs: tmpl.c, fat: tmpl.f },
      });
    }
  }

  // Check which meal products are available
  const usedProducts = new Set<string>();
  meals.forEach(m => m.products.forEach(p => {
    if (fridgeNames.has(p.product_name.toLowerCase())) usedProducts.add(p.product_name);
  }));

  if (usedProducts.size > 0) {
    suggestions.push({
      id: uid(), agent: 'chef', type: 'info',
      message: `🍳 Created a 7-day meal plan using ${usedProducts.size} products from your fridge!`,
      dismissed: false, timestamp: now,
    });
  } else {
    suggestions.push({
      id: uid(), agent: 'chef', type: 'info',
      message: '🍳 Generated a balanced 7-day meal plan. Add fridge products to personalize it!',
      dismissed: false, timestamp: now,
    });
  }

  if (!profile.goals?.length) {
    suggestions.push({
      id: uid(), agent: 'chef', type: 'action',
      message: '📋 Set your health goals in Profile to get personalized meal plans.',
      dismissed: false, timestamp: now,
    });
  }

  return { meals, suggestions };
}

// ShoppingAgent: create shopping list from meal plan vs fridge
function runShoppingAgent(meals: Meal[], fridge: FridgeItem[]): { items: ShoppingItem[]; suggestions: AISuggestion[] } {
  const suggestions: AISuggestion[] = [];
  const now = new Date().toISOString();
  const fridgeMap = new Map<string, number>();

  fridge.forEach(f => {
    const key = f.product_name.toLowerCase();
    fridgeMap.set(key, (fridgeMap.get(key) || 0) + f.quantity);
  });

  const needed = new Map<string, { qty: number; meals: string[] }>();

  meals.forEach(m => {
    m.products.forEach(p => {
      const key = p.product_name.toLowerCase();
      const existing = needed.get(key) || { qty: 0, meals: [] };
      existing.qty += p.quantity;
      if (!existing.meals.includes(m.name)) existing.meals.push(m.name);
      needed.set(key, existing);
    });
  });

  const items: ShoppingItem[] = [];

  needed.forEach((val, key) => {
    const inFridge = fridgeMap.get(key) || 0;
    const toBuy = val.qty - inFridge;
    if (toBuy > 0) {
      items.push({
        id: uid(),
        product_name: key.charAt(0).toUpperCase() + key.slice(1),
        quantity: toBuy,
        unit: 'portion',
        meal_association: val.meals.join(', '),
        purchased: false,
      });
    }
  });

  suggestions.push({
    id: uid(), agent: 'shopping', type: 'info',
    message: `🛒 Shopping list updated: ${items.length} items needed for your meal plan.`,
    dismissed: false, timestamp: now,
  });

  return { items, suggestions };
}

// CoachAgent: health and training tips
function runCoachAgent(profile: UserProfile): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const now = new Date().toISOString();

  if (!profile.weight || !profile.height) {
    suggestions.push({
      id: uid(), agent: 'coach', type: 'action',
      message: '💪 Enter your weight and height in Profile to get personalized fitness advice.',
      dismissed: false, timestamp: now,
    });
    return suggestions;
  }

  const bmi = profile.weight / ((profile.height / 100) ** 2);

  suggestions.push({
    id: uid(), agent: 'coach', type: 'info',
    message: `📊 Your BMI is ${bmi.toFixed(1)}. ${bmi < 18.5 ? 'Consider increasing caloric intake.' : bmi < 25 ? 'Great! You\'re in a healthy range.' : bmi < 30 ? 'Consider moderate exercise and balanced meals.' : 'Focus on nutrition and regular activity.'}`,
    dismissed: false, timestamp: now,
  });

  const tips = [
    '💧 Stay hydrated! Aim for 2-3 liters of water daily.',
    '🏃 Try 30 minutes of moderate exercise today.',
    '🥗 Include at least 5 servings of fruits and vegetables daily.',
    '😴 Get 7-9 hours of sleep for optimal recovery.',
    '🧘 Consider adding 10 minutes of stretching to your routine.',
    '💊 Consider vitamin D and omega-3 supplements if not getting enough from food.',
  ];

  const tipIndex = new Date().getDay();
  suggestions.push({
    id: uid(), agent: 'coach', type: 'tip',
    message: tips[tipIndex % tips.length],
    dismissed: false, timestamp: now,
  });

  return suggestions;
}

export function runAllAgents(
  fridge: FridgeItem[],
  profile: UserProfile,
): {
  suggestions: AISuggestion[];
  meals: Meal[];
  shoppingList: ShoppingItem[];
  cleanupItems: FridgeCleanupSuggestion[];
} {
  const fridgeSuggestions = runFridgeAgent(fridge);
  const { suggestions: cleanupSuggestions, cleanupItems } = runFridgeCleanupAgent(fridge);
  const { meals, suggestions: chefSuggestions } = runChefAgent(fridge, profile);
  const { items: shoppingList, suggestions: shoppingSuggestions } = runShoppingAgent(meals, fridge);
  const coachSuggestions = runCoachAgent(profile);

  return {
    suggestions: [...fridgeSuggestions, ...cleanupSuggestions, ...chefSuggestions, ...shoppingSuggestions, ...coachSuggestions],
    meals,
    shoppingList,
    cleanupItems,
  };
}
