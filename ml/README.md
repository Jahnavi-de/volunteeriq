# ML Model Layer

This folder contains the Python ML/model logic used by the prototype.

- `text_report_model.py` classifies field report text into need category, urgency score, required skills and estimated volunteers.
- `volunteer_match_model.py` scores volunteer-to-need matches using skill overlap, availability, distance, urgency and experience.
- `demand_model.py` predicts zone demand, recommended volunteers and shortage risk.
- `config.py` stores model keywords and scoring weights.
- `cli.py` is the command-line entry point used by the Node.js backend bridge.

The backend calls this Python model through `volunteer-backend-main/src/services/pythonMlBridge.js`.
