import { useState } from 'react';
import { X, Check, AlertTriangle, Edit2, Sparkles, ChefHat } from 'lucide-react';
import { ParsedProduct, parseAndValidateProduct, getCategoryIcon } from '@/data/productDatabase';
import { ProductCategory } from '@/types/chefos';
import { useTranslation } from '@/hooks/useTranslation';
import { Language } from '@/types/chefos';

interface ProductReviewPanelProps {
  products: ParsedProduct[];
  language: Language;
  onConfirm: (products: ParsedProduct[]) => void;
  onCancel: () => void;
}

const REVIEW_REASONS: Record<string, Record<Language, string>> = {
  too_short: {
    en: 'Name too short',
    pl: 'Nazwa za krótka',
    es: 'Nombre demasiado corto',
    de: 'Name zu kurz',
  },
  too_long: {
    en: 'Name too long',
    pl: 'Nazwa za długa',
    es: 'Nombre demasiado largo',
    de: 'Name zu lang',
  },
  no_vowels: {
    en: 'Not a valid word',
    pl: 'To nie jest poprawne słowo',
    es: 'No es una palabra válida',
    de: 'Kein gültiges Wort',
  },
  looks_like_command: {
    en: 'Looks like a command',
    pl: 'Wygląda jak komenda',
    es: 'Parece un comando',
    de: 'Sieht wie ein Befehl aus',
  },
  too_many_consonants: {
    en: 'Suspicious text',
    pl: 'Podejrzany tekst',
    es: 'Texto sospechoso',
    de: 'Verdächtiger Text',
  },
  repeating_chars: {
    en: 'Repeating characters',
    pl: 'Powtarzające się znaki',
    es: 'Caracteres repetidos',
    de: 'Wiederholende Zeichen',
  },
  unknown_product: {
    en: 'Unknown product',
    pl: 'Nieznany produkt',
    es: 'Producto desconocido',
    de: 'Unbekanntes Produkt',
  },
  low_confidence: {
    en: 'Unclear match',
    pl: 'Niepewne dopasowanie',
    es: 'Coincidencia incierta',
    de: 'Unsichere Übereinstimmung',
  },
};

const CATEGORIES: ProductCategory[] = [
  'dairy', 'meat', 'fish', 'vegetables', 'fruits', 'grains',
  'beverages', 'condiments', 'snacks', 'frozen', 'other'
];

export default function ProductReviewPanel({ products, language, onConfirm, onCancel }: ProductReviewPanelProps) {
  const { t } = useTranslation(language);
  const [editedProducts, setEditedProducts] = useState<ParsedProduct[]>(products.map(p => ({ ...p })));
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const needsReviewCount = editedProducts.filter(p => p.needsReview).length;
  const autoMatchedCount = editedProducts.filter(p => !p.needsReview).length;

  const handleUpdateProduct = (index: number, updates: Partial<ParsedProduct>) => {
    setEditedProducts(prev => prev.map((p, i) => {
      if (i !== index) return p;
      const updated = { ...p, ...updates };
      // Re-validate if name changed
      if (updates.suggestedNamePl) {
        const revalidated = parseAndValidateProduct(updates.suggestedNamePl, language);
        return {
          ...updated,
          category: revalidated.category,
          icon: revalidated.icon,
          shelfLifeDays: revalidated.shelfLifeDays,
          needsReview: revalidated.needsReview,
          reviewReason: revalidated.reviewReason,
        };
      }
      return updated;
    }));
  };

  const handleAcceptAutoMatch = (index: number) => {
    setEditedProducts(prev => prev.map((p, i) =>
      i === index ? { ...p, needsReview: false, reviewReason: undefined } : p
    ));
  };

  const handleRemoveProduct = (index: number) => {
    setEditedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const getReviewReasonText = (reason?: string): string => {
    if (!reason) return '';
    return REVIEW_REASONS[reason]?.[language] || reason;
  };

  const CategoryIcon = ({ category }: { category: ProductCategory }) => {
    const Icon = getCategoryIcon(category);
    return <Icon size={16} className="text-muted-foreground" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                <AlertTriangle size={18} className="text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {t('review.title') || 'Review products'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {needsReviewCount > 0
                    ? `${needsReviewCount} ${t('review.needsAttention') || 'need attention'}`
                    : t('review.allGood') || 'All products look good!'}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
            >
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 py-2 bg-muted/30 flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1">
            <Sparkles size={12} className="text-success" />
            {autoMatchedCount} {t('review.autoMatched') || 'auto-matched'}
          </span>
          {needsReviewCount > 0 && (
            <span className="flex items-center gap-1">
              <AlertTriangle size={12} className="text-warning" />
              {needsReviewCount} {t('review.needsReview') || 'need review'}
            </span>
          )}
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {editedProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('review.noProducts') || 'No products to review'}
            </div>
          ) : (
            editedProducts.map((product, index) => (
              <div
                key={index}
                className={`rounded-xl border p-3 transition-all ${
                  product.needsReview
                    ? 'border-warning/50 bg-warning/5'
                    : 'border-success/30 bg-success/5'
                }`}
              >
                {editingIndex === index ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        {t('review.productName') || 'Product name'}
                      </label>
                      <input
                        type="text"
                        value={product.suggestedNamePl}
                        onChange={(e) => handleUpdateProduct(index, { suggestedNamePl: e.target.value })}
                        className="w-full bg-background border rounded-lg px-3 py-2 text-sm"
                        placeholder={t('review.productNamePlaceholder') || 'Enter product name...'}
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">
                          {t('review.category') || 'Category'}
                        </label>
                        <select
                          value={product.category}
                          onChange={(e) => handleUpdateProduct(index, { category: e.target.value as ProductCategory })}
                          className="w-full bg-background border rounded-lg px-2 py-1.5 text-xs"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>
                              {t(`category.${cat}`)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-20">
                        <label className="text-xs text-muted-foreground mb-1 block">
                          {t('review.shelfLife') || 'Days'}
                        </label>
                        <input
                          type="number"
                          value={product.shelfLifeDays}
                          onChange={(e) => handleUpdateProduct(index, { shelfLifeDays: parseInt(e.target.value) || 7 })}
                          className="w-full bg-background border rounded-lg px-2 py-1.5 text-xs text-center"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="flex-1 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium"
                      >
                        {t('common.save') || 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="flex-1 bg-muted text-muted-foreground px-3 py-2 rounded-lg text-sm"
                      >
                        {t('common.cancel') || 'Cancel'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      product.needsReview ? 'bg-warning/20' : 'bg-success/20'
                    }`}>
                      <CategoryIcon category={product.category} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground">
                            {product.suggestedNamePl}
                          </p>
                          {product.isTypo && (
                            <p className="text-xs text-muted-foreground line-through">
                              {product.originalName}
                            </p>
                          )}
                          {product.needsReview && product.reviewReason && (
                            <span className="inline-flex items-center gap-1 text-xs text-warning mt-1">
                              <AlertTriangle size={10} />
                              {getReviewReasonText(product.reviewReason)}
                            </span>
                          )}
                          {!product.needsReview && (
                            <span className="inline-flex items-center gap-1 text-xs text-success mt-1">
                              <Sparkles size={10} />
                              {product.confidence > 0.9
                                ? (t('review.perfectMatch') || 'Perfect match')
                                : (t('review.goodMatch') || 'Good match')}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setEditingIndex(index)}
                            className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                            title={t('review.edit') || 'Edit'}
                          >
                            <Edit2 size={14} className="text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleRemoveProduct(index)}
                            className="w-7 h-7 rounded-lg hover:bg-destructive/20 flex items-center justify-center transition-colors"
                            title={t('review.remove') || 'Remove'}
                          >
                            <X size={14} className="text-destructive" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CategoryIcon category={product.category} />
                          {t(`category.${product.category}`)}
                        </span>
                        <span>·</span>
                        <span>{product.shelfLifeDays} {t('review.days') || 'days'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-muted text-muted-foreground px-4 py-3 rounded-xl text-sm font-medium"
          >
            {t('common.cancel') || 'Cancel'}
          </button>
          <button
            onClick={() => onConfirm(editedProducts)}
            disabled={editedProducts.length === 0}
            className="flex-[2] gradient-primary text-primary-foreground px-4 py-3 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            <div className="flex items-center justify-center gap-2">
              <Check size={18} />
              {t('review.addProducts') || 'Add'} {editedProducts.length > 0 && `(${editedProducts.length})`}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
