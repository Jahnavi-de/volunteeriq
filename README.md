# VolunteerIQ

VolunteerIQ is a web-based volunteer coordination platform designed for NGOs, disaster response teams, and social-impact coordinators. It uses machine learning to analyze field reports, identify urgent needs, predict required skills and volunteer count, and recommend the best volunteers for each task.

## Theme / Track

**Smart Resource Allocation**  
Data-Driven Volunteer Coordination for Social Impact

## Problem Statement

During disasters and social-impact emergencies, NGOs and local coordinators often struggle to assign the right volunteers to the right tasks quickly.

Common challenges include:

- Field reports are usually unstructured and difficult to process manually.
- Volunteer skills, availability, and locations are scattered.
- Manual task allocation causes delays and mismatches.
- Coordinators lack real-time visibility into urgent needs and assignment coverage.

## Proposed Solution

VolunteerIQ solves this by providing a smart coordination dashboard where coordinators can submit field reports and receive ML-powered insights.

The system analyzes reports, predicts urgency, detects required skills, estimates the number of volunteers needed, and recommends suitable volunteers based on multiple factors such as skills, distance, availability, experience, and urgency.

## Key Features

### 1. Field Report Analysis

Coordinators can submit disaster or field reports in natural language.

The Python ML model predicts:

- Need category
- Urgency score
- Required volunteer skills
- Number of volunteers needed

Example:

```text
Flooding reported near Sector 12. Families need food packets and medical support urgently.
