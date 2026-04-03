import { AISuggestion } from '@/types/chefos';
import { X, AlertTriangle, Lightbulb, Info, Zap } from 'lucide-react';

interface SuggestionCardProps {
  suggestion: AISuggestion;
  onDismiss: (id: string) => void;
  approveLabel: string;
  dismissLabel: string;
}

const agentColors: Record<string, string> = {
  fridge: 'bg-info/10 border-info/30 text-info',
  chef: 'bg-primary/10 border-primary/30 text-primary',
  shopping: 'bg-warning/10 border-warning/30 text-warning',
  coach: 'bg-accent/10 border-accent/30 text-accent',
};

const agentIcons: Record<string, typeof Info> = {
  fridge: Zap,
  chef: Lightbulb,
  shopping: Info,
  coach: AlertTriangle,
};

export default function SuggestionCard({ suggestion, onDismiss, dismissLabel }: SuggestionCardProps) {
  if (suggestion.dismissed) return null;

  const colorClass = agentColors[suggestion.agent] || 'bg-muted';
  const Icon = agentIcons[suggestion.agent] || Info;

  return (
    <div className={`rounded-xl border p-3 ${colorClass} animate-fade-in`}>
      <div className="flex items-start gap-2">
        <Icon size={16} className="mt-0.5 shrink-0" />
        <p className="text-sm flex-1 leading-relaxed">{suggestion.message}</p>
        <button
          onClick={() => onDismiss(suggestion.id)}
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          title={dismissLabel}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
