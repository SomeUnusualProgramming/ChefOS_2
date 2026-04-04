import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from '@/hooks/useTranslation';
import { runAllAgents, FridgeCleanupSuggestion } from '@/agents/runAgents';
import { API_BASE_URL } from '@/config/api';
import BottomNav from '@/components/BottomNav';
import Dashboard from '@/components/Dashboard';
import FridgePage from '@/components/FridgePage';
import MealPlanPage from '@/components/MealPlanPage';
import ShoppingPage from '@/components/ShoppingPage';
import ProfilePage from '@/components/ProfilePage';
import type { AIAction, ProposedAction } from '@/components/ChatInput';
import type { Meal, ShoppingItem, FridgeItem } from '@/types/chefos';
import { toast } from 'sonner';

// Health check and background monitoring intervals (ms)
const HEALTH_CHECK_INTERVAL = 30000; // 30s
const ACTIVE_MONITORING_INTERVAL = 120000; // 2min - active AI monitoring

const Index = () => {
  const [page, setPage] = useState('dashboard');
  const [proposedActions, setProposedActions] = useState<ProposedAction[]>([]);
  const [cleanupItems, setCleanupItems] = useState<FridgeCleanupSuggestion[]>([]);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const store = useAppStore();
  const { t } = useTranslation(store.language);

  // Health check for backend connection
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
        }).catch(() => null);
        const isConnected = response !== null && response.ok;
        if (backendConnected === false && isConnected) {
          toast.success('Połączono z backendem AI');
        }
        setBackendConnected(isConnected);
      } catch {
        setBackendConnected(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, HEALTH_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [backendConnected]);

  // Auto-run agents when fridge or profile changes
  const prevFridgeLen = useRef(store.fridge.length);
  const prevProfileStr = useRef(JSON.stringify(store.profile));
  const lastRunTime = useRef<number>(0);

  const runAgentsWithFallback = useCallback(async (isBackground = false) => {
    // Skip if backend not connected and not first run
    if (backendConnected === false && isBackground) {
      return;
    }

    try {
      const result = await runAllAgents(store.fridge, store.profile, store.language);
      store.clearSuggestions();
      result.suggestions.forEach(s => store.addSuggestion(s));
      store.setMeals(result.meals);
      store.setShoppingList(result.shoppingList);
      setCleanupItems(result.cleanupItems);
      if (!isBackground) {
        toast.success('Plan updated automatically!');
      }
      setBackendConnected(true);
      lastRunTime.current = Date.now();
    } catch (error) {
      console.error(error);
      setBackendConnected(false);
      if (!isBackground) {
        toast.error('Nie udało się uruchomić agentów backendowych - upewnij się że backend działa (docker-compose up -d)');
      }
    }
  }, [store, backendConnected]);

  useEffect(() => {
    const profileStr = JSON.stringify(store.profile);
    const fridgeChanged = store.fridge.length !== prevFridgeLen.current;
    const profileChanged = profileStr !== prevProfileStr.current;

    if (!(fridgeChanged || profileChanged)) return;

    prevFridgeLen.current = store.fridge.length;
    prevProfileStr.current = profileStr;

    const run = async () => {
      await runAgentsWithFallback(false);
    };

    run();
  }, [store.fridge, store.profile, store.language, runAgentsWithFallback]);

  // Active AI monitoring - runs periodically to catch issues
  useEffect(() => {
    const interval = setInterval(() => {
      // Only run if enough time passed and user has data
      const timeSinceLastRun = Date.now() - lastRunTime.current;
      if (timeSinceLastRun > ACTIVE_MONITORING_INTERVAL && (store.fridge.length > 0 || store.meals.length > 0)) {
        runAgentsWithFallback(true);
      }
    }, ACTIVE_MONITORING_INTERVAL);

    return () => clearInterval(interval);
  }, [runAgentsWithFallback, store.fridge.length, store.meals.length]);

  const handleAIAction = useCallback((action: AIAction) => {
    switch (action.type) {
      case 'propose':
        // Store proposed actions for user approval
        if (Array.isArray(action.data)) {
          setProposedActions(prev => [...prev, ...(action.data as ProposedAction[])]);
          toast.success(action.message);
        }
        break;
      case 'fridge_add':
        if (Array.isArray(action.data)) {
          action.data.forEach(item => store.addFridgeItem(item));
        } else if (action.data) {
          store.addFridgeItem(action.data as FridgeItem);
        }
        break;
      case 'fridge_remove':
        if (action.data && 'productName' in action.data) {
          const item = store.fridge.find(f => f.product_name.toLowerCase().includes(action.data!.productName.toLowerCase()));
          if (item) store.removeFridgeItem(item.id);
        }
        break;
      case 'fridge_update':
        if (action.data && 'id' in action.data) {
          const item = action.data as FridgeItem;
          store.updateFridgeItem(item.id, { expiration_date: item.expiration_date });
        }
        break;
      case 'meal_add':
        if (action.data && 'id' in action.data) {
          store.addMeal(action.data as Meal);
        }
        break;
      case 'meal_remove':
        if (action.data && 'mealId' in action.data) {
          store.removeMeal(action.data.mealId);
        }
        break;
      case 'shopping_add':
        if (action.data && 'id' in action.data) {
          store.addShoppingItem(action.data as ShoppingItem);
        }
        break;
      case 'shopping_remove':
        if (action.data && 'itemId' in action.data) {
          store.removeShoppingItem(action.data.itemId);
        }
        break;
      case 'shopping_toggle':
        if (action.data && 'itemId' in action.data) {
          store.toggleShoppingItem(action.data.itemId);
        }
        break;
      default:
        console.warn('Unknown AI action type:', action.type);
    }
  }, [store]);

  // Handle approving a single proposed action
  const handleApproveAction = useCallback((action: ProposedAction) => {
    switch (action.type) {
      case 'fridge_add':
        store.addFridgeItem(action.data as FridgeItem);
        toast.success(`Dodano do lodówki: ${(action.data as FridgeItem).product_name}`);
        break;
      case 'shopping_add':
        store.addShoppingItem(action.data as ShoppingItem);
        toast.success(`Dodano do listy: ${(action.data as ShoppingItem).product_name}`);
        break;
      case 'meal_add':
        store.addMeal(action.data as Meal);
        toast.success(`Zaplanowano: ${(action.data as Meal).name}`);
        break;
      case 'meal_remove':
        if ('mealId' in action.data) {
          store.removeMeal(action.data.mealId);
          toast.success('Usunięto z planu');
        }
        break;
      case 'shopping_remove':
        if ('itemId' in action.data) {
          store.removeShoppingItem(action.data.itemId);
          toast.success('Usunięto z listy');
        }
        break;
    }
    setProposedActions(prev => prev.filter(a => a.id !== action.id));
  }, [store]);

  // Handle dismissing a single proposed action
  const handleDismissAction = useCallback((actionId: string) => {
    setProposedActions(prev => prev.filter(a => a.id !== actionId));
  }, []);

  // Approve all proposed actions
  const handleApproveAllActions = useCallback(() => {
    proposedActions.forEach(action => {
      switch (action.type) {
        case 'fridge_add':
          store.addFridgeItem(action.data as FridgeItem);
          break;
        case 'shopping_add':
          store.addShoppingItem(action.data as ShoppingItem);
          break;
        case 'meal_add':
          store.addMeal(action.data as Meal);
          break;
        case 'meal_remove':
          if ('mealId' in action.data) {
            store.removeMeal(action.data.mealId);
          }
          break;
        case 'shopping_remove':
          if ('itemId' in action.data) {
            store.removeShoppingItem(action.data.itemId);
          }
          break;
      }
    });
    toast.success(`Zatwierdzono ${proposedActions.length} akcji`);
    setProposedActions([]);
  }, [proposedActions, store]);

  // Handle adding multiple fridge items (from review panel)
  const handleAddFridgeItems = useCallback((items: FridgeItem[]) => {
    items.forEach(item => store.addFridgeItem(item));
  }, [store]);
  const handleDismissAllActions = useCallback(() => {
    setProposedActions([]);
    toast.info('Odrzucono wszystkie propozycje');
  }, []);

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
          proposedActions={proposedActions}
          onDismissSuggestion={store.dismissSuggestion}
          onAIAction={handleAIAction}
          onNavigate={setPage}
          onApproveAction={handleApproveAction}
          onDismissAction={handleDismissAction}
          onApproveAllActions={handleApproveAllActions}
          onDismissAllActions={handleDismissAllActions}
          onAddFridgeItems={handleAddFridgeItems}
        />
      )}
      {page === 'fridge' && (
        <FridgePage
          fridge={store.fridge}
          language={store.language}
          onAdd={store.addFridgeItem}
          onRemove={store.removeFridgeItem}
          onUpdate={store.updateFridgeItem}
          cleanupItems={cleanupItems}
        />
      )}
      {page === 'meals' && (
        <MealPlanPage meals={store.meals} language={store.language} />
      )}
      {page === 'shopping' && (
        <ShoppingPage
          items={store.shoppingList}
          language={store.language}
          onPurchase={store.purchaseShoppingItem}
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
