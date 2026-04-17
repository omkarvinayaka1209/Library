const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '4mb' }));

const PORT = Number(process.env.PORT || 4000);
const DB_FILE = path.join(__dirname, 'runtime-db.json');
const COUNTRY_CODE = String(process.env.COUNTRY_CODE || '+91');
const MONGODB_URI = String(process.env.MONGODB_URI || '').trim();
const MONGODB_DB_NAME = String(process.env.MONGODB_DB_NAME || 'vemu_library').trim();

const REQUIRED_ENV = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_VERIFY_SERVICE_SID',
  'TWILIO_PHONE_NUMBER'
];

let mongoClient = null;
let mongoDb = null;
let mongoConnectPromise = null;

const EMPTY_STATE = {
  users: [],
  books: [],
  transactions: [],
  studentData: {},
  notifications: [],
  receipts: [],
  renewalRequests: [],
  feedbackEntries: [],
  bookSuggestions: [],
  sentLog: [],
  otpLog: [],
  updatedAt: ''
};

function cloneEmptyState() {
  return JSON.parse(JSON.stringify(EMPTY_STATE));
}

function hasTwilioConfig() {
  return REQUIRED_ENV.every((key) => Boolean(String(process.env[key] || '').trim()));
}

function getTwilioClient() {
  if (!hasTwilioConfig()) return null;
  const twilio = require('twilio');
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

function hasMongoConfig() {
  return Boolean(MONGODB_URI);
}

function maskMongoUri(uri) {
  if (!uri) return '';
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
}

function classifyMongoError(error) {
  const message = String(error?.message || '');

  if (!MONGODB_URI) {
    return 'MONGODB_URI is missing in server/.env';
  }
  if (/bad auth|authentication failed|auth failed/i.test(message)) {
    return 'MongoDB username or password is wrong';
  }
  if (/ENOTFOUND|getaddrinfo|querySrv/i.test(message)) {
    return 'DNS / SRV lookup failed. Check your Atlas URI and internet connection';
  }
  if (/ECONNREFUSED|timed out|Server selection timed out/i.test(message)) {
    return 'Network access issue. Add your current IP in MongoDB Atlas Network Access';
  }
  if (/ssl|tls|alert number 80|tlsv1 alert internal error/i.test(message)) {
    return 'TLS/SSL handshake failed. Usually this means Atlas Network Access, URI copy issue, proxy/antivirus interception, or system certificate problem';
  }
  return message || 'Unknown MongoDB connection error';
}

function createMongoClient() {
  return new MongoClient(MONGODB_URI, {
    appName: 'VEMU-Library',
    retryWrites: true,
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 12000,
    connectTimeoutMS: 12000,
    socketTimeoutMS: 20000,
    family: 4,
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true
    }
  });
}

async function ensureMongo() {
  if (!hasMongoConfig()) return null;
  if (mongoDb) return mongoDb;
  if (mongoConnectPromise) return mongoConnectPromise;

  mongoConnectPromise = (async () => {
    try {
      if (mongoClient) {
        try {
          await mongoClient.close();
        } catch (_) {}
      }

      mongoClient = createMongoClient();
      await mongoClient.connect();

      const db = mongoClient.db(MONGODB_DB_NAME);
      await db.command({ ping: 1 });

      mongoDb = db;
      console.log('MongoDB Atlas connected');
      return mongoDb;
    } catch (error) {
      mongoDb = null;
      if (mongoClient) {
        try {
          await mongoClient.close();
        } catch (_) {}
      }
      mongoClient = null;
      throw error;
    } finally {
      mongoConnectPromise = null;
    }
  })();

  return mongoConnectPromise;
}

async function disconnectMongo() {
  const current = mongoClient;
  mongoClient = null;
  mongoDb = null;
  mongoConnectPromise = null;

  if (current) {
    try {
      await current.close();
    } catch (_) {}
  }
}

function ensureLocalDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(cloneEmptyState(), null, 2));
  }
}

function normalizeState(payload = {}) {
  const base = cloneEmptyState();
  const merged = { ...base, ...(payload || {}) };

  for (const key of Object.keys(base)) {
    if (Array.isArray(base[key]) && !Array.isArray(merged[key])) {
      merged[key] = [];
    }
  }

  merged.updatedAt = payload.updatedAt || new Date().toISOString();
  return merged;
}

function readLocalDb() {
  ensureLocalDb();
  try {
    return normalizeState(JSON.parse(fs.readFileSync(DB_FILE, 'utf8')));
  } catch (_) {
    return cloneEmptyState();
  }
}

function writeLocalDb(state) {
  fs.writeFileSync(DB_FILE, JSON.stringify(normalizeState(state), null, 2));
}

async function readState() {
  if (hasMongoConfig()) {
    try {
      const db = await ensureMongo();
      const doc = await db.collection('app_state').findOne({ _id: 'library-state' });
      if (doc && doc.payload) return normalizeState(doc.payload);
    } catch (error) {
      console.error('Mongo read fallback:', classifyMongoError(error));
    }
  }
  return readLocalDb();
}

// async function writeState(state) {
//   const normalized = normalizeState(state);

//   if (hasMongoConfig()) {
//     try {
//       const db = await ensureMongo();
//       await db.collection('app_state').updateOne(
//         { _id: 'library-state' },
//         { $set: { payload: normalized, updatedAt: normalized.updatedAt } },
//         { upsert: true }
//       );
//     } catch (error) {
//       console.error('Mongo write fallback:', classifyMongoError(error));
//       writeLocalDb(normalized);
//     }
//   } else {
//     writeLocalDb(normalized);
//   }

//   return normalized;
// }

async function writeState(state) {
  const normalized = normalizeState(state);

  if (hasMongoConfig()) {
    try {
      const db = await ensureMongo();
      await db.collection('app_state').updateOne(
        { _id: 'library-state' },
        { $set: { payload: normalized, updatedAt: normalized.updatedAt } },
        { upsert: true }
      );
    } catch (error) {
      console.error('Mongo failed, saving locally:', classifyMongoError(error));
      writeLocalDb(normalized);
    }
  } else {
    writeLocalDb(normalized);
  }

  return normalized;
}

function normalizePhone(phone = '') {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `${COUNTRY_CODE}${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (String(phone).trim().startsWith('+')) return `+${digits}`;
  return digits.length >= 10 ? `+${digits}` : digits;
}

function envErrorMessage() {
  return 'Twilio configuration is incomplete. Fill server/.env using server/.env.example, then restart the server.';
}

function daysBetween(a, b) {
  const d1 = new Date(a);
  d1.setHours(0, 0, 0, 0);

  const d2 = new Date(b);
  d2.setHours(0, 0, 0, 0);

  return Math.round((d2 - d1) / 86400000);
}

async function sendSms({ to, body }) {
  if (!hasTwilioConfig()) return { ok: false, message: envErrorMessage() };
  const client = getTwilioClient();
  const message = await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: normalizePhone(to)
  });
  return { ok: true, sid: message.sid };
}

function messageKey(txId, type, date = new Date().toISOString().slice(0, 10)) {
  return `${txId || 'general'}::${type}::${date}`;
}

async function sendReminderMessage(type, user, tx) {
  const db = await readState();
  const key = messageKey(tx.txId, type);

  if ((db.sentLog || []).some((item) => item.key === key)) {
    return { ok: true, skipped: true, message: 'Already sent today' };
  }

  const dueDateText = tx.dueDate
    ? new Date(tx.dueDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : '';

  const amount = Number(tx.fine || 0);
  let body = '';

  if (type === 'dueSoon') {
    body = `VEMU Library Reminder: The return date for your borrowed book "${tx.bookTitle}" is approaching soon on ${dueDateText}. Please return or renew it on time to avoid overdue fines.`;
  }
  if (type === 'dueToday') {
    body = `Important: Today is the last date to return your library book "${tx.bookTitle}". Kindly return it today to avoid penalty from VEMU Library.`;
  }
  if (type === 'overdue') {
    body = `Attention: You have missed the return date for your library book "${tx.bookTitle}". Kindly return it as soon as possible. ${amount > 0 ? `Current fine is ₹${amount.toFixed(2)}. ` : ''}Fine charges may continue until submission.`;
  }
  if (type === 'finalWarning') {
    body = `Final Reminder from VEMU Library: Your borrowed book "${tx.bookTitle}" is still overdue. Return it immediately${amount > 0 ? ` and clear the pending fine of ₹${amount.toFixed(2)}` : ' and clear the pending fine'} to avoid further action on your account.`;
  }

  const result = await sendSms({ to: user.phone, body });

  if (result.ok) {
    db.sentLog = Array.isArray(db.sentLog) ? db.sentLog : [];
    db.sentLog.push({
      key,
      txId: tx.txId,
      uid: user.uid,
      type,
      sentAt: new Date().toISOString(),
      sid: result.sid || ''
    });
    await writeState(db);
  }

  return result;
}

function getLibrarySnapshot(state = {}) {
  const users = Array.isArray(state.users) ? state.users : [];
  const books = Array.isArray(state.books) ? state.books : [];
  const transactions = Array.isArray(state.transactions) ? state.transactions : [];
  const renewals = Array.isArray(state.renewalRequests) ? state.renewalRequests : [];
  const suggestions = Array.isArray(state.bookSuggestions) ? state.bookSuggestions : [];
  const feedbackEntries = Array.isArray(state.feedbackEntries) ? state.feedbackEntries : [];

  const activeUsers = users.filter(
    (user) => String(user.status || 'ACTIVE').toUpperCase() === 'ACTIVE'
  ).length;

  const activeIssues = transactions.filter(
    (tx) => String(tx.status || '').toUpperCase() === 'ISSUED'
  ).length;

  const pendingApprovals =
    renewals.filter((item) => String(item.status || '').toUpperCase() === 'PENDING').length +
    suggestions.filter((item) => String(item.status || '').toUpperCase() === 'PENDING').length;

  const totalTitles = books.length;

  return {
    activeUsers,
    activeIssues,
    pendingApprovals,
    totalTitles,
    totalFeedback: feedbackEntries.length,
    totalSuggestions: suggestions.length
  };
}

app.get('/api/health', async (req, res) => {
  let mongoConnected = false;
  let mongoMessage = 'MongoDB not configured';

  if (hasMongoConfig()) {
    try {
      await ensureMongo();
      mongoConnected = true;
      mongoMessage = 'MongoDB Atlas connected';
    } catch (error) {
      mongoConnected = false;
      mongoMessage = classifyMongoError(error);
    }
  }

  res.json({
    ok: true,
    port: PORT,
    twilioConfigured: hasTwilioConfig(),
    mongoConfigured: hasMongoConfig(),
    mongoConnected,
    mongoDbName: MONGODB_DB_NAME,
    mongoMessage,
    snapshotSource: mongoConnected ? 'mongodb' : 'local-json',
    message: hasTwilioConfig() ? 'Server ready' : envErrorMessage()
  });
});

app.get('/api/library-state', async (req, res) => {
  const state = await readState();
  res.json({ ok: true, state, snapshot: getLibrarySnapshot(state) });
});

app.post('/api/library-state', async (req, res) => {
  const nextState = await writeState(req.body.state || req.body || {});
  res.json({
    ok: true,
    message: 'Library state stored successfully',
    state: nextState,
    snapshot: getLibrarySnapshot(nextState)
  });
});

app.post('/api/send-otp', async (req, res) => {
  const phone = normalizePhone(req.body.phone || '');
  if (!phone) {
    return res.status(400).json({ ok: false, message: 'Phone number is required' });
  }
  if (!hasTwilioConfig()) {
    return res.status(500).json({ ok: false, message: envErrorMessage() });
  }

  try {
    const client = getTwilioClient();
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to: phone, channel: 'sms' });

    const db = await readState();
    db.otpLog = Array.isArray(db.otpLog) ? db.otpLog : [];
    db.otpLog.push({
      uid: req.body.uid || '',
      phone,
      sid: verification.sid,
      status: verification.status,
      createdAt: new Date().toISOString()
    });
    await writeState(db);

    res.json({ ok: true, message: `OTP sent successfully to ${phone}` });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || 'Unable to send OTP' });
  }
});

app.post('/api/verify-otp', async (req, res) => {
  const phone = normalizePhone(req.body.phone || '');
  const otp = String(req.body.otp || '').trim();

  if (!phone || !otp) {
    return res.status(400).json({ ok: false, message: 'Phone number and OTP are required' });
  }
  if (!hasTwilioConfig()) {
    return res.status(500).json({ ok: false, message: envErrorMessage() });
  }

  try {
    const client = getTwilioClient();
    const check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: phone, code: otp });

    if (check.status !== 'approved') {
      return res.status(400).json({
        ok: false,
        message: 'OTP verification failed. Enter the latest OTP.'
      });
    }

    res.json({ ok: true, message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || 'Unable to verify OTP' });
  }
});

app.post('/api/send-alert', async (req, res) => {
  const phone = normalizePhone(req.body.phone || '');
  const message = String(req.body.message || '').trim();

  if (!phone || !message) {
    return res.status(400).json({ ok: false, message: 'Phone number and message are required' });
  }

  try {
    const result = await sendSms({ to: phone, body: message });
    if (!result.ok) return res.status(500).json(result);
    res.json({ ok: true, sid: result.sid, message: 'SMS alert sent successfully' });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || 'Unable to send SMS alert' });
  }
});

app.post('/api/sync-library-state', async (req, res) => {
  const db = await readState();
  db.users = Array.isArray(req.body.users) ? req.body.users : db.users;
  db.transactions = Array.isArray(req.body.transactions) ? req.body.transactions : db.transactions;
  await writeState(db);
  res.json({ ok: true, message: 'Library state synced for reminder engine' });
});

async function runReminderSweep() {
  const db = await readState();
  const today = new Date().toISOString().slice(0, 10);
  const results = [];

  for (const tx of db.transactions || []) {
    if (String(tx.status || '').toUpperCase() !== 'ISSUED') continue;

    const user = (db.users || []).find((item) => item.uid === tx.borrowerUid);
    if (!user || !user.phoneVerified || !user.phone) continue;

    const diff = daysBetween(today, tx.dueDate);

    if (diff === 2) {
      results.push(await sendReminderMessage('dueSoon', user, tx));
    } else if (diff === 0) {
      results.push(await sendReminderMessage('dueToday', user, tx));
    } else if (diff === -1) {
      results.push(await sendReminderMessage('overdue', user, tx));
    } else if (diff <= -3) {
      results.push(await sendReminderMessage('finalWarning', user, tx));
    }
  }

  return results;
}

app.post('/api/run-reminder-sweep', async (req, res) => {
  try {
    const results = await runReminderSweep();
    res.json({ ok: true, count: results.length, message: 'Reminder sweep completed' });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message || 'Reminder sweep failed' });
  }
});

app.post('/api/mongo-test', async (req, res) => {
  if (!hasMongoConfig()) {
    return res.status(400).json({
      ok: false,
      message: 'MONGODB_URI is missing in server/.env'
    });
  }

  try {
    const db = await ensureMongo();
    const ping = await db.command({ ping: 1 });
    res.json({
      ok: true,
      message: 'MongoDB Atlas connected successfully',
      dbName: db.databaseName,
      ping
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: classifyMongoError(error),
      rawError: String(error?.message || '')
    });
  }
});

cron.schedule(String(process.env.REMINDER_SWEEP_CRON || '*/15 * * * *'), async () => {
  try {
    await runReminderSweep();
  } catch (error) {
    console.error('Reminder sweep error:', error.message);
  }
});

app.listen(PORT, async () => {
  ensureLocalDb();

  if (hasMongoConfig()) {
    try {
      await ensureMongo();
    } catch (error) {
      console.log('MongoDB Atlas not connected:', classifyMongoError(error));
      console.log('Mongo URI used:', maskMongoUri(MONGODB_URI));
    }
  } else {
    console.log('MongoDB skipped: MONGODB_URI not found in server/.env');
  }

  console.log(`VEMU backend running on http://localhost:${PORT}`);
  if (!hasTwilioConfig()) {
    console.log(envErrorMessage());
  }
});

async function shutdown() {
  await disconnectMongo();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);