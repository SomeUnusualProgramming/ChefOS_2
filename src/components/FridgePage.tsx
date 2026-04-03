import { useState } from 'react';
import { Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { FridgeItem } from '@/types/chefos';
import { useTranslation } from '@/hooks/useTranslation';
import { Language } from '@/types/chefos';

interface FridgePageProps {
  fridge: FridgeItem[];
  language: Language;
  onAdd: (item: FridgeItem) => void;
  onRemove: (id: string) => void;
}

function getDaysUntilExpiry(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function FridgePage({ fridge, language, onAdd, onRemove }: FridgePageProps) {
  const { t } = useTranslation(language);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [expDate, setExpDate] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      id: Math.random().toString(36).slice(2, 10),
      product_name: name.trim(),
      quantity: Number(qty) || 1,
      unit,
      expiration_date: expDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      added_date: new Date().toISOString(),
    });
    setName(''); setQty('1'); setUnit('pcs'); setExpDate('');
    setShowForm(false);
  };

  return (
    <div className="p-4 pb-20 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">{t('fridge.title')}</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="gradient-primary text-primary-foreground px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
        >
          <Plus size={16} /> {t('fridge.addProduct')}
        </button>
      </div>

      {showForm && (
        <div className="glass-card rounded-xl p-4 mb-4 space-y-3 animate-slide-up">
          <input
            className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Product name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <div className="flex gap-2">
            <input
              type="number"
              className="w-20 bg-muted rounded-lg px-3 py-2 text-sm text-foreground"
              value={qty}
              onChange={e => setQty(e.target.value)}
            />
            <select
              className="bg-muted rounded-lg px-3 py-2 text-sm text-foreground flex-1"
              value={unit}
              onChange={e => setUnit(e.target.value)}
            >
              <option value="pcs">pcs</option>
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="l">l</option>
              <option value="ml">ml</option>
            </select>
            <input
              type="date"
              className="bg-muted rounded-lg px-3 py-2 text-sm text-foreground flex-1"
              value={expDate}
              onChange={e => setExpDate(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="gradient-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex-1">
              {t('common.save')}
            </button>
            <button onClick={() => setShowForm(false)} className="bg-muted text-muted-foreground px-4 py-2 rounded-lg text-sm flex-1">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {fridge.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>{t('fridge.empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {fridge.map(item => {
            const days = getDaysUntilExpiry(item.expiration_date);
            const status = days < 0 ? 'expired' : days <= 2 ? 'expiring' : 'fresh';
            return (
              <div key={item.id} className="glass-card rounded-xl p-3 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${status === 'expired' ? 'bg-destructive' : status === 'expiring' ? 'bg-warning' : 'bg-success'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} {item.unit} · {status === 'expired' ? t('fridge.expired') : status === 'expiring' ? t('fridge.expiring') : t('fridge.fresh')}
                  </p>
                </div>
                <button onClick={() => onRemove(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
