const express = require('express');
const Groq = require('groq-sdk');
const { verifyToken } = require('../middleware/auth');
const { db } = require('../config/firebase');
const { analyzeFieldReport, predictZoneDemand } = require('../services/pythonMlBridge');

const router = express.Router();

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

function parseModelJson(content) {
  if (typeof content !== 'string' || content.trim() === '') {
    throw new Error('AI returned an empty response');
  }

  try {
    return JSON.parse(content);
  } catch (directParseError) {
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');

    if (start === -1 || end === -1 || end <= start) {
      throw new Error('AI did not return valid JSON');
    }

    return JSON.parse(content.slice(start, end + 1));
  }
}

function chunkArray(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

router.post('/analyze-report', verifyToken, async (req, res) => {
  try {
    const { reportText } = req.body;

    if (!reportText || reportText.trim() === '') {
      return res.status(400).json({ error: 'reportText is required' });
    }

    if (!process.env.GROQ_API_KEY) {
      const analysis = analyzeFieldReport({ title: 'Field report', description: reportText });
      return res.json({
        success: true,
        analysis: {
          taskType: analysis.category.toLowerCase(),
          urgency: analysis.urgency >= 9 ? 'critical' : analysis.urgency >= 7 ? 'high' : analysis.urgency >= 4 ? 'medium' : 'low',
          priorityScore: analysis.urgency,
          requiredSkills: analysis.requiredSkills,
          estimatedVolunteers: analysis.volunteersNeeded,
          summary: analysis.extractedNeeds.join('. '),
        },
        originalReport: reportText,
        modelSource: 'local-ml-fallback',
      });
    }

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'user',
          content: `Analyze this disaster field report and extract structured information.
Report: "${reportText}"

Return ONLY a valid JSON object with exactly these fields:
{
  "taskType": "one of: first_aid, food_distribution, rescue, logistics, shelter",
  "urgency": "one of: critical, high, medium, low",
  "priorityScore": number between 1 and 10,
  "requiredSkills": ["array", "of", "skills", "needed"],
  "estimatedVolunteers": number of volunteers needed,
  "summary": "one sentence summary of the situation"
}

Return only the JSON. No explanation. No markdown. No backticks.`,
        },
      ],
      temperature: 0,
    });

    const text = completion.choices?.[0]?.message?.content;
    const parsed = parseModelJson(text);

    res.json({
      success: true,
      analysis: parsed,
      originalReport: reportText,
    });
  } catch (err) {
    const statusCode = err.message === 'GROQ_API_KEY is not configured' ? 503 : 500;
    res.status(statusCode).json({ error: err.message });
  }
});

router.get('/recommend/:disasterId', verifyToken, async (req, res) => {
  try {
    const zonesSnap = await db.collection('zones')
      .where('disasterId', '==', req.params.disasterId)
      .get();
    const zones = zonesSnap.docs.map(d => d.data());

    if (zones.length === 0) {
      return res.status(404).json({ error: 'No zones found for this disaster' });
    }

    const zoneIds = zones.map(zone => zone.id);
    const volunteersSnap = await db.collection('volunteers')
      .where('status', '==', 'available')
      .get();
    const volunteers = volunteersSnap.docs.map(d => d.data());

    const openTasks = [];
    for (const zoneIdChunk of chunkArray(zoneIds, 10)) {
      const tasksSnap = await db.collection('tasks')
        .where('status', '==', 'open')
        .where('zoneId', 'in', zoneIdChunk)
        .get();

      openTasks.push(...tasksSnap.docs.map(d => d.data()));
    }

    if (!process.env.GROQ_API_KEY) {
      const resourcesSnap = await db.collection('resources').get();
      const resources = resourcesSnap.docs.map(d => d.data());
      const predictions = zones.map(zone => {
        const zoneTasks = openTasks.filter(task => task.zoneId === zone.id);
        return predictZoneDemand(zone, zoneTasks, resources.filter(resource => resource.zoneId === zone.id));
      });

      return res.json({
        disasterId: req.params.disasterId,
        availableVolunteers: volunteers.length,
        openTasks: openTasks.length,
        recommendations: predictions.map(prediction => ({
          zoneName: prediction.zoneName,
          volunteersNeeded: prediction.recommendedVolunteers,
          priorityReason: `${prediction.shortageRisk} shortage risk with demand score ${prediction.demandScore}/10`,
        })),
        totalVolunteersNeeded: predictions.reduce((sum, prediction) => sum + prediction.recommendedVolunteers, 0),
        criticalShortage: predictions.some(prediction => prediction.shortageRisk === 'critical'),
        advice: 'Prioritize zones with critical shortage risk, assign nearby skilled volunteers first, and rebalance once high-priority tasks move to completed.',
        modelSource: 'local-ml-fallback',
      });
    }

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'user',
          content: `You are an AI disaster relief coordinator.

Current situation:
- Available volunteers: ${volunteers.length}
- Open tasks waiting in this disaster: ${openTasks.length}
- Volunteer skills available: ${[...new Set(volunteers.flatMap(v => v.skills || []))].join(', ')}

Disaster zones:
${zones.map(z => `- ${z.name}: ${z.affectedPeople} people affected, severity: ${z.severity}`).join('\n')}

Open tasks in these zones:
${openTasks.length > 0 ? openTasks.map(task => `- ${task.title} (${task.requiredSkill}) in zone ${task.zoneId}, priority ${task.priority}`).join('\n') : '- None'}

Provide optimal volunteer allocation recommendations.
Return ONLY a valid JSON object:
{
  "recommendations": [
    {
      "zoneName": "zone name",
      "volunteersNeeded": number,
      "priorityReason": "why this zone needs priority"
    }
  ],
  "totalVolunteersNeeded": number,
  "criticalShortage": true or false,
  "advice": "one paragraph of strategic advice for the coordinator"
}

Return only the JSON. No explanation. No markdown. No backticks.`,
        },
      ],
      temperature: 0,
    });

    const text = completion.choices?.[0]?.message?.content;
    const parsed = parseModelJson(text);

    res.json({
      disasterId: req.params.disasterId,
      availableVolunteers: volunteers.length,
      openTasks: openTasks.length,
      ...parsed,
    });
  } catch (err) {
    const statusCode = err.message === 'GROQ_API_KEY is not configured' ? 503 : 500;
    res.status(statusCode).json({ error: err.message });
  }
});

module.exports = router;
