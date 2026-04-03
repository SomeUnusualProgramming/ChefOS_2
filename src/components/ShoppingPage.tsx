import { ShoppingItem, Language } from '@/types/chefos';
import { useTranslation } from '@/hooks/useTranslation';
import { ShoppingCart, Check, Plus } from 'lucide-react';
import { useState } from 'react';

interface ShoppingPageProps {
  items: ShoppingItem[];
  language: Language;
  onToggle: (id: string) => void;
  onAdd: (item: ShoppingItem) => void;
  onRemove: (id: string) => void;
}

export default function ShoppingPage({ items, language, onToggle, onAdd, onRemove }: ShoppingPageProps) {
  const { t } = useTranslation(language);
  const [name, setName] = useState('');

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
                    onClick={() => onToggle(item.id)}
                    className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} {item.unit}{item.meal_association ? ` · ${item.meal_association}` : ''}</p>
                  </div>
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
                    <p className="text-sm text-foreground line-through">{item.product_name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
