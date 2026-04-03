import { useState } from 'react';
import { UserProfile, Language } from '@/types/chefos';
import { useTranslation } from '@/hooks/useTranslation';
import { User, Globe } from 'lucide-react';

interface ProfilePageProps {
  profile: UserProfile;
  language: Language;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onSetLanguage: (lang: Language) => void;
}

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'pl', label: 'Polski' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
];

export default function ProfilePage({ profile, language, onUpdateProfile, onSetLanguage }: ProfilePageProps) {
  const { t } = useTranslation(language);
  const [weight, setWeight] = useState(String(profile.weight || ''));
  const [height, setHeight] = useState(String(profile.height || ''));
  const [goals, setGoals] = useState((profile.goals || []).join(', '));
  const [allergies, setAllergies] = useState((profile.allergies || []).join(', '));
  const [preferences, setPreferences] = useState((profile.preferences || []).join(', '));

  const handleSave = () => {
    onUpdateProfile({
      weight: Number(weight) || undefined,
      height: Number(height) || undefined,
      bmi: weight && height ? Number(weight) / ((Number(height) / 100) ** 2) : undefined,
      goals: goals ? goals.split(',').map(s => s.trim()).filter(Boolean) : [],
      allergies: allergies ? allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
      preferences: preferences ? preferences.split(',').map(s => s.trim()).filter(Boolean) : [],
    });
  };

  return (
    <div className="p-4 pb-20 max-w-lg mx-auto animate-fade-in">
      <h1 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <User size={20} /> {t('profile.title')}
      </h1>

      <div className="space-y-4">
        <div className="glass-card rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Globe size={14} /> {t('profile.language')}
          </h3>
          <div className="flex gap-2 flex-wrap">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => onSetLanguage(l.code)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  language === l.code
                    ? 'gradient-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-sm text-foreground">{t('profile.health')}</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Weight (kg)</label>
              <input className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground" type="number" value={weight} onChange={e => setWeight(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Height (cm)</label>
              <input className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground" type="number" value={height} onChange={e => setHeight(e.target.value)} />
            </div>
          </div>
          {weight && height && (
            <p className="text-xs text-muted-foreground">
              BMI: {(Number(weight) / ((Number(height) / 100) ** 2)).toFixed(1)}
            </p>
          )}
        </div>

        <div className="glass-card rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-sm text-foreground">{t('profile.goals')}</h3>
          <input className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground" placeholder="e.g. lose weight, build muscle" value={goals} onChange={e => setGoals(e.target.value)} />
        </div>

        <div className="glass-card rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-sm text-foreground">{t('profile.allergies')}</h3>
          <input className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground" placeholder="e.g. gluten, lactose, nuts" value={allergies} onChange={e => setAllergies(e.target.value)} />
        </div>

        <div className="glass-card rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-sm text-foreground">{t('profile.preferences')}</h3>
          <input className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground" placeholder="e.g. vegetarian, keto, Mediterranean" value={preferences} onChange={e => setPreferences(e.target.value)} />
        </div>

        <button onClick={handleSave} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm">
          {t('common.save')}
        </button>
      </div>
    </div>
  );
}
