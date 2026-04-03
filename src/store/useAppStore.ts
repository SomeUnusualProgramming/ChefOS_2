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
    updateProfile,
    addSuggestion,
    dismissSuggestion,
    clearSuggestions,
    setMeals,
    setShoppingList,
  };
}
