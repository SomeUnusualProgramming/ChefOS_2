import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Edit3, Wand2, AlertTriangle, XCircle, ScanLine } from 'lucide-react';
import { FridgeItem, ProductCategory } from '@/types/chefos';
import { useTranslation } from '@/hooks/useTranslation';
import { Language } from '@/types/chefos';
import { FridgeCleanupSuggestion } from '@/agents/runAgents';
import { getProductByName, getCategoryIcon, validateReceiptProducts, ValidatedReceiptProduct } from '@/data/productDatabase';
import { toast } from 'sonner';
import ReceiptScanner, { DetectedProduct } from './ReceiptScanner';
import ProductReviewPanel, { ParsedProduct } from './ProductReviewPanel';

interface FridgePageProps {
  fridge: FridgeItem[];
  language: Language;
  onAdd: (item: FridgeItem) => void;
  onRemove: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<FridgeItem>) => void;
  cleanupItems?: FridgeCleanupSuggestion[];
}

function getDaysUntilExpiry(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const CATEGORIES: ProductCategory[] = [
  'dairy', 'meat', 'fish', 'vegetables', 'fruits', 'grains',
  'beverages', 'condiments', 'snacks', 'frozen', 'other'
];

function getItemCategory(item: FridgeItem): ProductCategory {
  return item.category || 'other';
}

export default function FridgePage({ fridge, language, onAdd, onRemove, onUpdate, cleanupItems }: FridgePageProps) {
  const { t } = useTranslation(language);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [expDate, setExpDate] = useState('');
  const [category, setCategory] = useState<ProductCategory>('other');
  const [expandedCategories, setExpandedCategories] = useState<Set<ProductCategory>>(new Set());
  const [editingCleanup, setEditingCleanup] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<ProductCategory>('other');
  const [editQty, setEditQty] = useState('1');
  const [editUnit, setEditUnit] = useState('pcs');
  const [showCleanupPanel, setShowCleanupPanel] = useState(false);

  // Receipt scanner states
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [receiptProducts, setReceiptProducts] = useState<ParsedProduct[] | null>(null);

  // Filter cleanup items that are still in fridge
  const activeCleanupItems = cleanupItems?.filter(c => fridge.some(f => f.id === c.item.id)) || [];
  const hasCleanupItems = activeCleanupItems.length > 0;

  // Group items by category
  const groupedItems = fridge.reduce((acc, item) => {
    const cat = getItemCategory(item);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<ProductCategory, FridgeItem[]>);

  const toggleCategory = (cat: ProductCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      id: Math.random().toString(36).slice(2, 10),
      product_name: name.trim(),
      quantity: Number(qty) || 1,
      unit,
      expiration_date: expDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      added_date: new Date().toISOString(),
      category,
    });
    setName('');
    setQty('1');
    setUnit('pcs');
    setExpDate('');
    setCategory('other');
    setShowForm(false);
  };

  // Cleanup handlers
  const handleDeleteItem = (itemId: string) => {
    onRemove(itemId);
    toast.success('Produkt usunięty z lodówki');
  };

  const handleFixItem = (cleanup: FridgeCleanupSuggestion) => {
    if (!onUpdate) return;

    const newName = editName.trim() || cleanup.suggestedName || cleanup.item.product_name;
    const newCategory = editCategory !== 'other' ? editCategory : (cleanup.suggestedCategory as ProductCategory) || 'other';
    const newQty = Number(editQty) || cleanup.item.quantity || 1;
    const newUnit = editUnit || cleanup.item.unit || 'pcs';

    onUpdate(cleanup.item.id, {
      product_name: newName,
      category: newCategory,
      quantity: newQty,
      unit: newUnit,
    });

    toast.success(`Zaktualizowano: ${newName} (${newQty} ${newUnit})`);
    setEditingCleanup(null);
    setEditName('');
    setEditCategory('other');
    setEditQty('1');
    setEditUnit('pcs');
  };

  const getIssueIcon = (issue: string) => {
    switch (issue) {
      case 'suspicious_name': return <AlertTriangle size={14} className="text-destructive" />;
      case 'unknown_product': return <AlertCircle size={14} className="text-warning" />;
      case 'no_category': return <Edit3 size={14} className="text-info" />;
      case 'typo': return <Wand2 size={14} className="text-primary" />;
      default: return <AlertCircle size={14} />;
    }
  };

  const getIssueText = (issue: string) => {
    switch (issue) {
      case 'suspicious_name': return 'Podejrzana nazwa (może być komendą)';
      case 'unknown_product': return 'Nieznany produkt';
      case 'no_category': return 'Brak kategorii';
      case 'typo': return 'Możliwa literówka';
      default: return issue;
    }
  };

  // Receipt scanner handler
  const handleReceiptProductsDetected = (detectedProducts: DetectedProduct[]) => {
    // Validate each detected product against database
    const validated = validateReceiptProducts(
      detectedProducts.map(p => ({
        name: p.name,
        quantity: p.quantity,
        unit: p.unit,
        price: p.price,
      }))
    );

    // Convert to ParsedProduct format for ProductReviewPanel
    const parsedProducts: ParsedProduct[] = validated.map(v => ({
      originalName: v.originalName,
      suggestedName: v.matchedProduct?.en || v.originalName,
      suggestedNamePl: v.suggestedName || v.originalName,
      category: v.suggestedCategory || 'other',
      icon: v.matchedProduct?.icon || 'ChefHat',
      shelfLifeDays: v.matchedProduct?.shelfLifeDays || 7,
      confidence: v.confidence,
      isTypo: v.confidence > 0 && v.confidence < 1,
      needsReview: v.needsReview || !v.isValid,
      reviewReason: v.needsReview ? (v.isValid ? 'low_confidence' : 'unknown_product') : undefined,
    }));

    setReceiptProducts(parsedProducts);
    setShowReceiptScanner(false);
  };

  const handleConfirmReceiptProducts = (confirmedProducts: ParsedProduct[]) => {
    const now = new Date();

    confirmedProducts.forEach((product, index) => {
      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + product.shelfLifeDays);

      onAdd({
        id: `receipt-${Date.now()}-${index}`,
        product_name: product.suggestedNamePl.charAt(0).toUpperCase() + product.suggestedNamePl.slice(1),
        quantity: 1,
        unit: 'pcs',
        expiration_date: expiryDate.toISOString().split('T')[0],
        added_date: now.toISOString().split('T')[0],
        category: product.category,
      });
    });

    toast.success(`Dodano ${confirmedProducts.length} produktów z paragonu`);
    setReceiptProducts(null);
  };

  return (
    <div className="p-4 pb-20 max-w-lg mx-auto animate-fade-in">
      {/* Receipt Scanner */}
      {showReceiptScanner && (
        <ReceiptScanner
          language={language}
          onProductsDetected={handleReceiptProductsDetected}
        />
      )}

      {/* Product Review Panel for Receipt Products */}
      {receiptProducts && (
        <ProductReviewPanel
          products={receiptProducts}
          language={language}
          onConfirm={handleConfirmReceiptProducts}
          onCancel={() => setReceiptProducts(null)}
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">{t('fridge.title')}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowReceiptScanner(true)}
            className="bg-secondary text-secondary-foreground px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
          >
            <ScanLine size={16} /> Paragon
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="gradient-primary text-primary-foreground px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
          >
            <Plus size={16} /> {t('fridge.addProduct')}
          </button>
        </div>
      </div>

      {/* Cleanup Alert Banner */}
      {hasCleanupItems && !showCleanupPanel && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-warning shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Znaleziono {activeCleanupItems.length} produktów wymagających uwagi
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Niektóre produkty mają podejrzane nazwy, brak kategorii lub nie są rozpoznawane
              </p>
            </div>
            <button
              onClick={() => setShowCleanupPanel(true)}
              className="text-xs bg-warning text-warning-foreground px-3 py-1.5 rounded-lg font-medium whitespace-nowrap"
            >
              Posprzątaj
            </button>
          </div>
        </div>
      )}

      {/* Cleanup Panel */}
      {showCleanupPanel && hasCleanupItems && (
        <div className="glass-card rounded-xl p-4 mb-4 space-y-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Wand2 size={16} className="text-primary" />
              Porządkowanie lodówki
            </h3>
            <button
              onClick={() => setShowCleanupPanel(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <XCircle size={18} />
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activeCleanupItems.map((cleanup) => (
              <div key={cleanup.item.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
                {/* Item header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {cleanup.item.product_name}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cleanup.issues.map(issue => (
                        <span key={issue} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-background">
                          {getIssueIcon(issue)}
                          {getIssueText(issue)}
                        </span>
                      ))}
                    </div>
                  </div>
                  {cleanup.action === 'delete' && (
                    <button
                      onClick={() => handleDeleteItem(cleanup.item.id)}
                      className="text-destructive hover:bg-destructive/10 p-1 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Suggestion */}
                {(cleanup.suggestedName || cleanup.suggestedCategory) && (
                  <div className="text-xs text-muted-foreground bg-background/50 rounded p-2">
                    <p className="font-medium text-primary mb-1">Sugerowana poprawka:</p>
                    {cleanup.suggestedName && (
                      <p>Nazwa: <span className="text-foreground">{cleanup.suggestedName}</span></p>
                    )}
                    {cleanup.suggestedCategory && (
                      <p>Kategoria: <span className="text-foreground">{cleanup.suggestedCategory}</span></p>
                    )}
                    <p className="text-[10px] mt-1">Pewność: {Math.round(cleanup.confidence * 100)}%</p>
                  </div>
                )}

                {/* Edit form or action buttons */}
                {editingCleanup === cleanup.item.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      className="w-full bg-background rounded-lg px-3 py-2 text-sm text-foreground"
                      placeholder="Nowa nazwa produktu"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        className="w-24 bg-background rounded-lg px-3 py-2 text-sm text-foreground"
                        placeholder="Ilość"
                        value={editQty}
                        onChange={e => setEditQty(e.target.value)}
                      />
                      <select
                        className="flex-1 bg-background rounded-lg px-3 py-2 text-sm text-foreground"
                        value={editUnit}
                        onChange={e => setEditUnit(e.target.value)}
                      >
                        <option value="pcs">szt</option>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="l">l</option>
                        <option value="ml">ml</option>
                        <option value="pack">opak.</option>
                      </select>
                    </div>
                    <select
                      className="w-full bg-background rounded-lg px-3 py-2 text-sm text-foreground"
                      value={editCategory}
                      onChange={e => setEditCategory(e.target.value as ProductCategory)}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{t(`category.${cat}`)}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFixItem(cleanup)}
                        className="flex-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium"
                      >
                        Zapisz
                      </button>
                      <button
                        onClick={() => {
                          setEditingCleanup(null);
                          setEditName('');
                          setEditCategory('other');
                          setEditQty('1');
                          setEditUnit('pcs');
                        }}
                        className="flex-1 bg-muted text-muted-foreground px-3 py-1.5 rounded-lg text-xs"
                      >
                        Anuluj
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {cleanup.suggestedName && (
                      <button
                        onClick={() => {
                          setEditName(cleanup.suggestedName || '');
                          setEditCategory((cleanup.suggestedCategory as ProductCategory) || 'other');
                          setEditQty(String(cleanup.item.quantity || 1));
                          setEditUnit(cleanup.item.unit || 'pcs');
                          setEditingCleanup(cleanup.item.id);
                        }}
                        className="flex-1 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                      >
                        <CheckCircle size={14} />
                        Akceptuj sugestię
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditName(cleanup.item.product_name);
                        setEditCategory(cleanup.item.category || 'other');
                        setEditQty(String(cleanup.item.quantity || 1));
                        setEditUnit(cleanup.item.unit || 'pcs');
                        setEditingCleanup(cleanup.item.id);
                      }}
                      className="flex-1 bg-muted text-muted-foreground px-3 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1"
                    >
                      <Edit3 size={14} />
                      Edytuj
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowCleanupPanel(false)}
            className="w-full bg-muted text-muted-foreground py-2 rounded-lg text-sm"
          >
            Zamknij panel
          </button>
        </div>
      )}

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
          <select
            className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground"
            value={category}
            onChange={e => setCategory(e.target.value as ProductCategory)}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{t(`category.${cat}`)}</option>
            ))}
          </select>
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
          {CATEGORIES.map(cat => {
            const items = groupedItems[cat] || [];
            if (items.length === 0) return null;

            const isExpanded = expandedCategories.has(cat);
            const itemCount = items.length;

            return (
              <div key={cat} className="glass-card rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">{t(`category.${cat}`)}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {t('fridge.itemsCount').replace('{count}', String(itemCount))}
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-border/50">
                    {items.map(item => {
                      const days = getDaysUntilExpiry(item.expiration_date);
                      const status = days < 0 ? 'expired' : days <= 2 ? 'expiring' : 'fresh';
                      return (
                        <div key={item.id} className="p-3 flex items-center gap-3 border-b border-border/30 last:border-b-0">
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
          })}
        </div>
      )}
    </div>
  );
}
