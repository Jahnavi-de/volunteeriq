const path = require('path');
const { spawnSync } = require('child_process');

const cliPath = path.resolve(__dirname, '..', '..', '..', 'ml', 'cli.py');

function runPython(command, payload) {
  const input = JSON.stringify(payload || {});
  const attempts = process.env.PYTHON_BIN
    ? [{ command: process.env.PYTHON_BIN, args: [cliPath, command] }]
    : [
        { command: 'python', args: [cliPath, command] },
        { command: 'py', args: ['-3', cliPath, command] },
      ];

  let lastError = null;

  for (const attempt of attempts) {
    const result = spawnSync(attempt.command, attempt.args, {
      input,
      encoding: 'utf8',
      windowsHide: true,
    });

    if (result.error) {
      lastError = result.error;
      continue;
    }

    if (result.status !== 0) {
      throw new Error(result.stderr || `Python ML command failed: ${command}`);
    }

    try {
      return JSON.parse(result.stdout);
    } catch (err) {
      throw new Error(`Python ML returned invalid JSON: ${result.stdout}`);
    }
  }

  throw lastError || new Error('Python executable not found');
}

function analyzeFieldReport(report) {
  return runPython('analyze-report', report);
}

function scoreVolunteerMatch(volunteer, need) {
  return runPython('match', { volunteer, need });
}

function predictZoneDemand(zone, tasks = [], resources = []) {
  return runPython('demand', { zone, tasks, resources });
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  return runPython('distance', { lat1, lng1, lat2, lng2 }).distanceKm;
}

module.exports = {
  analyzeFieldReport,
  haversineDistance,
  predictZoneDemand,
  scoreVolunteerMatch,
};
