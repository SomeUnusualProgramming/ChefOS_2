import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from '@/hooks/useTranslation';
import { runAllAgents } from '@/agents/runAgents';
import BottomNav from '@/components/BottomNav';
import Dashboard from '@/components/Dashboard';
import FridgePage from '@/components/FridgePage';
import MealPlanPage from '@/components/MealPlanPage';
import ShoppingPage from '@/components/ShoppingPage';
import ProfilePage from '@/components/ProfilePage';
import { FridgeItem } from '@/types/chefos';
import { toast } from 'sonner';

const Index = () => {
  const [page, setPage] = useState('dashboard');
  const store = useAppStore();
  const { t } = useTranslation(store.language);

  // Auto-run agents when fridge or profile changes
  const prevFridgeLen = useRef(store.fridge.length);
  const prevProfileStr = useRef(JSON.stringify(store.profile));

  useEffect(() => {
    const profileStr = JSON.stringify(store.profile);
    const fridgeChanged = store.fridge.length !== prevFridgeLen.current;
    const profileChanged = profileStr !== prevProfileStr.current;

    if (fridgeChanged || profileChanged) {
      prevFridgeLen.current = store.fridge.length;
      prevProfileStr.current = profileStr;

      const result = runAllAgents(store.fridge, store.profile);
      store.clearSuggestions();
      result.suggestions.forEach(s => store.addSuggestion(s));
      store.setMeals(result.meals);
      store.setShoppingList(result.shoppingList);
      toast.success('Plan updated automatically!');
    }
  }, [store.fridge, store.profile]);

  const handleAddFridgeItems = useCallback((items: FridgeItem[]) => {
    items.forEach(item => store.addFridgeItem(item));
    toast.success(`Added ${items.length} item(s) to fridge!`);
  }, [store]);

  const navLabels = {
    dashboard: t('nav.dashboard'),
    fridge: t('nav.fridge'),
    meals: t('nav.meals'),
    shopping: t('nav.shopping'),
    profile: t('nav.profile'),
  };

  return (
    <div className="min-h-screen bg-background">
      {page === 'dashboard' && (
        <Dashboard
          language={store.language}
          suggestions={store.suggestions}
          meals={store.meals}
          shoppingList={store.shoppingList}
          fridge={store.fridge}
          onDismissSuggestion={store.dismissSuggestion}
          onAddFridgeItems={handleAddFridgeItems}
          onNavigate={setPage}
        />
      )}
      {page === 'fridge' && (
        <FridgePage
          fridge={store.fridge}
          language={store.language}
          onAdd={store.addFridgeItem}
          onRemove={store.removeFridgeItem}
        />
      )}
      {page === 'meals' && (
        <MealPlanPage meals={store.meals} language={store.language} />
      )}
      {page === 'shopping' && (
        <ShoppingPage
          items={store.shoppingList}
          language={store.language}
          onToggle={store.toggleShoppingItem}
          onAdd={store.addShoppingItem}
          onRemove={store.removeShoppingItem}
        />
      )}
      {page === 'profile' && (
        <ProfilePage
          profile={store.profile}
          language={store.language}
          onUpdateProfile={store.updateProfile}
          onSetLanguage={store.setLanguage}
        />
      )}
      <BottomNav active={page} onNavigate={setPage} labels={navLabels} />
    </div>
  );
};

export default Index;
