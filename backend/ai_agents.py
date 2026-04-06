"""
Intelligent AI agents for ChefOS - chain-of-thought version with context awareness.
AI understands its role and reasons about user intentions independently.
"""

import json
import re
from datetime import date, datetime, timedelta
from typing import Any, Literal
from pydantic import BaseModel


# Translation dictionaries for command recognition examples
COMMAND_EXAMPLES: dict[str, dict[str, list[str]]] = {
    "cleanup": {
        "pl": ["posprzątaj lodówkę", "wyczyść lodówkę", "posprzątaj"],
        "en": ["clean fridge", "organize pantry", "clean up"],
        "es": ["limpiar nevera", "organizar despensa"],
        "de": ["kühlschrank putzen", "vorratskammer organisieren"],
    },
    "show_expiring": {
        "pl": ["pokaż co wygasa", "co się psuje", "co wygasa"],
        "en": ["show expiring", "what expires", "expiring items"],
        "es": ["mostrar caducidad", "qué caduca"],
        "de": ["zeige ablaufende", "was läuft ab"],
    },
    "remove_expired": {
        "pl": ["usuń przeterminowane", "wyrzuć stare", "usuń stare"],
        "en": ["remove expired", "throw out old", "delete expired"],
        "es": ["eliminar caducados", "tirar viejos"],
        "de": ["ablaufende entfernen", "altes wegwerfen"],
    },
    "shopping": {
        "pl": ["zrób zakupy", "lista zakupów", "kup"],
        "en": ["make shopping list", "go shopping", "buy"],
        "es": ["hacer lista de compra", "ir de compras"],
        "de": ["einkaufsliste erstellen", "einkaufen gehen"],
    },
    "cook": {
        "pl": ["co mogę ugotować", "co na obiad", "co zrobić na obiad", "co ugotować"],
        "en": ["what can I cook", "meal ideas", "what to cook", "cook with"],
        "es": ["qué puedo cocinar", "ideas de comida"],
        "de": ["was kann ich kochen", "mahlzeiten ideen"],
    },
    "check_fridge": {
        "pl": ["sprawdź lodówkę", "stan lodówki", "co mam w lodówce"],
        "en": ["check fridge", "fridge status", "what's in fridge"],
        "es": ["revisar nevera", "estado de nevera"],
        "de": ["kühlschrank prüfen", "kühlschrank status"],
    },
    "summary": {
        "pl": ["podsumowanie", "raport"],
        "en": ["summary", "report", "overview"],
        "es": ["resumen", "informe"],
        "de": ["zusammenfassung", "bericht"],
    },
}

UNITS_BY_LANGUAGE: dict[str, dict[str, str]] = {
    "pl": {"pcs": "szt", "pack": "opak"},
    "en": {"pcs": "pcs", "pack": "pack"},
    "es": {"pcs": "uds", "pack": "paq"},
    "de": {"pcs": "Stk", "pack": "Pack"},
}

LANGUAGE_NAMES: dict[str, str] = {
    "pl": "Polish",
    "en": "English",
    "es": "Spanish",
    "de": "German",
}


def get_command_examples(language: str) -> str:
    """Generate command examples for system prompt in given language"""
    lang = language if language in COMMAND_EXAMPLES["cleanup"] else "en"
    
    lines = []
    for cmd_type, translations in COMMAND_EXAMPLES.items():
        examples = translations.get(lang, translations["en"])
        lines.append(f'- "{examples[0]}" -> {cmd_type}')
    
    return "\n".join(lines)


def get_unit(language: str, unit_type: str = "pcs") -> str:
    """Get localized unit abbreviation"""
    return UNITS_BY_LANGUAGE.get(language, UNITS_BY_LANGUAGE["en"]).get(unit_type, unit_type)


def get_language_name(language: str) -> str:
    """Get human-readable language name"""
    return LANGUAGE_NAMES.get(language, "English")


class FridgeItem(BaseModel):
    id: str
    product_name: str
    quantity: float
    unit: str
    expiration_date: str
    added_date: str
    category: str | None = None


class MealProduct(BaseModel):
    product_name: str
    quantity: float
    unit: str


class Meal(BaseModel):
    id: str
    day: str
    meal_type: Literal["breakfast", "lunch", "dinner", "snack"]
    name: str
    products: list[MealProduct]
    calories: int
    macros: dict[str, float]


class ShoppingItem(BaseModel):
    id: str
    product_name: str
    quantity: float
    unit: str
    meal_association: str | None = None
    purchased: bool
    category: str | None = None


class UserProfile(BaseModel):
    weight: float | None = None
    height: float | None = None
    bmi: float | None = None
    goals: list[str] | None = None
    preferences: list[str] | None = None
    allergies: list[str] | None = None
    activity_level: str | None = None


class AIAction(BaseModel):
    """Represents a single action the AI wants to perform"""
    action_type: Literal[
        "fridge_add", "fridge_update", "fridge_remove",
        "shopping_add", "shopping_remove", "shopping_toggle",
        "meal_add", "meal_remove",
        "suggest", "question", "clarify", "confirm"
    ]
    target_id: str | None = None  # ID of item to update/remove
    data: dict[str, Any] | None = None  # Data for add/update operations
    reasoning: str  # Why AI decided this action
    confidence: float  # 0.0-1.0 how confident AI is
    requires_approval: bool  # Does this need user confirmation?


class AIResponse(BaseModel):
    """Complete AI response with thinking process and actions"""
    thinking: str  # AI's internal reasoning about what user wants
    understanding: str  # AI's interpretation of user intent
    actions: list[AIAction]
    message: str  # User-facing message
    follow_up_questions: list[str] | None = None  # If AI needs more info


class ContextBuilder:
    """Builds rich context about current app state for AI"""
    
    @staticmethod
    def build_context(
        user_message: str,
        fridge: list[FridgeItem],
        meals: list[Meal],
        shopping: list[ShoppingItem],
        profile: UserProfile,
        language: str = "pl"
    ) -> dict[str, Any]:
        """Build comprehensive context for AI understanding"""
        
        today = date.today()
        
        # Analyze fridge state
        fridge_analysis = ContextBuilder._analyze_fridge(fridge, today)
        
        # Analyze meals
        meals_analysis = ContextBuilder._analyze_meals(meals, today)
        
        # Analyze shopping
        shopping_analysis = ContextBuilder._analyze_shopping(shopping)
        
        # Build user context
        user_context = {
            "language": language,
            "message": user_message,
            "current_date": today.isoformat(),
            "fridge": {
                "items": [item.model_dump() for item in fridge],
                "total_items": len(fridge),
                "analysis": fridge_analysis,
            },
            "meals": {
                "items": [meal.model_dump() for meal in meals],
                "total_planned": len(meals),
                "analysis": meals_analysis,
            },
            "shopping": {
                "items": [item.model_dump() for item in shopping],
                "total_items": len(shopping),
                "pending": len([s for s in shopping if not s.purchased]),
                "analysis": shopping_analysis,
            },
            "profile": profile.model_dump() if profile else {},
        }
        
        return user_context
    
    @staticmethod
    def _analyze_fridge(fridge: list[FridgeItem], today: date) -> dict[str, Any]:
        """Analyze fridge state and generate insights"""
        analysis = {
            "expiring_soon": [],  # Expires within 2 days
            "expired": [],
            "fresh": [],
            "by_category": {},
            "low_stock": [],  # Items with quantity < 2
        }
        
        for item in fridge:
            exp_date = datetime.strptime(item.expiration_date, "%Y-%m-%d").date()
            days_left = (exp_date - today).days
            
            item_info = {
                "id": item.id,
                "name": item.product_name,
                "quantity": item.quantity,
                "days_left": days_left,
            }
            
            if days_left < 0:
                analysis["expired"].append(item_info)
            elif days_left <= 2:
                analysis["expiring_soon"].append(item_info)
            else:
                analysis["fresh"].append(item_info)
            
            # Category grouping
            cat = item.category or "other"
            if cat not in analysis["by_category"]:
                analysis["by_category"][cat] = []
            analysis["by_category"][cat].append(item_info)
            
            # Low stock
            if item.quantity < 2:
                analysis["low_stock"].append(item_info)
        
        return analysis
    
    @staticmethod
    def _analyze_meals(meals: list[Meal], today: date) -> dict[str, Any]:
        """Analyze meal planning state"""
        analysis = {
            "today_meals": [],
            "upcoming": [],
            "missing_ingredients": [],
        }
        
        today_str = today.isoformat()
        
        for meal in meals:
            meal_info = {
                "id": meal.id,
                "name": meal.name,
                "type": meal.meal_type,
                "day": meal.day,
                "products": [p.model_dump() for p in meal.products],
            }
            
            if meal.day == today_str:
                analysis["today_meals"].append(meal_info)
            elif meal.day > today_str:
                analysis["upcoming"].append(meal_info)
        
        return analysis
    
    @staticmethod
    def _analyze_shopping(shopping: list[ShoppingItem]) -> dict[str, Any]:
        """Analyze shopping list state"""
        analysis = {
            "urgent": [],  # Associated with today's or tomorrow's meals
            "can_wait": [],
        }
        
        for item in shopping:
            if not item.purchased:
                item_info = {
                    "id": item.id,
                    "name": item.product_name,
                    "quantity": item.quantity,
                    "meal_association": item.meal_association,
                }
                
                if item.meal_association:
                    analysis["urgent"].append(item_info)
                else:
                    analysis["can_wait"].append(item_info)
        
        return analysis


class AgentSystem:
    """
    Main AI Agent System with role understanding and chain-of-thought.
    AI understands it's a kitchen/pantry assistant and reasons about user needs.
    """
    
    def __init__(self):
        self.context_builder = ContextBuilder()
    
    def get_system_prompt(self, language: str = "en") -> str:
        """
        Comprehensive system prompt defining AI's role and reasoning approach.
        Language parameter ensures AI responds in user's selected language.
        """
        
        lang_name = get_language_name(language)
        command_examples = get_command_examples(language)
        
        role_definition = f"""
You are ChefOS AI - an intelligent kitchen and pantry management assistant. Your role is to:

1. FRIDGE/PANTRY MANAGEMENT:
   - Monitor product expiration dates
   - Track quantities and suggest restocking
   - Detect products nearing expiration

2. MEAL PLANNING:
   - Suggest meals based on available ingredients
   - Plan shopping based on meal plans
   - Optimize product usage

3. SHOPPING LISTS:
   - Generate shopping lists from plans
   - Prioritize urgent purchases
   - Group products logically

4. NUTRITIONAL ADVICE:
   - Consider user profile (weight, height, goals)
   - Suggest healthier alternatives
   - Monitor calories and macros

CRITICAL RULES:
1. ALWAYS respond in {lang_name} language
2. ALL user-facing messages MUST be in {lang_name}
3. Use appropriate units for the language/culture (e.g., "{get_unit(language, 'pcs')}" for {lang_name})

COMMANDS vs PRODUCTS - CRITICAL DISTINCTION:
Some user phrases are COMMANDS/ACTIONS, not product names. Recognize these:

{command_examples}

NEVER treat these as product names to add!
If user says a command word -> they want to perform that ACTION, not add a product with that name!

THINKING RULES (Chain-of-Thought):
1. FIRST check if message is a COMMAND (clean, show, remove, organize, etc.)
2. If command -> use suggest/question/confirm, NEVER fridge_add
3. If not command -> check if product ALREADY EXISTS in fridge context
4. If product exists and user provides new quantity -> ALWAYS use fridge_update
5. If product doesn't exist -> use fridge_add
6. NEVER create duplicate products

UNIT RULES by language:
- Polish (pl): use "{get_unit('pl', 'pcs')}"
- English (en): use "{get_unit('en', 'pcs')}"
- Spanish (es): use "{get_unit('es', 'pcs')}"
- German (de): use "{get_unit('de', 'pcs')}"
- Liquids: "l" or "ml" (universal)
- Weight: "kg" or "g" (universal)

DECISION EXAMPLES:
- User: "I have 2 milks" (or equivalent in {lang_name}), fridge has 1x milk -> fridge_update with quantity: 2
- User: "add bread", fridge: no bread -> fridge_add
- User: "I have milk", fridge: 1x milk -> fridge_update with quantity: 1 (no change, confirm)
"""

        output_format = """
Return response ONLY as JSON in format:
{
  "thinking": "Your internal reasoning - what you understand from user message, what context you see, potential intentions",
  "understanding": "Summary of understanding - what user wants to achieve",
  "actions": [
    {
      "action_type": "action type (fridge_add|fridge_update|fridge_remove|shopping_add|shopping_remove|shopping_toggle|meal_add|meal_remove|suggest|question|clarify|confirm)",
      "target_id": "item id (if update/remove)",
      "data": { ...action data... },
      "reasoning": "why you propose this action",
      "confidence": 0.95,
      "requires_approval": true/false
    }
  ],
  "message": "user-facing message - friendly, specific, MUST be in the configured language",
  "follow_up_questions": ["optional questions if you need more info, in the configured language"]
}

DECISION RULES:
- fridge_update: when user provides new quantity for existing product
- fridge_add: when it's a completely new product
- suggest: when you want to suggest something without changing data
- question: when you don't understand intent
- confirm: when you want confirmation before important change

requires_approval: true for fridge_update, fridge_remove, meal_remove, shopping_remove
"""
        
        return role_definition + "\n" + output_format
    
    def build_user_prompt(
        self,
        user_message: str,
        fridge: list[FridgeItem],
        meals: list[Meal],
        shopping: list[ShoppingItem],
        profile: UserProfile,
        language: str = "en"
    ) -> str:
        """Build rich prompt with full context"""
        
        context = self.context_builder.build_context(
            user_message, fridge, meals, shopping, profile, language
        )
        
        prompt = f"""
USER MESSAGE: "{user_message}"

APPLICATION CONTEXT:
{json.dumps(context, indent=2, ensure_ascii=False)}

CRITICAL INSTRUCTIONS:
1. FIRST check the list of products in fridge (fridge.items)
2. If user talks about a product that's already there -> ALWAYS fridge_update
3. If it's a new product -> fridge_add
4. Example: "I have 2 milks" + fridge has "milk" -> fridge_update (not add!)

Remember: ALL your responses (thinking, understanding, message) MUST be in {lang_name} language.

Return JSON according to system format.
"""
        return prompt


# Helper functions for action execution
def normalize_product_name(name: str) -> str:
    """Normalize product name for comparison"""
    return re.sub(r"\s+", " ", name.strip()).lower()


def find_matching_fridge_item(name: str, fridge: list[FridgeItem]) -> FridgeItem | None:
    """Find if product already exists in fridge (fuzzy matching)"""
    normalized_input = normalize_product_name(name)
    
    for item in fridge:
        normalized_item = normalize_product_name(item.product_name)
        
        # Exact match
        if normalized_input == normalized_item:
            return item
        
        # Contains match (e.g., "milk" matches "milk 2%")
        if normalized_input in normalized_item or normalized_item in normalized_input:
            return item
        
        # Word-by-word match for compound names
        input_words = set(normalized_input.split())
        item_words = set(normalized_item.split())
        if len(input_words) > 0 and len(input_words & item_words) > 0:
            return item
    
    return None


def extract_quantity(text: str) -> tuple[float, str]:
    """Extract quantity from text. Returns (quantity, remaining_text)"""
    text_lower = text.lower()
    quantity = 1.0
    
    # Number at start: "2 milks"
    match = re.search(r'^(\d+(?:\.\d+)?)\s+', text_lower)
    if match:
        quantity = float(match.group(1))
        text = text[match.end():]
    
    # Number after "have": "I have 2 milks"
    match = re.search(r'mam\s+(\d+(?:\.\d+)?)\s+', text_lower)
    if match:
        quantity = float(match.group(1))
        text = text[:match.start()] + text[match.end():]
    
    # "x2" pattern: "milk x2"
    match = re.search(r'[x×]\s*(\d+)$', text_lower)
    if match:
        quantity = float(match.group(1))
        text = text[:match.start()]
    
    return quantity, text
