import { FridgeItem, Meal, ShoppingItem, AISuggestion, UserProfile, Language } from '@/types/chefos';
import { API_BASE_URL } from '@/config/api';

export interface FridgeCleanupSuggestion {
  item: FridgeItem;
  issues: ('unknown_product' | 'suspicious_name' | 'no_category' | 'typo')[];
  suggestedName?: string;
  suggestedCategory?: string;
  confidence: number;
  action: 'review' | 'delete' | 'ignore';
}

export interface RunAgentsResult {
  suggestions: AISuggestion[];
  meals: Meal[];
  shoppingList: ShoppingItem[];
  cleanupItems: FridgeCleanupSuggestion[];
}

export async function runAllAgents(
  fridge: FridgeItem[],
  profile: UserProfile,
  language: Language,
): Promise<RunAgentsResult> {
  const response = await fetch(`${API_BASE_URL}/api/agents/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fridge, profile, language }),
  });

  if (!response.ok) {
    throw new Error('Failed to run backend agents');
  }

  return response.json() as Promise<RunAgentsResult>;
}
