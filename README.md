# ChefOS - Inteligentny Asystent Kuchenny

ChefOS to nowoczesna aplikacja webowa do zarządzania lodówką, planowania posiłków i organizacji zakupów. Wykorzystuje lokalną analizę AI do generowania sugestii na podstawie zawartości lodówki i profilu użytkownika.

## 🚀 Funkcjonalności

### 📦 Zarządzanie Lodówką
- Dodawanie produktów z automatycznym rozpoznawaniem daty ważności
- Śledzenie produktów wygasających i przeterminowanych
- Automatyczna detekcja jednostek (kg, g, l, ml, sztuki)

### 🍽️ Planowanie Posiłków
- Automatyczny 7-dniowy plan posiłków
- Dopasowanie do produktów dostępnych w lodówce
- Obliczanie kalorii i makroskładników

### 🛒 Lista Zakupów
- Automatyczne generowanie na podstawie planu posiłków
- Oznaczanie kupionych produktów
- Synchronizacja z zawartością lodówki

### 🤖 AI Asystent (Chat + Głos)
- Komendy głosowe i tekstowe w języku polskim i angielskim
- Rozpoznawanie intencji: dodawanie/usuwanie produktów, planowanie posiłków
- Wbudowane sugestie od agentów AI (lodówka, szef kuchni, trener)

### 🌍 Wielojęzyczność
- Polski (pl)
- Angielski (en)
- Hiszpański (es)
- Niemiecki (de)

## 🛠️ Technologie

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand-like custom hook z localStorage
- **Routing**: React Router
- **Query**: TanStack Query
- **Testing**: Vitest + Playwright
- **Build**: Vite

## 📁 Struktura Projektu

```
src/
├── agents/           # Agenci AI (fridge, chef, shopping, coach)
├── components/       # Komponenty React
│   ├── ui/          # shadcn/ui komponenty
│   └── *.tsx        # Główne komponenty aplikacji
├── hooks/           # Custom hooks
│   ├── useTranslation.ts      # System i18n
│   ├── useSpeechRecognition.ts # Web Speech API
│   └── use-toast.ts # Toast notifications
├── i18n/            # Tłumaczenia
├── pages/           # Strony aplikacji
├── store/           # State management
├── types/           # TypeScript types
└── test/            # Testy
```

## 🚦 Instalacja i Uruchomienie

### Wymagania
- Node.js 18+
- npm, yarn, lub bun

### Instalacja

```bash
# Klonowanie repozytorium
git clone <repo-url>
cd ChefOS_2

# Instalacja zależności
npm install
# lub
bun install
```

### Development

```bash
# Uruchomienie serwera deweloperskiego
npm run dev
# lub
bun run dev
```

Aplikacja będzie dostępna pod `http://localhost:5173`

### Build produkcyjny

```bash
npm run build
# lub
bun run build
```

### Testy

```bash
# Unit tests
npm run test

# E2E tests
npx playwright test
```

## 💬 Komendy AI

Aplikacja rozpoznaje następujące komendy w języku polskim i angielskim:

### Lodówka
- `dodaj [produkt] do lodówki` - Dodaje produkt (np. "dodaj 2 kg kurczaka")
- `usuń [produkt] z lodówki` - Usuwa produkt
- `zmień datę ważności [produkt] na [data]` - Aktualizuje datę

### Posiłki
- `zaplanuj [posiłek]` - Dodaje posiłek (np. "zaplanuj obiad z kurczakiem")
- `usuń [posiłek] z planu` - Usuwa posiłek

### Zakupy
- `dodaj [produkt] do listy zakupów` - Dodaje do listy
- `kupiłem [produkt]` - Oznacza jako kupione

## 🔄 Agenci AI

### Fridge Agent
- Monitoruje daty ważności produktów
- Generuje ostrzeżenia o produktach wygasających
- Sugeruje wykorzystanie produktów przed przeterminowaniem

### Chef Agent
- Generuje 7-dniowe plany posiłków
- Dopasowuje przepisy do dostępnych produktów
- Oblicza wartości odżywcze

### Shopping Agent
- Tworzy listę zakupów na podstawie planu
- Sprawdza braki w lodówce
- Optymalizuje ilości

### Coach Agent
- Daje wskazówki zdrowotne
- Oblicza BMI na podstawie profilu
- Generuje codzienne porady

## 🔒 Dane i Prywatność

- Wszystkie dane przechowywane lokalnie w `localStorage`
- Brak komunikacji z zewnętrznymi API (poza Web Speech API)
- Możliwość pełnego resetu danych z poziomu aplikacji

## 📝 TODO / Roadmap

- [ ] Integracja z zewnętrznym API do skanowania produktów
- [ ] Synchronizacja między urządzeniami (backend)
- [ ] Przepisy z instrukcjami krok-po-kroku
- [ ] Statystyki spożycia i raporty
- [ ] Tryb offline (PWA)

## 📄 Licencja

MIT License

## 👨‍💻 Autor

Stworzone z pasją do dobrego jedzenia i czystego kodu.
