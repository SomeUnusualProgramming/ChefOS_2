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
                headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            )
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


def fallback_chat_action(payload: ChatActionRequest) -> AIActionResponse:
    text = payload.text.lower()
    if "lod" in text and any(k in text for k in ["dodaj", "add", "mam", "kupi"]):
        item_name = re.sub(r"[^a-zA-Ząćęłńóśźż\s]", "", payload.text).strip() or "Produkt"
        item = {
            "id": f"fridge-{uid()}",
            "product_name": item_name.title(),
            "quantity": 1,
            "unit": "pcs",
            "expiration_date": (date.today() + timedelta(days=7)).isoformat(),
            "added_date": date.today().isoformat(),
        }
        return AIActionResponse(type="propose", data=[{"id": f"propose-{uid()}", "type": "fridge_add", "data": item, "description": f"Dodać {item['product_name']} do lodówki", "icon": "fridge"}], message="Przygotowałem propozycję dodania produktu do lodówki.")
    return AIActionResponse(type="unknown", message="Nie rozumiem polecenia. Spróbuj podać konkretną akcję.")


async def llm_chat_action(payload: ChatActionRequest) -> AIActionResponse | None:
    system_prompt = (
        "Zwróć WYŁĄCZNIE JSON: "
        "{\"intent\":\"fridge_add|shopping_add|meal_add|meal_remove|shopping_remove|unknown\","
        "\"items\":[{\"product_name\":\"string\",\"quantity\":number,\"unit\":\"string\"}],"
        "\"meal_name\":\"string|null\","
        "\"message\":\"string\"}."
    )
    state = {
        "text": payload.text,
        "language": payload.language,
        "fridge": [f.model_dump() for f in payload.fridge[:20]],
        "meals": [m.model_dump() for m in payload.meals[:20]],
        "shopping": [s.model_dump() for s in payload.shoppingList[:20]],
    }
    raw = await ollama_chat(system_prompt, json.dumps(state, ensure_ascii=False), json_mode=True)
    if not raw:
        return None

    try:
        parsed = json.loads(raw)
    except Exception:
        return None

    intent = parsed.get("intent", "unknown")
    message = parsed.get("message") or "Przetworzyłem polecenie."
    items = parsed.get("items") or []

    if intent not in {"fridge_add", "shopping_add", "meal_add", "meal_remove", "shopping_remove", "unknown"}:
        intent = "unknown"

    if intent == "unknown":
        return AIActionResponse(type="unknown", message=message)

    if intent == "meal_remove":
        target = payload.meals[0].id if payload.meals else ""
        if not target:
            return AIActionResponse(type="unknown", message="Nie znaleziono posiłku do usunięcia.")
        action = ProposedAction(
            id=f"propose-{uid()}",
            type="meal_remove",
            data={"mealId": target},
            description="Usunąć wskazany posiłek z planu",
            icon="meal",
        )
        return AIActionResponse(type="propose", data=[action.model_dump()], message=message)

    if intent == "shopping_remove":
        target = payload.shoppingList[0].id if payload.shoppingList else ""
        if not target:
            return AIActionResponse(type="unknown", message="Nie znaleziono pozycji zakupowej do usunięcia.")
        action = ProposedAction(
            id=f"propose-{uid()}",
            type="shopping_remove",
            data={"itemId": target},
            description="Usunąć wskazaną pozycję z listy zakupów",
            icon="shopping",
        )
        return AIActionResponse(type="propose", data=[action.model_dump()], message=message)

    proposals: list[ProposedAction] = []

    for item in items[:5]:
        product_name = str(item.get("product_name") or "Produkt").strip().title()
        quantity = float(item.get("quantity") or 1)
        unit = str(item.get("unit") or "pcs")

        if intent == "fridge_add":
            fridge_item = {
                "id": f"fridge-{uid()}",
                "product_name": product_name,
                "quantity": quantity,
                "unit": unit,
                "expiration_date": (date.today() + timedelta(days=7)).isoformat(),
                "added_date": date.today().isoformat(),
            }
            proposals.append(
                ProposedAction(
                    id=f"propose-{uid()}",
                    type="fridge_add",
                    data=fridge_item,
                    description=f"Dodać {product_name} do lodówki",
                    icon="fridge",
                )
            )
        elif intent == "shopping_add":
            shopping_item = {
                "id": f"shopping-{uid()}",
                "product_name": product_name,
                "quantity": quantity,
                "unit": unit,
                "purchased": False,
            }
            proposals.append(
                ProposedAction(
                    id=f"propose-{uid()}",
                    type="shopping_add",
                    data=shopping_item,
                    description=f"Dodać {product_name} do listy zakupów",
                    icon="shopping",
                )
            )

    if intent == "meal_add":
        meal_name = str(parsed.get("meal_name") or "Nowy posiłek").strip()
        meal = {
            "id": f"meal-{uid()}",
            "day": date.today().isoformat(),
            "meal_type": "dinner",
            "name": meal_name,
            "products": [{"product_name": p.get("product_name", "Produkt"), "quantity": float(p.get("quantity") or 1), "unit": p.get("unit") or "portion"} for p in items[:5]] or [{"product_name": "Produkt", "quantity": 1, "unit": "portion"}],
            "calories": 500,
            "macros": {"protein": 30, "carbs": 50, "fat": 20},
        }
        proposals.append(
            ProposedAction(
                id=f"propose-{uid()}",
                type="meal_add",
                data=meal,
                description=f"Zaplanować posiłek: {meal_name}",
                icon="meal",
            )
        )

    if not proposals:
        return AIActionResponse(type="unknown", message="Nie udało się wygenerować propozycji akcji.")

    return AIActionResponse(type="propose", data=[p.model_dump() for p in proposals], message=message)


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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
