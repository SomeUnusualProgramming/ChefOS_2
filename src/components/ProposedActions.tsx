import { ProposedAction } from './ChatInput';
import { Check, X, Refrigerator, ShoppingCart, Utensils } from 'lucide-react';

interface ProposedActionsProps {
  actions: ProposedAction[];
  onApprove: (action: ProposedAction) => void;
  onDismiss: (actionId: string) => void;
  onApproveAll: () => void;
  onDismissAll: () => void;
  approveLabel?: string;
  dismissLabel?: string;
  approveAllLabel?: string;
  dismissAllLabel?: string;
}

const iconMap = {
  fridge: Refrigerator,
  shopping: ShoppingCart,
  meal: Utensils,
};

export default function ProposedActions({
  actions,
  onApprove,
  onDismiss,
  onApproveAll,
  onDismissAll,
  approveLabel = 'Tak',
  dismissLabel = 'Nie',
  approveAllLabel = 'Zatwierdź wszystkie',
  dismissAllLabel = 'Odrzuć wszystkie',
}: ProposedActionsProps) {
  if (actions.length === 0) return null;

  return (
    <div className="glass-card rounded-xl p-3 mb-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          AI proponuje ({actions.length}):
        </h3>
        <div className="flex gap-1">
          <button
            onClick={onApproveAll}
            className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            {approveAllLabel}
          </button>
          <button
            onClick={onDismissAll}
            className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            {dismissAllLabel}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {actions.map((action) => {
          const Icon = iconMap[action.icon];
          return (
            <div
              key={action.id}
              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background/50 border border-border/50"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`p-1.5 rounded-lg ${
                  action.icon === 'fridge' ? 'bg-blue-100 text-blue-600' :
                  action.icon === 'shopping' ? 'bg-green-100 text-green-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  <Icon size={14} />
                </div>
                <span className="text-xs text-foreground truncate">
                  {action.description}
                </span>
              </div>

              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => onApprove(action)}
                  className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
                  title={approveLabel}
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => onDismiss(action.id)}
                  className="w-7 h-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center hover:bg-muted/80 transition-colors"
                  title={dismissLabel}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
