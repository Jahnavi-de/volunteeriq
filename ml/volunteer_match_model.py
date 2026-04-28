from config import MATCH_WEIGHTS
from utils import clamp, haversine_distance, normalise_skill, to_float


def distance_score(km):
    if km <= 1:
        return 100
    if km <= 5:
        return 86
    if km <= 15:
        return 65
    if km <= 30:
        return 38
    return 12


def skill_score(volunteer_skills, required_skills):
    volunteer_set = {normalise_skill(skill) for skill in volunteer_skills or []}
    required = [normalise_skill(skill) for skill in required_skills or [] if normalise_skill(skill)]
    if not required:
        return 70
    matches = sum(1 for skill in required if skill in volunteer_set)
    return (matches / len(required)) * 100


def availability_score(volunteer):
    status = volunteer.get("status") or volunteer.get("availability")
    if status == "available":
        return 100
    if status == "limited":
        return 62
    if status == "busy":
        return 35
    return 0


def experience_score(volunteer):
    completed = to_float(volunteer.get("tasksCompleted"))
    rating = to_float(volunteer.get("rating"), 4)
    hours = to_float(volunteer.get("totalHours"))
    return clamp(completed * 4 + hours * 0.25 + rating * 10, 20, 100)


def score_volunteer_match(volunteer, need):
    required_skills = need.get("requiredSkills") or ([need.get("requiredSkill")] if need.get("requiredSkill") else [])
    need_location = need.get("location") or {"latitude": need.get("lat"), "longitude": need.get("lng")}
    volunteer_location = volunteer.get("location") or {"latitude": volunteer.get("lat"), "longitude": volunteer.get("lng")}

    distance_km = haversine_distance(
        volunteer_location.get("latitude"),
        volunteer_location.get("longitude"),
        need_location.get("latitude"),
        need_location.get("longitude"),
    )
    skill_match = skill_score(volunteer.get("skills"), required_skills)
    availability_match = availability_score(volunteer)
    urgency_match = clamp(to_float(need.get("urgency") or need.get("priority") or 5) * 10, 10, 100)
    location_match = distance_score(distance_km)
    experience_match = experience_score(volunteer)

    score = (
        skill_match * MATCH_WEIGHTS["skill"]
        + availability_match * MATCH_WEIGHTS["availability"]
        + location_match * MATCH_WEIGHTS["location"]
        + urgency_match * MATCH_WEIGHTS["urgency"]
        + experience_match * MATCH_WEIGHTS["experience"]
    )

    return {
        "needId": need.get("id"),
        "volunteerId": volunteer.get("id"),
        "volunteerName": volunteer.get("name"),
        "score": round(score),
        "distanceKm": round(distance_km, 2),
        "skillMatch": round(skill_match),
        "availabilityMatch": round(availability_match),
        "urgencyMatch": round(urgency_match),
    }
