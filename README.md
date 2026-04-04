# ChefOS - Inteligentny Asystent Kuchenny

ChefOS to nowoczesna aplikacja webowa do zarządzania lodówką, planowania posiłków i organizacji zakupów. Wykorzystuje backend AI (Python + FastAPI + Groq API) do generowania sugestii na podstawie zawartości lodówki i profilu użytkownika.

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
- **Backend**: Python + FastAPI + Groq API (darmowy tier: 1M tokenów/dzień)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand-like custom hook z localStorage
- **Routing**: React Router
- **Query**: TanStack Query
- **Testing**: Vitest + Playwright
- **Build**: Vite

## 📁 Struktura Projektu

```
src/
├── agents/           # Proxy do backendowych agentów AI
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

backend/
├── main.py          # FastAPI aplikacja z agentami AI
└── requirements.txt # Zależności Python
```

## 🚦 Instalacja i Uruchomienie

### Wymagania

**Opcja A - Manualna instalacja:**
- Node.js 18+
- npm, yarn, lub bun
- Python 3.9+
- Ollama (opcjonalnie, dla pełnej funkcjonalności AI)

**Opcja B - Docker (zalecane):**
- Docker + Docker Compose
- 8GB+ RAM (dla Ollama)

### Opcja A: Manualna instalacja

```bash
# Klonowanie repozytorium
git clone <repo-url>
cd ChefOS_2

# Utwórz plik .env z kluczem API (patrz sekcja "Konfiguracja AI" poniżej)
echo "GROQ_API_KEY=twój_klucz" > .env

# Instalacja zależności frontend
npm install
# lub
bun install

# Instalacja zależności backend
cd backend
pip install -r requirements.txt
cd ..
```

### Opcja B: Docker (najszybsza)

```bash
# Klonowanie repozytorium
git clone <repo-url>
cd ChefOS_2

# Utwórz plik .env z kluczem API (patrz sekcja "Konfiguracja AI" poniżej)
echo "GROQ_API_KEY=twój_klucz" > .env

# Uruchomienie wszystkich serwisów
docker-compose up
```

Aplikacja będzie dostępna pod `http://localhost:5173`

#### Przydatne komendy Docker

```bash
# Uruchomienie w tle
docker-compose up -d

# Zatrzymanie wszystkich serwisów
docker-compose down

# Logi poszczególnych serwisów
docker-compose logs backend
docker-compose logs frontend

# Shell wewnątrz kontenera
docker-compose exec backend bash
docker-compose exec frontend sh
```

### Development

#### Uruchomienie backendu (wymagane dla AI)

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Lub użyj skryptu (wymagane Python + uvicorn):

```bash
npm run dev:backend
```

Backend będzie dostępny pod `http://localhost:8000`

#### Uruchomienie frontendu

```bash
# Uruchomienie serwera deweloperskiego
npm run dev
# lub
bun run dev
```

Aplikacja będzie dostępna pod `http://localhost:5173`

#### Uruchomienie obu serwerów jednocześnie

```bash
npm run dev:all
```

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
- Backend AI używa Groq API (dane przetwarzane przez zewnętrzne API, ale nie są przechowywane)
- Opcjonalny fallback na lokalną Ollama - brak wysyłania danych na zewnątrz
- Możliwość pełnego resetu danych z poziomu aplikacji

## 🤖 Konfiguracja AI (Groq API - ZALECANE)

Domyślnie backend używa **Groq API** - szybkiego i darmowego API do modeli LLM:

### Darmowy tier Groq:
- **1,000,000 tokenów na dzień**
- **20 zapytań na minutę**
- Wystarczające dla typowego użycia aplikacji

### Jak uzyskać klucz API:

1. Wejdź na [console.groq.com](https://console.groq.com)
2. Zarejestruj się (darmowe konto)
3. Przejdź do "API Keys" → "Create API Key"
4. Skopiuj klucz

### Konfiguracja:

**Dla Docker (zalecane):**
```bash
# Utwórz plik .env w głównym folderze projektu:
echo "GROQ_API_KEY=gsk_twój_klucz_tutaj" > .env

# Alternatywnie - eksport zmiennej:
export GROQ_API_KEY=gsk_twój_klucz_tutaj
docker-compose up
```

**Dla manualnej instalacji:**
```bash
# Eksport zmiennej lub dodaj do .env
cd backend
export GROQ_API_KEY=gsk_twój_klucz_tutaj
uvicorn main:app --reload --port 8000
```

Opcjonalne zmienne:
- `GROQ_MODEL` - domyślnie `llama-3.1-8b-instant` (dostępne też: `llama-3.3-70b-versatile`, `mixtral-8x7b-32768`)

### Fallback na Ollama (opcjonalnie)

Jeśli nie podasz `GROQ_API_KEY`, backend spróbuje użyć lokalnej Ollama:

1. Zainstaluj [Ollama](https://ollama.com/)
2. Pobierz model: `ollama pull llama3.1:8b`
3. Upewnij się że Ollama działa: `ollama serve`
4. Ustaw: `OLLAMA_BASE_URL=http://localhost:11434`

Zmienne środowiskowe (opcjonalnie):
- `OLLAMA_BASE_URL` - URL do Ollama API (domyślnie: `http://localhost:11434`)
- `OLLAMA_MODEL` - nazwa modelu (domyślnie: `llama3.1:8b`)

## 📝 TODO / Roadmap

- [x] Backend AI (FastAPI + Ollama)
- [ ] Integracja z zewnętrznym API do skanowania produktów
- [x] Synchronizacja między urządzeniami (backend)
- [ ] Przepisy z instrukcjami krok-po-kroku
- [ ] Statystyki spożycia i raporty
- [ ] Tryb offline (PWA)

## 📄 Licencja

MIT License

## 👨‍💻 Autor

Stworzone z pasją do dobrego jedzenia i czystego kodu.
