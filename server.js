// ================================================================
//  DEAD MAN'S DEBUG — Server
//  A pirate-themed competitive debugging arena
//  "Fix the code or walk the plank!"
// ================================================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { generateChallenges, getPoolSize } = require('./challenge-bank');

const { Pool } = require('pg');
const pgPool = new Pool({
  host: 'db.uajhnbdaemscqaympogz.supabase.co',
  port: 6543,
  user: 'postgres',
  password: 'Bethelegend@21',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 5
});

pgPool.query(`
  CREATE TABLE IF NOT EXISTS participant_scores (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    team_name VARCHAR(255),
    score INT,
    solved INT,
    total_attempts INT,
    last_submission BIGINT
  )
`).then(() => {
  console.log('Connected to PostgreSQL DB & table ready');
}).catch(err => console.error('PG Connect Error:', err.message));

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;

// ============ MIDDLEWARE ============
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ============ DATA STORE ============
const DB = {
  admin: {
    username: 'captain',
    passwordHash: bcrypt.hashSync('blackpearl', 10)
  },
  participants: new Map(),
  challenges: new Map(),
  submissions: new Map(),
  rounds: {
    1: {
      id: 1, name: 'The First Fix', difficulty: 'Easy – Moderate',
      status: 'idle', challengeIds: [],
      startTime: null, endTime: null,
      duration: 45 * 60 * 1000,
      maxAttempts: 2
    },
    2: {
      id: 2, name: 'The Final Debug', difficulty: 'Moderate – Hard',
      status: 'idle', challengeIds: [],
      startTime: null, endTime: null,
      duration: 45 * 60 * 1000,
      maxAttempts: 4
    }
  },
  activeRound: null
};

const sessions = new Map();
let roundTimers = {};

// Ensure temp directory exists
const TEMP_DIR = path.join(__dirname, 'data', 'temp');
fs.mkdirSync(TEMP_DIR, { recursive: true });

// ============ PERSISTENCE ============
const DB_FILE = path.join(__dirname, 'data', 'db.json');

let saveTimeout = null;
function saveDB() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const data = {
      participants: Array.from(DB.participants.entries()),
      challenges: Array.from(DB.challenges.entries()),
      submissions: Array.from(DB.submissions.entries()),
      rounds: DB.rounds,
      activeRound: DB.activeRound
    };
    fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), (err) => {
      if (err) console.error('Save error:', err.message);
    });
  }, 1000); // 1-second debounce
}

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      if (data.participants) DB.participants = new Map(data.participants);
      if (data.challenges) DB.challenges = new Map(data.challenges);
      if (data.submissions) DB.submissions = new Map(data.submissions);
      if (data.rounds) DB.rounds = data.rounds;
      if (data.activeRound) DB.activeRound = data.activeRound;
      console.log('  Database loaded from disk');
    }
  } catch (e) { console.error('Load error:', e.message); }
}

loadDB();
setTimeout(async () => {
  if (typeof calculateLeaderboard === 'function') {
    const lb = calculateLeaderboard();
    for (const entry of lb) {
      try {
        await pgPool.query(`
          INSERT INTO participant_scores (id, name, team_name, score, solved, total_attempts, last_submission)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING
        `, [entry.id, entry.name, entry.teamName, entry.score, entry.solved, entry.totalAttempts, entry.lastSubmission]);
      } catch(e) {}
    }
    if (typeof broadcastLeaderboard === 'function') broadcastLeaderboard();
  }
}, 2000);

// ============ AUTH HELPERS ============
function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized — Walk the plank, impostor!' });
  }
  req.session = sessions.get(token);
  next();
}

function adminOnly(req, res, next) {
  if (req.session.type !== 'admin') {
    return res.status(403).json({ error: 'Only the Captain gives orders here!' });
  }
  next();
}

// ================================================================
//  AUTH ROUTES
// ================================================================

app.post('/api/auth/admin-login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Speak up! Username and password required.' });
  }
  if (username !== DB.admin.username || !bcrypt.compareSync(password, DB.admin.passwordHash)) {
    return res.status(401).json({ error: 'Wrong credentials, ye scurvy dog!' });
  }
  const token = uuidv4();
  sessions.set(token, { type: 'admin', id: 'admin' });
  res.json({ token, type: 'admin', message: 'Welcome aboard, Captain!' });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, teamName } = req.body;
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Every pirate needs a proper name (min 2 chars)!' });
  }

  const cleanName = name.trim();
  for (const [, p] of DB.participants) {
    if (p.name.toLowerCase() === cleanName.toLowerCase()) {
      return res.status(409).json({ error: 'That pirate name be taken, matey! Choose another.' });
    }
  }

  const id = uuidv4();
  const participant = {
    id, name: cleanName,
    teamName: teamName?.trim() || 'Solo Pirate',
    createdAt: Date.now(),
    totalScore: 0
  };
  DB.participants.set(id, participant);

  try {
    const result = await pgPool.query('INSERT INTO participant_scores (id, name, team_name, score, solved, total_attempts, last_submission) VALUES ($1, $2, $3, 0, 0, 0, 0) ON CONFLICT (id) DO NOTHING', [id, cleanName, participant.teamName]);
    console.log(`[DB] Inserted participant "${cleanName}" into Supabase (rows: ${result.rowCount})`);
  } catch(e) { console.error('[DB] PG insert error for', cleanName, ':', e.message); }

  const token = uuidv4();
  sessions.set(token, { type: 'participant', id });

  io.to('admin-room').emit('participant:joined', participant);
  saveDB();
  broadcastLeaderboard();

  res.json({ token, type: 'participant', participant });
});

app.post('/api/auth/participant-login', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'State yer name, pirate!' });

  let found = null;
  for (const [, p] of DB.participants) {
    if (p.name.toLowerCase() === name.trim().toLowerCase()) {
      found = p;
      break;
    }
  }
  if (!found) {
    return res.status(404).json({ error: 'No pirate by that name on this ship! Register first.' });
  }

  const token = uuidv4();
  sessions.set(token, { type: 'participant', id: found.id });
  res.json({ token, type: 'participant', participant: found });
});

// ================================================================
//  ADMIN ROUTES
// ================================================================

// Dashboard stats
app.get('/api/admin/stats', authenticate, adminOnly, (req, res) => {
  const totalParticipants = DB.participants.size;
  const totalChallenges = DB.challenges.size;
  const totalSubmissions = DB.submissions.size;
  let successfulSubmissions = 0;
  for (const [, s] of DB.submissions) {
    if (s.status === 'passed') successfulSubmissions++;
  }
  res.json({
    totalParticipants,
    totalChallenges,
    totalSubmissions,
    successfulSubmissions,
    rounds: DB.rounds,
    activeRound: DB.activeRound
  });
});

// Participants
app.get('/api/admin/participants', authenticate, adminOnly, (req, res) => {
  const participants = Array.from(DB.participants.values()).map(p => {
    const subs = Array.from(DB.submissions.values()).filter(s => s.participantId === p.id);
    return { ...p, submissionCount: subs.length, solvedCount: subs.filter(s => s.status === 'passed').length };
  });
  res.json(participants);
});

app.delete('/api/admin/participants/:id', authenticate, adminOnly, (req, res) => {
  if (!DB.participants.has(req.params.id)) {
    return res.status(404).json({ error: 'Pirate not found!' });
  }
  DB.participants.delete(req.params.id);
  // Remove their sessions
  for (const [token, session] of sessions) {
    if (session.id === req.params.id) sessions.delete(token);
  }
  saveDB();
  res.json({ message: 'Pirate walked the plank!' });
});

// ============ CHALLENGE CRUD ============

app.post('/api/admin/challenges', authenticate, adminOnly, (req, res) => {
  const { title, description, buggyCode, language, testCases, difficulty, round, hints, timeLimit } = req.body;

  if (!title || !buggyCode || !language || !testCases || !round) {
    return res.status(400).json({ error: 'Missing required fields! Title, code, language, test cases, and round are required.' });
  }

  const id = uuidv4();
  const challenge = {
    id, title, description: description || '',
    buggyCode, language,
    testCases: Array.isArray(testCases) ? testCases : JSON.parse(testCases),
    difficulty: difficulty || 'moderate',
    round: parseInt(round),
    hints: hints || [],
    timeLimit: timeLimit || 10,
    createdAt: Date.now()
  };

  DB.challenges.set(id, challenge);

  // Add to round's challenge list
  if (DB.rounds[challenge.round]) {
    if (!DB.rounds[challenge.round].challengeIds.includes(id)) {
      DB.rounds[challenge.round].challengeIds.push(id);
    }
  }

  saveDB();
  res.json(challenge);
});

// ============ AI CHALLENGE GENERATOR ============

app.post('/api/admin/ai-generate', authenticate, adminOnly, (req, res) => {
  const { round1Count, round2Count } = req.body;

  const r1Count = parseInt(round1Count) || 0;
  const r2Count = parseInt(round2Count) || 0;

  if (r1Count === 0 && r2Count === 0) {
    return res.status(400).json({ error: 'Set at least one question count, Captain!' });
  }

  const r1Max = getPoolSize(1);
  const r2Max = getPoolSize(2);

  if (r1Count > r1Max) {
    return res.status(400).json({ error: `Maximum ${r1Max} challenges available for Round 1` });
  }
  if (r2Count > r2Max) {
    return res.status(400).json({ error: `Maximum ${r2Max} challenges available for Round 2` });
  }

  const created = [];

  // Generate Round 1 challenges
  if (r1Count > 0) {
    const r1Challenges = generateChallenges(1, r1Count);
    for (const ch of r1Challenges) {
      const id = uuidv4();
      const challenge = { id, ...ch, createdAt: Date.now() };
      DB.challenges.set(id, challenge);
      if (!DB.rounds[1].challengeIds.includes(id)) {
        DB.rounds[1].challengeIds.push(id);
      }
      created.push(challenge);
    }
  }

  // Generate Round 2 challenges
  if (r2Count > 0) {
    const r2Challenges = generateChallenges(2, r2Count);
    for (const ch of r2Challenges) {
      const id = uuidv4();
      const challenge = { id, ...ch, createdAt: Date.now() };
      DB.challenges.set(id, challenge);
      if (!DB.rounds[2].challengeIds.includes(id)) {
        DB.rounds[2].challengeIds.push(id);
      }
      created.push(challenge);
    }
  }

  saveDB();

  res.json({
    message: `🤖 AI Generated ${created.length} challenges! (${r1Count} for Round 1, ${r2Count} for Round 2)`,
    challenges: created,
    poolInfo: { round1Available: r1Max, round2Available: r2Max }
  });
});

app.get('/api/admin/ai-pool-info', authenticate, adminOnly, (req, res) => {
  res.json({ round1Available: getPoolSize(1), round2Available: getPoolSize(2) });
});

app.get('/api/admin/challenges', authenticate, adminOnly, (req, res) => {
  const challenges = Array.from(DB.challenges.values());
  res.json(challenges);
});

app.get('/api/admin/challenges/:id', authenticate, adminOnly, (req, res) => {
  const challenge = DB.challenges.get(req.params.id);
  if (!challenge) return res.status(404).json({ error: 'Challenge not found!' });
  res.json(challenge);
});

app.put('/api/admin/challenges/:id', authenticate, adminOnly, (req, res) => {
  const challenge = DB.challenges.get(req.params.id);
  if (!challenge) return res.status(404).json({ error: 'Challenge not found!' });

  const updates = req.body;
  if (updates.testCases && typeof updates.testCases === 'string') {
    updates.testCases = JSON.parse(updates.testCases);
  }

  const oldRound = challenge.round;
  Object.assign(challenge, updates);

  // Update round assignments if round changed
  if (updates.round && updates.round !== oldRound) {
    const oldRoundData = DB.rounds[oldRound];
    if (oldRoundData) {
      oldRoundData.challengeIds = oldRoundData.challengeIds.filter(cid => cid !== challenge.id);
    }
    const newRoundData = DB.rounds[parseInt(updates.round)];
    if (newRoundData && !newRoundData.challengeIds.includes(challenge.id)) {
      newRoundData.challengeIds.push(challenge.id);
    }
  }

  DB.challenges.set(challenge.id, challenge);
  saveDB();
  res.json(challenge);
});

app.delete('/api/admin/challenges/:id', authenticate, adminOnly, (req, res) => {
  const challenge = DB.challenges.get(req.params.id);
  if (!challenge) return res.status(404).json({ error: 'Challenge not found!' });

  // Remove from round
  const roundData = DB.rounds[challenge.round];
  if (roundData) {
    roundData.challengeIds = roundData.challengeIds.filter(cid => cid !== challenge.id);
  }

  DB.challenges.delete(req.params.id);
  saveDB();
  res.json({ message: 'Challenge destroyed!' });
});

// ============ ROUND CONTROL ============

app.post('/api/admin/rounds/:id/start', authenticate, adminOnly, (req, res) => {
  const roundId = parseInt(req.params.id);
  const round = DB.rounds[roundId];
  if (!round) return res.status(404).json({ error: 'Round not found!' });

  if (DB.activeRound && DB.activeRound !== roundId) {
    return res.status(400).json({ error: `Round ${DB.activeRound} is still active! End it first.` });
  }

  if (round.challengeIds.length === 0) {
    return res.status(400).json({ error: 'No challenges assigned to this round!' });
  }

  // Allow custom duration from request
  if (req.body.duration) {
    round.duration = parseInt(req.body.duration) * 60 * 1000;
  }

  round.status = 'active';
  round.startTime = Date.now();
  round.endTime = round.startTime + round.duration;
  DB.activeRound = roundId;

  // Get challenges for this round
  const challenges = round.challengeIds
    .map(cid => DB.challenges.get(cid))
    .filter(Boolean)
    .map(c => ({
      id: c.id, title: c.title, description: c.description,
      buggyCode: c.buggyCode, language: c.language,
      difficulty: c.difficulty, hints: c.hints,
      timeLimit: c.timeLimit
    }));

  // Broadcast to all participants
  io.to('participant-room').emit('round:started', {
    round: { id: roundId, name: round.name, difficulty: round.difficulty, maxAttempts: round.maxAttempts },
    challenges,
    endTime: round.endTime,
    duration: round.duration
  });

  io.to('admin-room').emit('round:started', {
    roundId, name: round.name, startTime: round.startTime, endTime: round.endTime
  });

  // Start countdown timer
  startRoundTimer(roundId);

  saveDB();
  res.json({ message: `Round ${roundId} — "${round.name}" has begun!`, round });
});

app.post('/api/admin/rounds/:id/stop', authenticate, adminOnly, (req, res) => {
  const roundId = parseInt(req.params.id);
  const round = DB.rounds[roundId];
  if (!round) return res.status(404).json({ error: 'Round not found!' });

  round.status = 'ended';
  round.endTime = Date.now();
  DB.activeRound = null;

  // Clear timer
  if (roundTimers[roundId]) {
    clearInterval(roundTimers[roundId]);
    delete roundTimers[roundId];
  }

  io.emit('round:ended', { roundId, name: round.name });
  broadcastLeaderboard();
  saveDB();

  res.json({ message: `Round ${roundId} has ended!`, round });
});

app.post('/api/admin/rounds/:id/reset', authenticate, adminOnly, (req, res) => {
  const roundId = parseInt(req.params.id);
  const round = DB.rounds[roundId];
  if (!round) return res.status(404).json({ error: 'Round not found!' });

  round.status = 'idle';
  round.startTime = null;
  round.endTime = null;

  if (roundTimers[roundId]) {
    clearInterval(roundTimers[roundId]);
    delete roundTimers[roundId];
  }

  // Clear submissions for this round
  const roundChallengeIds = new Set(round.challengeIds);
  for (const [sid, sub] of DB.submissions) {
    if (roundChallengeIds.has(sub.challengeId)) {
      DB.submissions.delete(sid);
    }
  }

  // Reset participant scores (recalculate)
  recalculateScores();
  DB.activeRound = null;

  saveDB();
  res.json({ message: `Round ${roundId} reset.`, round });
});

app.get('/api/admin/rounds', authenticate, adminOnly, (req, res) => {
  res.json({ rounds: DB.rounds, activeRound: DB.activeRound });
});

app.put('/api/admin/rounds/:id', authenticate, adminOnly, (req, res) => {
  const roundId = parseInt(req.params.id);
  const round = DB.rounds[roundId];
  if (!round) return res.status(404).json({ error: 'Round not found!' });

  if (req.body.duration) round.duration = parseInt(req.body.duration) * 60 * 1000;
  if (req.body.maxAttempts) round.maxAttempts = parseInt(req.body.maxAttempts);
  if (req.body.name) round.name = req.body.name;

  saveDB();
  res.json(round);
});

// ============ SUBMISSIONS (Admin view) ============

app.get('/api/admin/submissions', authenticate, adminOnly, (req, res) => {
  const submissions = Array.from(DB.submissions.values()).map(s => {
    const participant = DB.participants.get(s.participantId);
    const challenge = DB.challenges.get(s.challengeId);
    return {
      ...s,
      participantName: participant?.name || 'Unknown',
      challengeTitle: challenge?.title || 'Unknown'
    };
  }).sort((a, b) => b.timestamp - a.timestamp);
  res.json(submissions);
});

// Admin reset everything
app.post('/api/admin/reset-all', authenticate, adminOnly, async (req, res) => {
  DB.participants.clear();
  DB.challenges.clear();
  DB.submissions.clear();
  DB.rounds[1] = { id: 1, name: 'The First Fix', difficulty: 'Easy – Moderate', status: 'idle', challengeIds: [], startTime: null, endTime: null, duration: 45 * 60 * 1000, maxAttempts: 2 };
  DB.rounds[2] = { id: 2, name: 'The Final Debug', difficulty: 'Moderate – Hard', status: 'idle', challengeIds: [], startTime: null, endTime: null, duration: 45 * 60 * 1000, maxAttempts: 4 };
  DB.activeRound = null;
  sessions.clear();
  Object.values(roundTimers).forEach(t => clearInterval(t));
  roundTimers = {};
  saveDB();
  try {
    await pgPool.query('TRUNCATE TABLE participant_scores');
  } catch (err) { console.error('Error truncating table:', err); }
  broadcastLeaderboard();
  res.json({ message: 'All data purged! Fresh start.' });
});

// Admin announcement
app.post('/api/admin/announce', authenticate, adminOnly, (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required!' });
  io.emit('announcement', { message, timestamp: Date.now() });
  res.json({ message: 'Announcement sent!' });
});

// ================================================================
//  PARTICIPANT ROUTES
// ================================================================

// Get my info
app.get('/api/participant/me', authenticate, (req, res) => {
  if (req.session.type !== 'participant') {
    return res.status(403).json({ error: 'Not a participant!' });
  }
  const participant = DB.participants.get(req.session.id);
  if (!participant) return res.status(404).json({ error: 'Participant not found!' });

  // Get my submissions
  const mySubmissions = Array.from(DB.submissions.values())
    .filter(s => s.participantId === participant.id)
    .map(s => {
      const ch = DB.challenges.get(s.challengeId);
      return { ...s, challengeTitle: ch?.title || 'Unknown' };
    });

  res.json({ ...participant, submissions: mySubmissions });
});

// Get active challenges (for current round)
app.get('/api/challenges/active', authenticate, (req, res) => {
  if (!DB.activeRound) {
    return res.json({ challenges: [], round: null, message: 'No active round. Wait for the Captain\'s orders!' });
  }

  const round = DB.rounds[DB.activeRound];
  const challenges = round.challengeIds
    .map(cid => DB.challenges.get(cid))
    .filter(Boolean)
    .map(c => ({
      id: c.id, title: c.title, description: c.description,
      buggyCode: c.buggyCode, language: c.language,
      difficulty: c.difficulty, hints: c.hints,
      timeLimit: c.timeLimit
    }));

  // Get participant's attempt counts
  const participantId = req.session.id;
  const attemptCounts = {};
  for (const [, s] of DB.submissions) {
    if (s.participantId === participantId) {
      attemptCounts[s.challengeId] = (attemptCounts[s.challengeId] || 0) + 1;
    }
  }

  // Check which are solved
  const solvedSet = new Set();
  for (const [, s] of DB.submissions) {
    if (s.participantId === participantId && s.status === 'passed') {
      solvedSet.add(s.challengeId);
    }
  }

  res.json({
    challenges: challenges.map(c => ({
      ...c,
      attempts: attemptCounts[c.id] || 0,
      maxAttempts: round.maxAttempts,
      solved: solvedSet.has(c.id)
    })),
    round: { id: round.id, name: round.name, maxAttempts: round.maxAttempts, endTime: round.endTime, difficulty: round.difficulty },
    activeRound: DB.activeRound
  });
});

// Submit code
app.post('/api/submissions', authenticate, async (req, res) => {
  if (req.session.type !== 'participant') {
    return res.status(403).json({ error: 'Only crew members can submit!' });
  }

  const { challengeId, code } = req.body;
  if (!challengeId || !code) {
    return res.status(400).json({ error: 'Challenge ID and code required!' });
  }

  // Check if round is active
  if (!DB.activeRound) {
    return res.status(400).json({ error: 'No active round!' });
  }

  const round = DB.rounds[DB.activeRound];

  // Check if time is up
  if (round.endTime && Date.now() > round.endTime) {
    return res.status(400).json({ error: 'Time\'s up! The round has ended.' });
  }

  const challenge = DB.challenges.get(challengeId);
  if (!challenge) return res.status(404).json({ error: 'Challenge not found!' });

  // Check attempts
  const previousAttempts = Array.from(DB.submissions.values())
    .filter(s => s.participantId === req.session.id && s.challengeId === challengeId);

  if (previousAttempts.length >= round.maxAttempts) {
    return res.status(400).json({ error: `Ye've used all ${round.maxAttempts} attempts, matey!` });
  }

  // Check if already solved
  const alreadySolved = previousAttempts.some(s => s.status === 'passed');
  if (alreadySolved) {
    return res.status(400).json({ error: 'Ye already conquered this challenge!' });
  }

  const attemptNumber = previousAttempts.length + 1;

  // Evaluate the code
  try {
    const results = await evaluateCode(code, challenge.language, challenge.testCases);

    const allPassed = results.every(r => r.passed);
    const passedCount = results.filter(r => r.passed).length;
    const totalTests = results.length;
    const avgExecTime = results.reduce((sum, r) => sum + (r.executionTime || 0), 0) / results.length;

    // Calculate score
    let score = 0;
    if (allPassed) {
      const baseScore = 100;
      const timeBonus = Math.max(0, 50 - Math.floor((Date.now() - round.startTime) / (round.duration / 50)));
      const attemptPenalty = (attemptNumber - 1) * 15;
      const efficiencyBonus = avgExecTime < 500 ? 20 : avgExecTime < 1000 ? 10 : 0;
      score = Math.max(10, baseScore + timeBonus - attemptPenalty + efficiencyBonus);
    }

    const submission = {
      id: uuidv4(),
      participantId: req.session.id,
      challengeId,
      code,
      attempt: attemptNumber,
      status: allPassed ? 'passed' : 'failed',
      testResults: results.map((r, i) => ({
        testCase: i + 1,
        passed: r.passed,
        expected: r.expected,
        got: r.output,
        error: r.error,
        executionTime: r.executionTime
      })),
      passedTests: passedCount,
      totalTests,
      executionTime: Math.round(avgExecTime),
      score,
      timestamp: Date.now()
    };

    DB.submissions.set(submission.id, submission);

    // Update Postgres immediately
    try {
      if (allPassed) {
        await pgPool.query('UPDATE participant_scores SET score = score + $1, solved = solved + 1, total_attempts = total_attempts + 1, last_submission = $2 WHERE id = $3', [score, Date.now(), req.session.id]);
      } else {
        await pgPool.query('UPDATE participant_scores SET total_attempts = total_attempts + 1, last_submission = $1 WHERE id = $2', [Date.now(), req.session.id]);
      }
    } catch (err) { console.error('PG Update error:', err); }

    // Keep memory in sync
    if (allPassed) {
      recalculateScores();
    }

    saveDB();

    // Notify admin
    const participant = DB.participants.get(req.session.id);
    io.to('admin-room').emit('submission:new', {
      ...submission,
      participantName: participant?.name,
      challengeTitle: challenge.title
    });

    // Broadcast new leaderboard
    broadcastLeaderboard();

    res.json({
      submission: {
        id: submission.id,
        status: submission.status,
        attempt: submission.attempt,
        passedTests: submission.passedTests,
        totalTests: submission.totalTests,
        score: submission.score,
        executionTime: submission.executionTime,
        testResults: submission.testResults
      },
      message: allPassed
        ? `🏴‍☠️ Treasure found! All ${totalTests} test cases passed! +${score} doubloons!`
        : `💀 ${passedCount}/${totalTests} tests passed. Debug harder, matey!`,
      attemptsRemaining: round.maxAttempts - attemptNumber
    });

  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({ error: 'Code evaluation failed: ' + error.message });
  }
});

// Get my submissions
app.get('/api/submissions/mine', authenticate, (req, res) => {
  const subs = Array.from(DB.submissions.values())
    .filter(s => s.participantId === req.session.id)
    .map(s => {
      const ch = DB.challenges.get(s.challengeId);
      return { ...s, challengeTitle: ch?.title || 'Unknown' };
    })
    .sort((a, b) => b.timestamp - a.timestamp);
  res.json(subs);
});

// ============ LEADERBOARD ============

app.get('/api/leaderboard', async (req, res) => {
  try {
    const result = await pgPool.query('SELECT * FROM participant_scores ORDER BY score DESC, last_submission ASC');
    if (result.rows.length === 0) {
      return res.json(calculateLeaderboard());
    }
    const board = result.rows.map((row, i) => ({
      id: row.id,
      name: row.name,
      teamName: row.team_name,
      score: row.score,
      solved: row.solved,
      totalAttempts: row.total_attempts,
      lastSubmission: Number(row.last_submission),
      rank: i + 1
    }));
    res.json(board);
  } catch (err) {
    console.error('PG Fetch error:', err);
    res.json(calculateLeaderboard());
  }
});

function calculateLeaderboard() {
  const board = [];
  for (const [, participant] of DB.participants) {
    const subs = Array.from(DB.submissions.values()).filter(s => s.participantId === participant.id);
    const solvedChallenges = new Set(subs.filter(s => s.status === 'passed').map(s => s.challengeId));
    const totalScore = subs.filter(s => s.status === 'passed')
      .reduce((sum, s) => {
        // Only count best score per challenge
        return sum;
      }, 0);

    // Best score per challenge
    const bestScores = {};
    for (const s of subs) {
      if (s.status === 'passed') {
        if (!bestScores[s.challengeId] || s.score > bestScores[s.challengeId]) {
          bestScores[s.challengeId] = s.score;
        }
      }
    }
    const score = Object.values(bestScores).reduce((a, b) => a + b, 0);

    board.push({
      id: participant.id,
      name: participant.name,
      teamName: participant.teamName,
      score,
      solved: solvedChallenges.size,
      totalAttempts: subs.length,
      lastSubmission: subs.length > 0 ? Math.max(...subs.map(s => s.timestamp)) : 0
    });
  }

  // Sort by score desc, then by last submission time asc (earlier = better tie-break)
  board.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.lastSubmission - b.lastSubmission;
  });

  return board.map((entry, i) => ({ ...entry, rank: i + 1 }));
}

async function broadcastLeaderboard() {
  try {
    const result = await pgPool.query('SELECT * FROM participant_scores ORDER BY score DESC, last_submission ASC');
    const board = result.rows.map((row, i) => ({
      id: row.id,
      name: row.name,
      teamName: row.team_name,
      score: row.score,
      solved: row.solved,
      totalAttempts: row.total_attempts,
      lastSubmission: Number(row.last_submission),
      rank: i + 1
    }));
    io.emit('leaderboard:update', board);
  } catch (err) {
    console.error('Broadcast PG error:', err);
  }
}

function recalculateScores() {
  for (const [, participant] of DB.participants) {
    const subs = Array.from(DB.submissions.values()).filter(s => s.participantId === participant.id && s.status === 'passed');
    const bestScores = {};
    for (const s of subs) {
      if (!bestScores[s.challengeId] || s.score > bestScores[s.challengeId]) {
        bestScores[s.challengeId] = s.score;
      }
    }
    participant.totalScore = Object.values(bestScores).reduce((a, b) => a + b, 0);
  }
}

// ================================================================
//  CODE EVALUATION ENGINE
// ================================================================

async function evaluateCode(code, language, testCases) {
  const results = [];

  for (const tc of testCases) {
    try {
      const result = await runCode(code, language, tc.input || '');
      const expected = (tc.expectedOutput || tc.output || '').trim().replace(/\r\n/g, '\n');
      const actual = result.stdout.trim().replace(/\r\n/g, '\n');
      const passed = actual === expected;

      results.push({
        passed,
        output: actual,
        expected,
        error: result.stderr || null,
        executionTime: result.executionTime
      });
    } catch (error) {
      results.push({
        passed: false,
        output: '',
        expected: (tc.expectedOutput || tc.output || '').trim(),
        error: error.message,
        executionTime: 0
      });
    }
  }

  return results;
}

function runCode(code, language, input) {
  return new Promise(async (resolve, reject) => {
    const fileId = uuidv4().substring(0, 8);
    let filename, command;

    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        filename = path.join(TEMP_DIR, `${fileId}.js`);
        command = `node "${filename}"`;
        break;
      case 'python':
      case 'py':
        filename = path.join(TEMP_DIR, `${fileId}.py`);
        command = `python "${filename}"`;
        break;
      case 'c':
        filename = path.join(TEMP_DIR, `${fileId}.c`);
        const cOut = path.join(TEMP_DIR, `${fileId}.exe`);
        // Compile then run
        await fs.promises.writeFile(filename, code);
        const startC = Date.now();
        exec(`gcc "${filename}" -o "${cOut}" && "${cOut}"`, {
          timeout: 5000, maxBuffer: 1024 * 1024,
          cwd: TEMP_DIR
        }, (error, stdout, stderr) => {
          const executionTime = Date.now() - startC;
          cleanup(filename, cOut);
          if (error && !stdout) {
            resolve({ stdout: '', stderr: stderr || error.message, executionTime });
          } else {
            resolve({ stdout: stdout || '', stderr: stderr || '', executionTime });
          }
        });
        return;
      case 'cpp':
      case 'c++':
        filename = path.join(TEMP_DIR, `${fileId}.cpp`);
        const cppOut = path.join(TEMP_DIR, `${fileId}.exe`);
        await fs.promises.writeFile(filename, code);
        const startCpp = Date.now();
        exec(`g++ "${filename}" -o "${cppOut}" && "${cppOut}"`, {
          timeout: 5000, maxBuffer: 1024 * 1024,
          cwd: TEMP_DIR
        }, (error, stdout, stderr) => {
          const executionTime = Date.now() - startCpp;
          cleanup(filename, cppOut);
          if (error && !stdout) {
            resolve({ stdout: '', stderr: stderr || error.message, executionTime });
          } else {
            resolve({ stdout: stdout || '', stderr: stderr || '', executionTime });
          }
        });
        return;
      case 'java':
        filename = path.join(TEMP_DIR, `Main_${fileId}.java`);
        // Extract or use Main class
        const javaCode = code.replace(/public\s+class\s+\w+/, 'public class Main_' + fileId);
        await fs.promises.writeFile(filename, javaCode);
        const startJava = Date.now();
        exec(`javac "${filename}" && java -cp "${TEMP_DIR}" Main_${fileId}`, {
          timeout: 10000, maxBuffer: 1024 * 1024,
          cwd: TEMP_DIR
        }, (error, stdout, stderr) => {
          const executionTime = Date.now() - startJava;
          cleanup(filename, path.join(TEMP_DIR, `Main_${fileId}.class`));
          if (error && !stdout) {
            resolve({ stdout: '', stderr: stderr || error.message, executionTime });
          } else {
            resolve({ stdout: stdout || '', stderr: stderr || '', executionTime });
          }
        });
        return;
      default:
        return reject(new Error(`Unsupported language: ${language}`));
    }

    // For JS and Python
    await fs.promises.writeFile(filename, code);
    const startTime = Date.now();

    const proc = exec(command, {
      timeout: 5000,
      maxBuffer: 1024 * 1024,
      cwd: TEMP_DIR
    }, (error, stdout, stderr) => {
      const executionTime = Date.now() - startTime;
      cleanup(filename);

      if (error) {
        if (error.killed) {
          resolve({ stdout: '', stderr: 'Execution timed out (10s limit)', executionTime });
        } else {
          resolve({ stdout: stdout || '', stderr: stderr || error.message, executionTime });
        }
      } else {
        resolve({ stdout: stdout || '', stderr: stderr || '', executionTime });
      }
    });

    // Send input if provided
    if (input) {
      proc.stdin.write(input);
      proc.stdin.end();
    }
  });
}

function cleanup(...files) {
  for (const f of files) {
    try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (e) { /* ignore */ }
  }
}

// ================================================================
//  ROUND TIMER
// ================================================================

function startRoundTimer(roundId) {
  if (roundTimers[roundId]) clearInterval(roundTimers[roundId]);

  roundTimers[roundId] = setInterval(() => {
    const round = DB.rounds[roundId];
    if (!round || round.status !== 'active') {
      clearInterval(roundTimers[roundId]);
      return;
    }

    const remaining = round.endTime - Date.now();
    if (remaining <= 0) {
      // Auto-end round
      round.status = 'ended';
      DB.activeRound = null;
      clearInterval(roundTimers[roundId]);
      delete roundTimers[roundId];
      io.emit('round:ended', { roundId, name: round.name, auto: true });
      broadcastLeaderboard();
      saveDB();
      console.log(`  Round ${roundId} ended automatically`);
    } else {
      io.emit('timer:update', { roundId, remaining, endTime: round.endTime });
    }
  }, 1000);
}

// Resume active round timer on server restart
if (DB.activeRound && DB.rounds[DB.activeRound]?.status === 'active') {
  const round = DB.rounds[DB.activeRound];
  if (round.endTime && Date.now() < round.endTime) {
    startRoundTimer(DB.activeRound);
    console.log(`  Resuming timer for Round ${DB.activeRound}`);
  } else {
    round.status = 'ended';
    DB.activeRound = null;
    saveDB();
  }
}

// ================================================================
//  WEBSOCKET
// ================================================================

io.on('connection', (socket) => {
  console.log(`  ⚓ Socket connected: ${socket.id}`);

  socket.on('join', ({ room, token }) => {
    const session = sessions.get(token);
    if (!session) return;

    if (session.type === 'admin') {
      socket.join('admin-room');
      socket.emit('joined', { room: 'admin-room' });
    } else {
      socket.join('participant-room');
      socket.participantId = session.id;
      socket.emit('joined', { room: 'participant-room' });

      // Send current state
      if (DB.activeRound) {
        const round = DB.rounds[DB.activeRound];
        const challenges = round.challengeIds
          .map(cid => DB.challenges.get(cid))
          .filter(Boolean)
          .map(c => ({
            id: c.id, title: c.title, description: c.description,
            buggyCode: c.buggyCode, language: c.language,
            difficulty: c.difficulty, hints: c.hints, timeLimit: c.timeLimit
          }));

        socket.emit('round:started', {
          round: { id: round.id, name: round.name, difficulty: round.difficulty, maxAttempts: round.maxAttempts },
          challenges,
          endTime: round.endTime,
          duration: round.duration
        });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`  ⚓ Socket disconnected: ${socket.id}`);
  });
});

// ================================================================
//  PAGE ROUTES
// ================================================================

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/arena', (req, res) => res.sendFile(path.join(__dirname, 'public', 'arena.html')));
app.get('/leaderboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'leaderboard.html')));

// ================================================================
//  START SERVER
// ================================================================

server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║   🏴‍☠️  DEAD MAN\'S DEBUG — Server Online  🏴‍☠️   ║');
  console.log('  ╠══════════════════════════════════════════════╣');
  console.log(`  ║   Port: ${PORT}                                 ║`);
  console.log(`  ║   Admin Login: captain / blackpearl          ║`);
  console.log('  ║   URL: http://localhost:' + PORT + '                 ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');
});
