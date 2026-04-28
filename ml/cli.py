import json
import sys

from demand_model import predict_zone_demand
from text_report_model import analyze_field_report
from utils import haversine_distance
from volunteer_match_model import score_volunteer_match


def main():
    command = sys.argv[1] if len(sys.argv) > 1 else ""
    payload = json.loads(sys.stdin.read() or "{}")

    if command == "analyze-report":
        result = analyze_field_report(payload)
    elif command == "match":
        result = score_volunteer_match(payload.get("volunteer", {}), payload.get("need", {}))
    elif command == "demand":
        result = predict_zone_demand(payload.get("zone", {}), payload.get("tasks", []), payload.get("resources", []))
    elif command == "distance":
        result = {
            "distanceKm": haversine_distance(
                payload.get("lat1"),
                payload.get("lng1"),
                payload.get("lat2"),
                payload.get("lng2"),
            )
        }
    else:
        raise ValueError(f"Unknown ML command: {command}")

    print(json.dumps(result))


if __name__ == "__main__":
    main()
