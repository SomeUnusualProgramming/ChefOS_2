from __future__ import annotations

import json
import os
import re
import uuid
from datetime import date, datetime, timedelta
from typing import Any, Literal

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Import intelligent agent system
from ai_agents import AgentSystem, ContextBuilder, AIResponse, AIAction, find_matching_fridge_item, extract_quantity

# Initialize AI agent system
agent_system = AgentSystem()


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


class AISuggestion(BaseModel):
    id: str
    agent: Literal["fridge", "chef", "shopping", "coach", "fridge_cleanup"]
    type: Literal["info", "warning", "action", "tip"]
    message: str
    action: str | None = None
    data: dict[str, Any] | None = None
    dismissed: bool
    timestamp: str


class FridgeCleanupSuggestion(BaseModel):
    item: FridgeItem
    issues: list[Literal["unknown_product", "suspicious_name", "no_category", "typo"]]
    suggestedName: str | None = None
    suggestedCategory: str | None = None
    confidence: float
    action: Literal["review", "delete", "ignore"]


class RunAgentsRequest(BaseModel):
    fridge: list[FridgeItem]
    profile: UserProfile
    language: Literal["en", "pl", "es", "de"] = "pl"


class RunAgentsResponse(BaseModel):
    suggestions: list[AISuggestion]
    meals: list[Meal]
    shoppingList: list[ShoppingItem]
    cleanupItems: list[FridgeCleanupSuggestion]


class ProposedAction(BaseModel):
    id: str
    type: Literal["fridge_add", "shopping_add", "meal_add", "meal_remove", "shopping_remove"]
    data: dict[str, Any]
    description: str
    icon: Literal["fridge", "shopping", "meal"]


class AIActionResponse(BaseModel):
    type: Literal[
        "fridge_add",
        "fridge_remove",
        "fridge_update",
        "meal_add",
        "meal_remove",
        "shopping_add",
        "shopping_remove",
        "shopping_toggle",
        "propose",
        "unknown",
    ]
    data: dict[str, Any] | list[dict[str, Any]] | None = None
    message: str


class ChatActionRequest(BaseModel):
    text: str
    language: Literal["en", "pl", "es", "de"] = "pl"
    fridge: list[FridgeItem] = Field(default_factory=list)
    meals: list[Meal] = Field(default_factory=list)
    shoppingList: list[ShoppingItem] = Field(default_factory=list)


app = FastAPI(title="ChefOS AI Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
GROQ_BASE_URL = "https://api.groq.com/openai/v1"

MEAL_TEMPLATES: list[dict[str, Any]] = [
    {"name": "Chicken Bowl", "type": "lunch", "cal": 450, "p": 35, "c": 20, "f": 25, "products": ["chicken breast", "rice", "broccoli"]},
    {"name": "Oatmeal", "type": "breakfast", "cal": 320, "p": 10, "c": 55, "f": 8, "products": ["oats", "milk", "banana"]},
    {"name": "Salmon Plate", "type": "dinner", "cal": 550, "p": 40, "c": 45, "f": 18, "products": ["salmon", "rice", "lemon"]},
    {"name": "Greek Yogurt", "type": "snack", "cal": 280, "p": 20, "c": 30, "f": 10, "products": ["yogurt", "granola", "berries"]},
]

KNOWN_PRODUCTS = {
    "milk": "dairy",
    "chicken": "meat",
    "chicken breast": "meat",
    "beef": "meat",
    "salmon": "fish",
    "yogurt": "dairy",
    "rice": "grains",
    "oats": "grains",
    "tomato": "vegetables",
    "lettuce": "vegetables",
    "banana": "fruits",
    "apple": "fruits",
    "bread": "grains",
}


def uid() -> str:
    return uuid.uuid4().hex[:8]


def now_iso() -> str:
    return datetime.utcnow().isoformat()


def parse_iso_day(day: str) -> date:
    return datetime.strptime(day, "%Y-%m-%d").date()


def days_until_expiry(item: FridgeItem) -> int:
    return (parse_iso_day(item.expiration_date) - date.today()).days


def is_suspicious_name(text: str) -> bool:
    if len(text.strip()) < 2:
        return True
    if re.search(r"(drop table|delete from|script|<script|http://|https://|cmd|powershell)", text, re.IGNORECASE):
        return True
    letters = re.sub(r"[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]", "", text)
    if letters and not re.search(r"[aeiouyąęó]", letters, re.IGNORECASE):
        return True
    return False


def normalize_product_name(name: str) -> str:
    return re.sub(r"\s+", " ", name.strip()).lower()


def run_fridge_agent(fridge: list[FridgeItem]) -> list[AISuggestion]:
    suggestions: list[AISuggestion] = []
    if not fridge:
        suggestions.append(
            AISuggestion(
                id=uid(),
                agent="fridge",
                type="action",
                message="Lodówka jest pusta. Dodaj produkty, aby uruchomić planowanie.",
                dismissed=False,
                timestamp=now_iso(),
            )
        )
        return suggestions

    for item in fridge:
        days = days_until_expiry(item)
        if days < 0:
            suggestions.append(
                AISuggestion(
                    id=uid(),
                    agent="fridge",
                    type="warning",
                    message=f"{item.product_name} jest przeterminowany.",
                    dismissed=False,
                    timestamp=now_iso(),
                )
            )
        elif days <= 2:
            suggestions.append(
                AISuggestion(
                    id=uid(),
                    agent="fridge",
                    type="warning",
                    message=f"{item.product_name} traci ważność za {days} dni.",
                    dismissed=False,
                    timestamp=now_iso(),
                )
            )
    return suggestions


def run_cleanup_agent(fridge: list[FridgeItem]) -> tuple[list[AISuggestion], list[FridgeCleanupSuggestion]]:
    cleanup_items: list[FridgeCleanupSuggestion] = []
    suggestions: list[AISuggestion] = []

    for item in fridge:
        issues: list[Literal["unknown_product", "suspicious_name", "no_category", "typo"]] = []
        action: Literal["review", "delete", "ignore"] = "ignore"
        normalized = normalize_product_name(item.product_name)

        if is_suspicious_name(item.product_name):
            issues.append("suspicious_name")
            action = "delete"

        if normalized not in KNOWN_PRODUCTS:
            issues.append("unknown_product")
            if action != "delete":
                action = "review"

        if not item.category or item.category == "other":
            issues.append("no_category")
            if action == "ignore":
                action = "review"

        if issues:
            cleanup_items.append(
                FridgeCleanupSuggestion(
                    item=item,
                    issues=issues,
                    suggestedName=item.product_name.title() if "unknown_product" in issues else None,
                    suggestedCategory=KNOWN_PRODUCTS.get(normalized),
                    confidence=0.7 if "unknown_product" in issues else 0.9,
                    action=action,
                )
            )

    critical = [c for c in cleanup_items if c.action == "delete"]
    review = [c for c in cleanup_items if c.action == "review"]

    if critical:
        suggestions.append(
            AISuggestion(
                id=uid(),
                agent="fridge_cleanup",
                type="warning",
                message=f"Wykryto {len(critical)} podejrzanych pozycji do usunięcia.",
                action="cleanup",
                data={"cleanupItems": [c.model_dump() for c in critical]},
                dismissed=False,
                timestamp=now_iso(),
            )
        )

    if review:
        suggestions.append(
            AISuggestion(
                id=uid(),
                agent="fridge_cleanup",
                type="action",
                message=f"{len(review)} produktów wymaga przeglądu.",
                action="review",
                data={"cleanupItems": [c.model_dump() for c in review]},
                dismissed=False,
                timestamp=now_iso(),
            )
        )

    return suggestions, cleanup_items


def run_chef_agent(fridge: list[FridgeItem], profile: UserProfile) -> tuple[list[Meal], list[AISuggestion]]:
    meals: list[Meal] = []
    suggestions: list[AISuggestion] = []

    for offset in range(7):
        target_day = (date.today() + timedelta(days=offset)).isoformat()
        for meal_type in ["breakfast", "lunch", "dinner", "snack"]:
            templates = [t for t in MEAL_TEMPLATES if t["type"] == meal_type]
            template = templates[offset % len(templates)]
            meals.append(
                Meal(
                    id=uid(),
                    day=target_day,
                    meal_type=meal_type,
                    name=template["name"],
                    products=[MealProduct(product_name=p, quantity=1, unit="portion") for p in template["products"]],
                    calories=template["cal"],
                    macros={"protein": template["p"], "carbs": template["c"], "fat": template["f"]},
                )
            )

    suggestions.append(
        AISuggestion(
            id=uid(),
            agent="chef",
            type="info",
            message="Utworzono 7-dniowy plan posiłków.",
            dismissed=False,
            timestamp=now_iso(),
        )
    )

    if not profile.goals:
        suggestions.append(
            AISuggestion(
                id=uid(),
                agent="chef",
                type="action",
                message="Uzupełnij cele zdrowotne w profilu dla lepszej personalizacji.",
                dismissed=False,
                timestamp=now_iso(),
            )
        )

    return meals, suggestions


def run_shopping_agent(meals: list[Meal], fridge: list[FridgeItem]) -> tuple[list[ShoppingItem], list[AISuggestion]]:
    fridge_map: dict[str, float] = {}
    for item in fridge:
        key = normalize_product_name(item.product_name)
        fridge_map[key] = fridge_map.get(key, 0) + item.quantity

    needed: dict[str, dict[str, Any]] = {}
    for meal in meals:
        for product in meal.products:
            key = normalize_product_name(product.product_name)
            if key not in needed:
                needed[key] = {"qty": 0.0, "meals": set()}
            needed[key]["qty"] += product.quantity
            needed[key]["meals"].add(meal.name)

    shopping_list: list[ShoppingItem] = []
    for key, val in needed.items():
        missing = val["qty"] - fridge_map.get(key, 0)
        if missing > 0:
            shopping_list.append(
                ShoppingItem(
                    id=uid(),
                    product_name=key.title(),
                    quantity=float(round(missing, 2)),
                    unit="portion",
                    meal_association=", ".join(sorted(val["meals"])),
                    purchased=False,
                )
            )

    suggestions = [
        AISuggestion(
            id=uid(),
            agent="shopping",
            type="info",
            message=f"Lista zakupów zaktualizowana: {len(shopping_list)} pozycji.",
            dismissed=False,
            timestamp=now_iso(),
        )
    ]
    return shopping_list, suggestions


def run_coach_agent(profile: UserProfile) -> list[AISuggestion]:
    suggestions: list[AISuggestion] = []

    if not profile.weight or not profile.height:
        suggestions.append(
            AISuggestion(
                id=uid(),
                agent="coach",
                type="action",
                message="Uzupełnij wagę i wzrost w profilu, aby otrzymać porady fitness.",
                dismissed=False,
                timestamp=now_iso(),
            )
        )
        return suggestions

    bmi = profile.weight / ((profile.height / 100) ** 2)
    if bmi < 18.5:
        text = "BMI wskazuje niedowagę. Rozważ zwiększenie kalorii."
    elif bmi < 25:
        text = "BMI w normie. Utrzymuj obecny kierunek."
    elif bmi < 30:
        text = "BMI podwyższone. Wprowadź regularny ruch i kontrolę kalorii."
    else:
        text = "BMI wysokie. Skoncentruj się na diecie i aktywności."

    suggestions.append(
        AISuggestion(
            id=uid(),
            agent="coach",
            type="info",
            message=f"Twoje BMI: {bmi:.1f}. {text}",
            dismissed=False,
            timestamp=now_iso(),
        )
    )
    return suggestions


async def llm_chat(system_prompt: str, user_prompt: str, json_mode: bool = False) -> str | None:
    """Chat using Groq API (OpenAI-compatible). Falls back to None on error."""
    if not GROQ_API_KEY:
        return None

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    payload: dict[str, Any] = {
        "model": GROQ_MODEL,
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": 1024,
    }

    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{GROQ_BASE_URL}/chat/completions",
                json=payload,
                headers={"Authorization": f"Bearer {GROQ_API_KEY.strip()}", "Content-Type": "application/json"},
            )
            
            # Check for auth errors
            if response.status_code == 401:
                print(f"Groq API key invalid (401). Key: {GROQ_API_KEY[:20]}...")
                return None
                
            response.raise_for_status()
            body = response.json()
            return body.get("choices", [{}])[0].get("message", {}).get("content")
    except httpx.HTTPStatusError as e:
        print(f"Groq API error: {e.response.status_code} - {e.response.text}")
        return None
    except httpx.TimeoutException:
        print("Groq API timeout")
        return None
    except Exception as e:
        print(f"Groq API error: {e}")
        return None


# Backward compatibility alias
async def ollama_chat(system_prompt: str, user_prompt: str, json_mode: bool = False) -> str | None:
    return await llm_chat(system_prompt, user_prompt, json_mode)


async def ai_enhance_suggestions(
    language: str,
    fridge: list[FridgeItem],
    profile: UserProfile,
    meals: list[Meal],
    shopping_list: list[ShoppingItem],
) -> list[AISuggestion]:
    context = {
        "language": language,
        "fridgeCount": len(fridge),
        "goals": profile.goals or [],
        "todayMeals": [m.model_dump() for m in meals if m.day == date.today().isoformat()],
        "shoppingPending": len([i for i in shopping_list if not i.purchased]),
    }

    system_prompt = (
        "Jesteś pomocnym asystentem dietetycznym. Zwróć WYŁĄCZNIE JSON w formacie "
        "{\"suggestions\":[{\"agent\":\"coach|chef|shopping|fridge\",\"type\":\"info|tip|action|warning\",\"message\":\"...\"}]}. "
        "Maksymalnie 2 sugestie, krótkie, konkretne."
    )

    user_prompt = json.dumps(context, ensure_ascii=False)
    raw = await ollama_chat(system_prompt, user_prompt, json_mode=True)
    if not raw:
        return []

    try:
        parsed = json.loads(raw)
        result: list[AISuggestion] = []
        for item in parsed.get("suggestions", [])[:2]:
            agent = item.get("agent")
            suggestion_type = item.get("type")
            message = item.get("message")
            if agent in {"coach", "chef", "shopping", "fridge"} and suggestion_type in {"info", "tip", "action", "warning"} and isinstance(message, str):
                result.append(
                    AISuggestion(
                        id=uid(),
                        agent=agent,
                        type=suggestion_type,
                        message=message,
                        dismissed=False,
                        timestamp=now_iso(),
                    )
                )
        return result
    except Exception:
        return []


def _extract_product_and_quantity(text: str, fridge: list[FridgeItem]) -> tuple[str, float, FridgeItem | None] | None:
    """Extract product name and quantity from text. Returns (product_name, quantity, existing_item_or_none)"""
    text_lower = text.lower()

    # Extract number from text (Polish and English patterns)
    # Patterns: "mam 2 mleka", "2 mleka", "mam dwa mleka", "mleko - 2 szt", "mleko x2"
    quantity = 1.0
    quantity_match = re.search(r'(?:mam\s+|kupi[łl][ea]?m?\s+|dodaj\s+|^)\s*(\d+)\s+', text_lower)
    if quantity_match:
        quantity = float(quantity_match.group(1))

    # Also check for "x2" or "x 2" pattern at end
    x_match = re.search(r'[x×]\s*(\d+)$', text_lower)
    if x_match:
        quantity = float(x_match.group(1))

    # Remove common filler words to get product name
    # Polish verb forms: mam, mamy, masz, mają + English have/has
    filler_words = [
        # Polish verb variations (mam = I have, mamy = we have, etc.)
        r'mam[ayą]?', r'ma[sś]z', r'maj[ąa]',
        # English have/has
        r'have\b', r'has\b', r'got\b',
        # Action words
        r'dodaj\b', r'kupi[lł][ea]?m?', r'jest\b',
        # Location phrases
        r'w\s+lod[oó]wce\b', r'do\s+lod[oó]wki\b',
        r'w\s+fridge\b', r'in\s+fridge\b',
        # Units
        r'szt\.?\b', r'sztuk[ia]?\b', r'litr[óoy]?\b', r'kg\b', r'gram[óoy]?\b',
        r'butelk[ai]\b', r'opakow[ae]ni[ae]\b', r'pude[lł]k[oa]\b',
        r'pcs\b', r'bottle\b', r'pack\b',
        # Numbers at end or xN pattern
        r'\d+\s*$', r'[x×]\s*\d+\s*$',
    ]

    # Clean step by step
    product_text = text_lower
    for pattern in filler_words:
        product_text = re.sub(pattern, '', product_text, flags=re.IGNORECASE)
    
    # Remove leftover artifacts
    product_text = re.sub(r'\s+', ' ', product_text)  # multiple spaces -> single
    product_text = re.sub(r'^\s*[–-]\s*', '', product_text)  # leading dash
    product_text = re.sub(r'\s*[–-]\s*$', '', product_text)  # trailing dash

    # Clean up and title case
    product_name = product_text.strip().rstrip('.,;:!?').strip()
    if not product_name or len(product_name) < 2:
        return None

    product_name = product_name.title()

    # Check if similar product exists in fridge
    existing_item = None
    normalized_input = normalize_product_name(product_name)

    for item in fridge:
        normalized_item = normalize_product_name(item.product_name)
        # Check for exact match or contained match
        if normalized_input == normalized_item:
            existing_item = item
            break
        if normalized_input in normalized_item or normalized_item in normalized_input:
            existing_item = item
            break

    return (product_name, quantity, existing_item)


def fallback_chat_action(payload: ChatActionRequest) -> AIActionResponse:
    text = payload.text.lower()

    # Check if this is about fridge and contains a product mention
    fridge_keywords = ["lodówka", "lodówce", "lodowka", "lodowce", "lodówki", "fridge", "mam", "dodaj"]
    if any(k in text for k in fridge_keywords):
        extracted = _extract_product_and_quantity(payload.text, payload.fridge)

        if extracted:
            product_name, quantity, existing_item = extracted

            if existing_item:
                # Product exists - propose quantity update
                new_quantity = quantity if quantity != 1 else existing_item.quantity + 1

                return AIActionResponse(
                    type="fridge_update",
                    data={
                        "itemId": existing_item.id,
                        "product_name": existing_item.product_name,
                        "old_quantity": existing_item.quantity,
                        "new_quantity": new_quantity,
                    },
                    message=f"Zaktualizować ilość '{existing_item.product_name}' z {existing_item.quantity} do {new_quantity}?"
                )
            else:
                # New product - propose add
                item = {
                    "id": f"fridge-{uid()}",
                    "product_name": product_name,
                    "quantity": quantity,
                    "unit": "szt",
                    "expiration_date": (date.today() + timedelta(days=7)).isoformat(),
                    "added_date": date.today().isoformat(),
                }
                return AIActionResponse(
                    type="propose",
                    data=[{
                        "id": f"propose-{uid()}",
                        "type": "fridge_add",
                        "data": item,
                        "description": f"Dodać {item['product_name']} ({quantity} szt) do lodówki",
                        "icon": "fridge"
                    }],
                    message=f"Przygotowałem propozycję dodania {product_name} do lodówki."
                )

    # Default: unknown
    return AIActionResponse(
        type="unknown",
        message="Nie rozumiem polecenia. Spróbuj podać konkretną akcję, np. 'mam 2 mleka w lodówce'."
    )


async def llm_chat_action(payload: ChatActionRequest) -> AIActionResponse | None:
    """
    New intelligent chat action using chain-of-thought reasoning.
    AI understands context, reasons about user intent, and proposes smart actions.
    """
    
    # Build rich context for AI
    system_prompt = agent_system.get_system_prompt(payload.language)
    user_prompt = agent_system.build_user_prompt(
        user_message=payload.text,
        fridge=payload.fridge,
        meals=payload.meals,
        shopping=payload.shoppingList,
        profile=UserProfile(),  # Empty profile for now, can be extended
        language=payload.language
    )
    
    # DEBUG: Log what we're sending to AI
    print(f"\n=== AI CHAT ACTION ===")
    print(f"User message: {payload.text}")
    print(f"Fridge items count: {len(payload.fridge)}")
    if payload.fridge:
        print(f"Fridge items: {[f'{item.product_name} ({item.quantity} {item.unit})' for item in payload.fridge[:5]]}")
    
    # Call LLM with rich context
    raw = await llm_chat(system_prompt, user_prompt, json_mode=True)
    
    # DEBUG: Log AI response
    print(f"AI raw response: {raw[:500] if raw else 'None'}...")
    
    if not raw:
        return None
    
    try:
        parsed = json.loads(raw)
        
        # Validate response structure
        if "actions" not in parsed or "thinking" not in parsed:
            print(f"Invalid AI response structure: {parsed}")
            return None
        
        # Convert AI actions to frontend-compatible format
        actions = parsed.get("actions", [])
        if not actions:
            return AIActionResponse(
                type="unknown",
                message=parsed.get("message", "Nie zidentyfikowałem konkretnej akcji do wykonania.")
            )
        
        # Take the first high-confidence action
        best_action = None
        for action in actions:
            if action.get("confidence", 0) > 0.6:
                best_action = action
                break
        
        if not best_action:
            return AIActionResponse(
                type="unknown",
                message=parsed.get("message", "Nie jestem pewien co zrobić. Czy możesz doprecyzować?")
            )
        
        action_type = best_action.get("action_type", "unknown")
        
        # Handle different action types
        if action_type == "fridge_add":
            data = best_action.get("data", {})
            product_name = data.get("product_name", "Produkt")
            quantity = data.get("quantity", 1)
            
            # Check if product already exists (AI might have missed this)
            existing = find_matching_fridge_item(product_name, payload.fridge)
            if existing:
                # Convert to update instead
                return AIActionResponse(
                    type="fridge_update",
                    data={
                        "itemId": existing.id,
                        "new_quantity": quantity,
                        "product_name": existing.product_name,
                    },
                    message=f"Zaktualizować ilość '{existing.product_name}' do {quantity}?"
                )
            
            # Create new fridge item
            item = {
                "id": f"fridge-{uid()}",
                "product_name": product_name,
                "quantity": quantity,
                "unit": data.get("unit", "szt"),
                "expiration_date": (date.today() + timedelta(days=7)).isoformat(),
                "added_date": date.today().isoformat(),
                "category": data.get("category"),
            }
            
            return AIActionResponse(
                type="propose",
                data=[{
                    "id": f"propose-{uid()}",
                    "type": "fridge_add",
                    "data": item,
                    "description": f"Dodać {product_name} ({quantity} szt) do lodówki",
                    "icon": "fridge"
                }],
                message=parsed.get("message", f"Chcę dodać {product_name} do lodówki.")
            )
        
        elif action_type == "fridge_update":
            data = best_action.get("data", {})
            target_id = best_action.get("target_id")
            new_quantity = data.get("quantity", 1)
            
            # If target_id not provided, try to find by name
            if not target_id and data.get("product_name"):
                existing = find_matching_fridge_item(data["product_name"], payload.fridge)
                if existing:
                    target_id = existing.id
            
            if target_id:
                return AIActionResponse(
                    type="fridge_update",
                    data={
                        "itemId": target_id,
                        "new_quantity": new_quantity,
                    },
                    message=parsed.get("message", f"Zaktualizować ilość do {new_quantity}?")
                )
        
        elif action_type == "fridge_remove":
            target_id = best_action.get("target_id")
            if target_id:
                return AIActionResponse(
                    type="fridge_remove",
                    data={"itemId": target_id},
                    message=parsed.get("message", "Usunąć produkt z lodówki?")
                )
        
        elif action_type == "shopping_add":
            data = best_action.get("data", {})
            item = {
                "id": f"shopping-{uid()}",
                "product_name": data.get("product_name", "Produkt"),
                "quantity": data.get("quantity", 1),
                "unit": data.get("unit", "szt"),
                "purchased": False,
            }
            return AIActionResponse(
                type="propose",
                data=[{
                    "id": f"propose-{uid()}",
                    "type": "shopping_add",
                    "data": item,
                    "description": f"Dodać {item['product_name']} do listy zakupów",
                    "icon": "shopping"
                }],
                message=parsed.get("message", "Dodaję do listy zakupów.")
            )
        
        elif action_type == "shopping_remove":
            target_id = best_action.get("target_id")
            if target_id:
                return AIActionResponse(
                    type="propose",
                    data=[{
                        "id": f"propose-{uid()}",
                        "type": "shopping_remove",
                        "data": {"itemId": target_id},
                        "description": "Usunąć pozycję z listy zakupów",
                        "icon": "shopping"
                    }],
                    message=parsed.get("message", "Usuwam z listy zakupów.")
                )
        
        elif action_type == "meal_add":
            data = best_action.get("data", {})
            meal = {
                "id": f"meal-{uid()}",
                "day": date.today().isoformat(),
                "meal_type": data.get("meal_type", "dinner"),
                "name": data.get("name", "Nowy posiłek"),
                "products": data.get("products", []),
                "calories": data.get("calories", 500),
                "macros": data.get("macros", {"protein": 30, "carbs": 50, "fat": 20}),
            }
            return AIActionResponse(
                type="propose",
                data=[{
                    "id": f"propose-{uid()}",
                    "type": "meal_add",
                    "data": meal,
                    "description": f"Zaplanować: {meal['name']}",
                    "icon": "meal"
                }],
                message=parsed.get("message", "Planuję posiłek.")
            )
        
        elif action_type == "suggest" or action_type == "question" or action_type == "clarify":
            # Just return message without actions
            return AIActionResponse(
                type="unknown",
                message=parsed.get("message", "Co mogę dla Ciebie zrobić?")
            )
        
        return AIActionResponse(
            type="unknown",
            message=parsed.get("message", "Rozumiem, ale nie jestem pewien jak pomóc.")
        )
        
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        return None
    except Exception as e:
        print(f"Error processing AI response: {e}")
        import traceback
        print(traceback.format_exc())
        return None


@app.get("/health")
async def health() -> dict[str, Any]:
    # Check Groq API connection
    groq_status = "ok" if GROQ_API_KEY else "no_key"
    if GROQ_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    f"{GROQ_BASE_URL}/models",
                    headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                )
                if response.status_code != 200:
                    groq_status = "error"
        except Exception:
            groq_status = "unavailable"

    return {
        "status": "ok",
        "groq": groq_status,
        "model": GROQ_MODEL if GROQ_API_KEY else OLLAMA_MODEL,
    }


@app.post("/api/agents/run", response_model=RunAgentsResponse)
async def run_agents(payload: RunAgentsRequest) -> RunAgentsResponse:
    fridge_suggestions = run_fridge_agent(payload.fridge)
    cleanup_suggestions, cleanup_items = run_cleanup_agent(payload.fridge)
    meals, chef_suggestions = run_chef_agent(payload.fridge, payload.profile)
    shopping_list, shopping_suggestions = run_shopping_agent(meals, payload.fridge)
    coach_suggestions = run_coach_agent(payload.profile)
    ai_suggestions = await ai_enhance_suggestions(payload.language, payload.fridge, payload.profile, meals, shopping_list)

    return RunAgentsResponse(
        suggestions=[
            *fridge_suggestions,
            *cleanup_suggestions,
            *chef_suggestions,
            *shopping_suggestions,
            *coach_suggestions,
            *ai_suggestions,
        ],
        meals=meals,
        shoppingList=shopping_list,
        cleanupItems=cleanup_items,
    )


@app.post("/api/agents/chat-action", response_model=AIActionResponse)
async def chat_action(payload: ChatActionRequest) -> AIActionResponse:
    try:
        action = await llm_chat_action(payload)
        if action is not None:
            return action
        return fallback_chat_action(payload)
    except Exception as e:
        import traceback
        print(f"ERROR in chat_action: {e}")
        print(traceback.format_exc())
        # Return fallback instead of crashing
        return fallback_chat_action(payload)


# Dedicated fridge chat endpoint
class FridgeChatMessage(BaseModel):
    role: str
    content: str


class FridgeChatRequest(BaseModel):
    message: str
    fridge: list[FridgeItem]
    language: Literal["en", "pl", "es", "de"] = "pl"
    history: list[FridgeChatMessage] = Field(default_factory=list)


class FridgeChatAction(BaseModel):
    id: str
    type: Literal["fridge_add", "fridge_update", "fridge_remove", "suggest"]
    description: str
    data: dict[str, Any] | None = None


class FridgeChatResponse(BaseModel):
    message: str
    actions: list[FridgeChatAction] | None = None


@app.post("/api/agents/fridge-chat", response_model=FridgeChatResponse)
async def fridge_chat(payload: FridgeChatRequest) -> FridgeChatResponse:
    """Dedicated fridge assistant - answers questions about fridge contents only."""
    
    # Build fridge-focused system prompt
    language_names = {"pl": "Polish", "en": "English", "es": "Spanish", "de": "German"}
    lang_name = language_names.get(payload.language, "English")
    
    system_prompt = f"""You are a dedicated FRIDGE ASSISTANT for ChefOS. Your ONLY job is to help users with their fridge/pantry.

AVAILABLE TOPICS:
- What products are in the fridge and their quantities
- Which products are expiring soon or expired
- Suggestions for using products before they expire
- Organization and cleanup tips
- What meals can be cooked with available ingredients

RULES:
1. ALWAYS respond in {lang_name} language
2. If user asks about anything NOT related to fridge/food/pantry, politely redirect to fridge topics
3. Be concise and helpful
4. Check expiration dates and warn about expiring products
5. Suggest actions when appropriate (add, update, remove products)

WHEN USER ASKS FOR ACTIONS:
- If they want to add/update/remove: return "actions" in your response
- Action types: "fridge_add", "fridge_update", "fridge_remove", "suggest"

Never hallucinate products that don't exist in the context."""

    # Build rich fridge context
    today = date.today()
    fridge_analysis = []
    
    for item in payload.fridge:
        exp_date = datetime.strptime(item.expiration_date, "%Y-%m-%d").date()
        days_left = (exp_date - today).days
        status = "expired" if days_left < 0 else "expiring_soon" if days_left <= 2 else "fresh"
        
        fridge_analysis.append({
            "name": item.product_name,
            "quantity": item.quantity,
            "unit": item.unit,
            "days_left": days_left,
            "status": status,
            "id": item.id,
        })
    
    # Count by status
    expired = [f for f in fridge_analysis if f["status"] == "expired"]
    expiring = [f for f in fridge_analysis if f["status"] == "expiring_soon"]
    fresh = [f for f in fridge_analysis if f["status"] == "fresh"]
    
    # Build user prompt with context
    user_prompt = f"""USER QUESTION: "{payload.message}"

CURRENT FRIDGE STATE:
Total products: {len(payload.fridge)}
- Expired: {len(expired)} ({', '.join([f["name"] for f in expired[:3]])})
- Expiring soon (≤2 days): {len(expiring)} ({', '.join([f["name"] for f in expiring[:3]])})
- Fresh: {len(fresh)}

ALL PRODUCTS:
{json.dumps(fridge_analysis, indent=2, ensure_ascii=False)}

Respond with JSON in this format:
{{
  "message": "your friendly response in {lang_name}",
  "actions": [
    {{
      "id": "action-1",
      "type": "suggest|fridge_add|fridge_update|fridge_remove",
      "description": "button text for user",
      "data": {{...optional action data...}}
    }}
  ] or null if no actions needed
}}"""
    
    try:
        raw = await llm_chat(system_prompt, user_prompt, json_mode=True)
        
        if not raw:
            return FridgeChatResponse(
                message="Przepraszam, nie mogę teraz odpowiedzieć. Spróbuj ponownie." if payload.language == "pl" else "Sorry, I can't respond right now. Please try again."
            )
        
        parsed = json.loads(raw)
        
        # Convert actions if present
        actions = None
        if "actions" in parsed and parsed["actions"]:
            actions = [
                FridgeChatAction(
                    id=a.get("id", f"action-{i}"),
                    type=a.get("type", "suggest"),
                    description=a.get("description", "Action"),
                    data=a.get("data"),
                )
                for i, a in enumerate(parsed["actions"])
                if a.get("type") in ["fridge_add", "fridge_update", "fridge_remove", "suggest"]
            ]
        
        return FridgeChatResponse(
            message=parsed.get("message", "Rozumiem." if payload.language == "pl" else "I understand."),
            actions=actions if actions else None,
        )
        
    except Exception as e:
        print(f"Fridge chat error: {e}")
        import traceback
        print(traceback.format_exc())
        
        # Fallback: simple rule-based response
        msg_lower = payload.message.lower()
        
        # Check for specific questions
        if any(w in msg_lower for w in ["wygasa", "expires", "termin", "expiry"]):
            if expiring:
                product_names = ", ".join([f["name"] for f in expiring[:3]])
                return FridgeChatResponse(
                    message=f"Produkty wygasające w ciągu 2 dni: {product_names}" if payload.language == "pl" else f"Products expiring within 2 days: {product_names}",
                    actions=[
                        FridgeChatAction(
                            id="view-expiring",
                            type="suggest",
                            description="Zobacz wszystkie wygasające" if payload.language == "pl" else "View all expiring",
                        )
                    ]
                )
            else:
                return FridgeChatResponse(
                    message="Brak produktów wygasających w ciągu 2 dni." if payload.language == "pl" else "No products expiring within 2 days.",
                )
        
        elif any(w in msg_lower for w in ["ile", "how many", "count", "liczba"]):
            return FridgeChatResponse(
                message=f"W lodówce masz {len(payload.fridge)} produktów." if payload.language == "pl" else f"You have {len(payload.fridge)} products in the fridge.",
            )
        
        elif any(w in msg_lower for w in ["ugotować", "cook", "obiad", "dinner", "przepis", "recipe"]):
            if payload.fridge:
                products = ", ".join([f["name"] for f in fresh[:5]])
                return FridgeChatResponse(
                    message=f"Możesz ugotować coś z: {products}" if payload.language == "pl" else f"You can cook with: {products}",
                    actions=[
                        FridgeChatAction(
                            id="suggest-meals",
                            type="suggest",
                            description="Zobacz sugerowane posiłki" if payload.language == "pl" else "View suggested meals",
                        )
                    ]
                )
        
        return FridgeChatResponse(
            message="Jestem asystentem lodówkowym. Zapytaj o produkty, daty ważności lub co możesz ugotować!" if payload.language == "pl" else "I'm your fridge assistant. Ask about products, expiration dates, or what you can cook!",
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
