from utils import clamp, to_float


def predict_zone_demand(zone, tasks=None, resources=None):
    tasks = tasks or []
    resources = resources or []
    open_tasks = [task for task in tasks if task.get("status") in ["open", "assigned", "in_progress"]]
    avg_priority = (
        sum(to_float(task.get("priority"), 1) for task in open_tasks) / len(open_tasks)
        if open_tasks
        else 0
    )
    low_resources = 0

    for resource in resources:
        sent = to_float(resource.get("quantitySent"))
        if sent > 0 and to_float(resource.get("quantityRemaining")) / sent < 0.25:
            low_resources += 1

    severity = zone.get("severity")
    severity_boost = 3 if severity == "critical" else 2 if severity == "high" else 1
    affected_boost = int((to_float(zone.get("affectedPeople")) + 199) // 200)
    demand_score = int(
        clamp(round(len(open_tasks) * 1.5 + avg_priority + low_resources * 2 + severity_boost + affected_boost), 1, 10)
    )

    if demand_score >= 8:
        shortage_risk = "critical"
    elif demand_score >= 6:
        shortage_risk = "high"
    elif demand_score >= 4:
        shortage_risk = "medium"
    else:
        shortage_risk = "low"

    return {
        "zoneId": zone.get("id"),
        "zoneName": zone.get("name"),
        "demandScore": demand_score,
        "recommendedVolunteers": int(clamp((demand_score + 1) // 2 + len(open_tasks), 1, 15)),
        "shortageRisk": shortage_risk,
    }
