import { Meal, Language } from '@/types/chefos';
import { useTranslation } from '@/hooks/useTranslation';
import { Calendar, Flame } from 'lucide-react';

interface MealPlanPageProps {
  meals: Meal[];
  language: Language;
}

export default function MealPlanPage({ meals, language }: MealPlanPageProps) {
  const { t } = useTranslation(language);

  const grouped = meals.reduce<Record<string, Meal[]>>((acc, m) => {
    (acc[m.day] = acc[m.day] || []).push(m);
    return acc;
  }, {});

  const days = Object.keys(grouped).sort().slice(0, 7);

  const mealTypeLabel = (type: string) => t(`meals.${type}`) || type;

  const mealTypeColors: Record<string, string> = {
    breakfast: 'bg-amber-100 text-amber-700',
    lunch: 'bg-green-100 text-green-700',
    dinner: 'bg-blue-100 text-blue-700',
    snack: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="p-4 pb-20 max-w-lg mx-auto animate-fade-in">
      <h1 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Calendar size={20} /> {t('meals.title')}
      </h1>

      {days.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No meal plan yet. Press "Run Agents" on the dashboard!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {days.map(day => {
            const dayName = new Date(day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const dayMeals = grouped[day].sort((a, b) => {
              const order = ['breakfast', 'lunch', 'snack', 'dinner'];
              return order.indexOf(a.meal_type) - order.indexOf(b.meal_type);
            });
            const totalCal = dayMeals.reduce((s, m) => s + m.calories, 0);

            return (
              <div key={day} className="glass-card rounded-xl p-4 animate-slide-up">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-foreground">{dayName}</h3>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Flame size={12} /> {totalCal} {t('common.kcal')}
                  </span>
                </div>
                <div className="space-y-2">
                  {dayMeals.map(meal => (
                    <div key={meal.id} className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${mealTypeColors[meal.meal_type] || 'bg-muted text-muted-foreground'}`}>
                        {mealTypeLabel(meal.meal_type)}
                      </span>
                      <span className="text-sm text-foreground">{meal.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{meal.calories} kcal</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
