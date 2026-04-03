import { Home, Refrigerator, UtensilsCrossed, ShoppingCart, User } from 'lucide-react';

interface BottomNavProps {
  active: string;
  onNavigate: (page: string) => void;
  labels: { dashboard: string; fridge: string; meals: string; shopping: string; profile: string };
}

const navItems = [
  { id: 'dashboard', icon: Home },
  { id: 'fridge', icon: Refrigerator },
  { id: 'meals', icon: UtensilsCrossed },
  { id: 'shopping', icon: ShoppingCart },
  { id: 'profile', icon: User },
];

export default function BottomNav({ active, onNavigate, labels }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
              active === id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon size={22} strokeWidth={active === id ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium">{labels[id as keyof typeof labels]}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
