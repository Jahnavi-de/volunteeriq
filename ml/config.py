CATEGORY_PROFILES = {
    "Medical": {
        "skills": ["first_aid", "medical"],
        "keywords": [
            "injured",
            "injury",
            "bleeding",
            "medicine",
            "medical",
            "doctor",
            "hospital",
            "first aid",
            "fever",
        ],
    },
    "Rescue": {
        "skills": ["rescue", "driving"],
        "keywords": ["trapped", "rescue", "evacuate", "evacuation", "collapsed", "stuck", "flooded", "stranded"],
    },
    "Food": {
        "skills": ["food_distribution", "cooking"],
        "keywords": ["food", "meal", "water", "hungry", "ration", "kitchen", "milk", "supplies"],
    },
    "Shelter": {
        "skills": ["shelter", "logistics"],
        "keywords": ["shelter", "blanket", "camp", "homeless", "roof", "tent", "sleep", "relief center"],
    },
    "Other": {
        "skills": ["logistics"],
        "keywords": ["logistics", "transport", "coordinate", "volunteer", "support"],
    },
}

URGENCY_KEYWORDS = [
    ("critical", 3),
    ("urgent", 3),
    ("immediate", 3),
    ("emergency", 3),
    ("children", 2),
    ("elderly", 2),
    ("pregnant", 2),
    ("night", 1),
    ("shortage", 1),
    ("blocked", 1),
    ("severe", 2),
    ("danger", 2),
]

MATCH_WEIGHTS = {
    "skill": 0.35,
    "availability": 0.25,
    "location": 0.18,
    "urgency": 0.12,
    "experience": 0.10,
}
