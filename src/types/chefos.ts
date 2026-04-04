export interface FridgeItem {
  id: string;
  product_name: string;
  quantity: number;
  unit: string;
  expiration_date: string;
  nutrients?: { calories?: number; protein?: number; carbs?: number; fat?: number };
  added_date: string;
  category?: ProductCategory;
}

export interface Meal {
  id: string;
  day: string; // ISO date
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  products: { product_name: string; quantity: number; unit: string }[];
  calories: number;
  macros: { protein: number; carbs: number; fat: number };
}

export interface ShoppingItem {
  id: string;
  product_name: string;
  quantity: number;
  unit: string;
  meal_association?: string;
  purchased: boolean;
  category?: ProductCategory;
}

export type ProductCategory =
  | 'dairy'
  | 'meat'
  | 'fish'
  | 'vegetables'
  | 'fruits'
  | 'grains'
  | 'beverages'
  | 'condiments'
  | 'snacks'
  | 'frozen'
  | 'other';

export interface UserProfile {
  weight?: number;
  height?: number;
  bmi?: number;
  goals?: string[];
  preferences?: string[];
  allergies?: string[];
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface AISuggestion {
  id: string;
  agent: 'fridge' | 'chef' | 'shopping' | 'coach' | 'fridge_cleanup';
  type: 'info' | 'warning' | 'action' | 'tip';
  message: string;
  action?: string;
  data?: unknown;
  dismissed: boolean;
  timestamp: string;
}

export type Language = 'en' | 'pl' | 'es' | 'de';

export interface AppState {
  fridge: FridgeItem[];
  meals: Meal[];
  shoppingList: ShoppingItem[];
  profile: UserProfile;
  suggestions: AISuggestion[];
  language: Language;
}
