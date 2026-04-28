from config import CATEGORY_PROFILES, URGENCY_KEYWORDS
from utils import clamp, to_float


def infer_category(text):
    normalized = str(text or "").lower()
    ranked = []

    for category, profile in CATEGORY_PROFILES.items():
        hits = sum(1 for keyword in profile["keywords"] if keyword in normalized)
        ranked.append({"category": category, "hits": hits})

    ranked.sort(key=lambda item: item["hits"], reverse=True)
    return ranked[0]["category"] if ranked and ranked[0]["hits"] > 0 else "Other"


def estimate_urgency(text, affected_people=0):
    normalized = str(text or "").lower()
    keyword_score = sum(weight for keyword, weight in URGENCY_KEYWORDS if keyword in normalized)
    people_score = int((clamp(to_float(affected_people), 0, 1000) + 149) // 150)
    return int(clamp(3 + keyword_score + people_score, 1, 10))


def estimate_volunteers(urgency, affected_people=0):
    population_load = int((to_float(affected_people) + 119) // 120) if affected_people else 1
    urgency_load = 3 if urgency >= 9 else 2 if urgency >= 7 else 1
    return int(clamp(population_load + urgency_load, 1, 12))


def analyze_field_report(report):
    text = " ".join(str(report.get(key, "")) for key in ["title", "description"] if report.get(key))
    affected_people = to_float(report.get("affectedPeople") or report.get("peopleAffected"))
    category = infer_category(text)
    urgency = estimate_urgency(text, affected_people)
    volunteers_needed = estimate_volunteers(urgency, affected_people)
    profile = CATEGORY_PROFILES.get(category, CATEGORY_PROFILES["Other"])

    return {
        "title": report.get("title") or f"{category} support required",
        "description": report.get("description") or "",
        "category": category,
        "urgency": urgency,
        "requiredSkills": profile["skills"],
        "volunteersNeeded": volunteers_needed,
        "extractedNeeds": [
            f"{category} need detected",
            f"{volunteers_needed} volunteer{'s' if volunteers_needed != 1 else ''} recommended",
            f"Urgency scored {urgency}/10",
        ],
        "confidence": round(clamp(0.55 + urgency / 25, 0.55, 0.95), 2),
    }
