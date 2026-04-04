import { ShoppingItem, Language } from '@/types/chefos';
import { useTranslation } from '@/hooks/useTranslation';
import { ShoppingCart, Check, Plus, Minus, X, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface ShoppingPageProps {
  items: ShoppingItem[];
  language: Language;
  onPurchase: (id: string, quantity?: number) => void;
  onToggle: (id: string) => void;
  onAdd: (item: ShoppingItem) => void;
  onRemove: (id: string) => void;
}

export default function ShoppingPage({ items, language, onPurchase, onToggle, onAdd, onRemove }: ShoppingPageProps) {
  const { t } = useTranslation(language);
  const [name, setName] = useState('');
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);

  const pending = items.filter(i => !i.purchased);
  const done = items.filter(i => i.purchased);

  const handleQuickAdd = () => {
    if (!name.trim()) return;
    onAdd({
      id: Math.random().toString(36).slice(2, 10),
      product_name: name.trim(),
      quantity: 1,
      unit: 'pcs',
      purchased: false,
    });
    setName('');
  };

  const openPurchaseModal = (item: ShoppingItem) => {
    setEditingItem(item);
    setEditQuantity(item.quantity);
  };

  const handleConfirmPurchase = () => {
    if (editingItem) {
      onPurchase(editingItem.id, editQuantity);
      setEditingItem(null);
    }
  };

  const adjustQuantity = (delta: number) => {
    setEditQuantity(prev => Math.max(0.1, +(prev + delta).toFixed(2)));
  };

  return (
    <div className="p-4 pb-20 max-w-lg mx-auto animate-fade-in">
      <h1 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <ShoppingCart size={20} /> {t('shopping.title')}
      </h1>

      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          placeholder={t('shopping.addItem')}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
        />
        <button onClick={handleQuickAdd} className="gradient-primary text-primary-foreground p-2 rounded-xl">
          <Plus size={18} />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><p>{t('shopping.empty')}</p></div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="space-y-2 mb-4">
              {pending.map(item => (
                <div key={item.id} className="glass-card rounded-xl p-3 flex items-center gap-3">
                  <button
                    onClick={() => openPurchaseModal(item)}
                    className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center shrink-0 hover:bg-primary/10 transition-colors"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} {item.unit}{item.meal_association ? ` · ${item.meal_association}` : ''}</p>
                  </div>
                  <button
                    onClick={() => onRemove(item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {done.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">{t('shopping.purchased')}</p>
              <div className="space-y-1">
                {done.map(item => (
                  <div key={item.id} className="rounded-xl p-3 flex items-center gap-3 opacity-50">
                    <button
                      onClick={() => onToggle(item.id)}
                      className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0"
                    >
                      <Check size={12} className="text-primary-foreground" />
                    </button>
                    <p className="text-sm text-foreground line-through">{item.product_name} ({item.quantity} {item.unit})</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-semibold text-foreground mb-4">{t('shopping.purchaseItem') || 'Potwierdź zakup'}</h3>

            <p className="text-sm text-muted-foreground mb-4">{editingItem.product_name}</p>

            <div className="mb-6">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('shopping.quantity') || 'Ilość'}</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => adjustQuantity(-1)}
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                >
                  <Minus size={18} />
                </button>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={editQuantity}
                  onChange={e => setEditQuantity(Math.max(0.1, +e.target.value))}
                  className="flex-1 bg-muted rounded-xl px-3 py-2 text-center text-foreground font-medium"
                />
                <button
                  onClick={() => adjustQuantity(1)}
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{editingItem.unit}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditingItem(null)}
                className="flex-1 py-3 px-4 rounded-xl bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
              >
                {t('common.cancel') || 'Anuluj'}
              </button>
              <button
                onClick={handleConfirmPurchase}
                className="flex-1 py-3 px-4 rounded-xl gradient-primary text-primary-foreground font-medium flex items-center justify-center gap-2"
              >
                <ArrowRight size={18} />
                {t('common.addToFridge') || 'Do lodówki'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
