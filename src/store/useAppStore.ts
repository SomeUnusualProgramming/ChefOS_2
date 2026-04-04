import { useState, useCallback, useEffect } from 'react';
import { AppState, FridgeItem, Meal, ShoppingItem, UserProfile, AISuggestion, Language } from '@/types/chefos';

const STORAGE_KEY = 'chefos_data';

const defaultState: AppState = {
  fridge: [],
  meals: [],
  shoppingList: [],
  profile: {},
  suggestions: [],
  language: 'en',
};

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultState, ...JSON.parse(raw) };
  } catch {}
  return defaultState;
}

function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useAppStore() {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => { saveState(state); }, [state]);

  const setLanguage = useCallback((language: Language) => {
    setState(s => ({ ...s, language }));
  }, []);

  const addFridgeItem = useCallback((item: FridgeItem) => {
    setState(s => ({ ...s, fridge: [...s.fridge, item] }));
  }, []);

  const removeFridgeItem = useCallback((id: string) => {
    setState(s => ({ ...s, fridge: s.fridge.filter(i => i.id !== id) }));
  }, []);

  const updateFridgeItem = useCallback((id: string, updates: Partial<FridgeItem>) => {
    setState(s => ({ ...s, fridge: s.fridge.map(i => i.id === id ? { ...i, ...updates } : i) }));
  }, []);

  const addMeal = useCallback((meal: Meal) => {
    setState(s => ({ ...s, meals: [...s.meals, meal] }));
  }, []);

  const removeMeal = useCallback((id: string) => {
    setState(s => ({ ...s, meals: s.meals.filter(m => m.id !== id) }));
  }, []);

  const addShoppingItem = useCallback((item: ShoppingItem) => {
    setState(s => ({ ...s, shoppingList: [...s.shoppingList, item] }));
  }, []);

  const removeShoppingItem = useCallback((id: string) => {
    setState(s => ({ ...s, shoppingList: s.shoppingList.filter(i => i.id !== id) }));
  }, []);

  const toggleShoppingItem = useCallback((id: string) => {
    setState(s => ({
      ...s,
      shoppingList: s.shoppingList.map(i => i.id === id ? { ...i, purchased: !i.purchased } : i),
    }));
  }, []);

  const purchaseShoppingItem = useCallback((id: string, quantity?: number) => {
    setState(s => {
      const item = s.shoppingList.find(i => i.id === id);
      if (!item) return s;

      const finalQuantity = quantity ?? item.quantity;
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);

      const fridgeItem: FridgeItem = {
        id: Math.random().toString(36).slice(2, 10),
        product_name: item.product_name,
        quantity: finalQuantity,
        unit: item.unit,
        expiration_date: expirationDate.toISOString().split('T')[0],
        added_date: new Date().toISOString().split('T')[0],
      };

      return {
        ...s,
        fridge: [...s.fridge, fridgeItem],
        shoppingList: s.shoppingList.map(i =>
          i.id === id ? { ...i, purchased: true, quantity: finalQuantity } : i
        ),
      };
    });
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setState(s => ({ ...s, profile: { ...s.profile, ...updates } }));
  }, []);

  const addSuggestion = useCallback((suggestion: AISuggestion) => {
    setState(s => ({ ...s, suggestions: [suggestion, ...s.suggestions] }));
  }, []);

  const dismissSuggestion = useCallback((id: string) => {
    setState(s => ({
      ...s,
      suggestions: s.suggestions.map(sg => sg.id === id ? { ...sg, dismissed: true } : sg),
    }));
  }, []);

  const clearSuggestions = useCallback(() => {
    setState(s => ({ ...s, suggestions: [] }));
  }, []);

  const setMeals = useCallback((meals: Meal[]) => {
    setState(s => ({ ...s, meals }));
  }, []);

  const setShoppingList = useCallback((shoppingList: ShoppingItem[]) => {
    setState(s => ({ ...s, shoppingList }));
  }, []);

  const resetData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(defaultState);
  }, []);

  return {
    ...state,
    setLanguage,
    addFridgeItem,
    removeFridgeItem,
    updateFridgeItem,
    addMeal,
    removeMeal,
    addShoppingItem,
    removeShoppingItem,
    toggleShoppingItem,
    purchaseShoppingItem,
    updateProfile,
    addSuggestion,
    dismissSuggestion,
    clearSuggestions,
    setMeals,
    setShoppingList,
    resetData,
  };
}
