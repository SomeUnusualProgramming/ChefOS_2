import { Language, AISuggestion, Meal, ShoppingItem, FridgeItem } from '@/types/chefos';
import { useTranslation } from '@/hooks/useTranslation';
import SuggestionCard from './SuggestionCard';
import ChatInput from './ChatInput';
import ProposedActions from './ProposedActions';
import { Flame, ShoppingCart, Refrigerator } from 'lucide-react';
import type { AIAction, ProposedAction } from './ChatInput';

interface DashboardProps {
  language: Language;
  suggestions: AISuggestion[];
  meals: Meal[];
  shoppingList: ShoppingItem[];
  fridge: FridgeItem[];
  proposedActions: ProposedAction[];
  onDismissSuggestion: (id: string) => void;
  onAIAction: (action: AIAction) => void;
  onNavigate: (page: string) => void;
  onApproveAction: (action: ProposedAction) => void;
  onDismissAction: (actionId: string) => void;
  onApproveAllActions: () => void;
  onDismissAllActions: () => void;
  onAddFridgeItems?: (items: FridgeItem[]) => void;
}

export default function Dashboard({
  language, suggestions, meals, shoppingList, fridge, proposedActions,
  onDismissSuggestion, onAIAction, onNavigate, onApproveAction,
  onDismissAction, onApproveAllActions, onDismissAllActions, onAddFridgeItems,
}: DashboardProps) {
  const { t } = useTranslation(language);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayMeals = meals.filter(m => m.day === todayStr);
  const todayCalories = todayMeals.reduce((s, m) => s + m.calories, 0);
  const pendingItems = shoppingList.filter(i => !i.purchased).length;
  const activeSuggestions = suggestions.filter(s => !s.dismissed && s.agent !== 'coach');
  const coachTips = suggestions.filter(s => !s.dismissed && s.agent === 'coach');
  const expiringCount = fridge.filter(f => {
    const days = Math.ceil((new Date(f.expiration_date).getTime() - Date.now()) / 86400000);
    return days <= 2 && days >= 0;
  }).length;

  return (
    <div className="p-4 pb-20 max-w-lg mx-auto animate-fade-in">
      <div className="mb-5">
        <h1 className="text-lg font-bold text-foreground">{t('dashboard.greeting')}</h1>
        <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Chat / voice input */}
      <ChatInput
        language={language}
        onAIAction={onAIAction}
        fridge={fridge}
        meals={meals}
        shoppingList={shoppingList}
        onAddFridgeItems={onAddFridgeItems}
      />

      {/* Proposed Actions from AI */}
      <ProposedActions
        actions={proposedActions}
        onApprove={onApproveAction}
        onDismiss={onDismissAction}
        onApproveAll={onApproveAllActions}
        onDismissAll={onDismissAllActions}
        approveLabel={t('common.approve') || 'Tak'}
        dismissLabel={t('common.dismiss') || 'Nie'}
        approveAllLabel={t('common.approveAll') || 'Wszystkie'}
        dismissAllLabel={t('common.dismissAll') || 'Odrzuć wszystkie'}
      />

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <button onClick={() => onNavigate('fridge')} className="glass-card rounded-xl p-3 text-center">
          <Refrigerator size={18} className="mx-auto text-primary mb-1" />
          <p className="text-lg font-bold text-foreground">{fridge.length}</p>
          <p className="text-[10px] text-muted-foreground">{t('nav.fridge')}</p>
          {expiringCount > 0 && <p className="text-[10px] text-warning font-medium">{expiringCount} ⚠️</p>}
        </button>
        <button onClick={() => onNavigate('meals')} className="glass-card rounded-xl p-3 text-center">
          <Flame size={18} className="mx-auto text-accent mb-1" />
          <p className="text-lg font-bold text-foreground">{todayCalories}</p>
          <p className="text-[10px] text-muted-foreground">{t('common.kcal')}</p>
        </button>
        <button onClick={() => onNavigate('shopping')} className="glass-card rounded-xl p-3 text-center">
          <ShoppingCart size={18} className="mx-auto text-info mb-1" />
          <p className="text-lg font-bold text-foreground">{pendingItems}</p>
          <p className="text-[10px] text-muted-foreground">{t('common.items')}</p>
        </button>
      </div>

      {/* AI Suggestions (without coach tips) */}
      {activeSuggestions.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-foreground mb-2">{t('dashboard.suggestions')}</h2>
          <div className="space-y-2">
            {activeSuggestions.slice(0, 5).map(s => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onDismiss={onDismissSuggestion}
                approveLabel={t('common.approve')}
                dismissLabel={t('common.dismiss')}
              />
            ))}
          </div>
        </div>
      )}

      {/* Coach Tips - separate section */}
      {coachTips.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-accent mb-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            {t('dashboard.coachTips')}
          </h2>
          <div className="space-y-2">
            {coachTips.slice(0, 3).map(s => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onDismiss={onDismissSuggestion}
                approveLabel={t('common.approve')}
                dismissLabel={t('common.dismiss')}
              />
            ))}
          </div>
        </div>
      )}

      {/* Today's meals */}
      {todayMeals.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-foreground mb-2">{t('dashboard.todaysMeals')}</h2>
          <div className="glass-card rounded-xl p-3 space-y-2">
            {todayMeals.map(m => (
              <div key={m.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium capitalize">{m.meal_type}</span>
                  <span className="text-sm text-foreground">{m.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{m.calories} kcal</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
