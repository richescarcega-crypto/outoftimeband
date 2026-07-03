'use strict';

/**
 * notiflog write shape — mirrors index.html _writeNotifLog fields.
 * Preflight: writeNotifLogEntry returns a doc payload; actual Firestore add only when db injected.
 */

function buildNotifLogEntry(entry) {
  entry = entry || {};
  const nowIso = new Date().toISOString();
  return Object.assign({
    tsClient: nowIso,
  }, entry);
}

async function writeNotifLogEntry(db, entry) {
  if (!db || typeof db.collection !== 'function') {
    return {
      ok: false,
      reason: 'no-db',
      entry: buildNotifLogEntry(entry),
    };
  }
  const doc = buildNotifLogEntry(entry);
  try {
    await db.collection('notiflog').add(doc);
    return { ok: true, reason: 'written', entry: doc };
  } catch (err) {
    return {
      ok: false,
      reason: 'write-error',
      error: err && err.message ? String(err.message) : 'unknown',
      entry: doc,
    };
  }
}

function buildProposalReminderNotifLogEntry(pushResult, meta) {
  meta = meta || {};
  const payload = pushResult && pushResult.payload ? pushResult.payload : {};
  return buildNotifLogEntry({
    category: 'rehearsal-proposal',
    title: payload.title || meta.title || '',
    message: payload.message || meta.message || '',
    sender: 'backend-scheduler',
    senderId: 'system',
    targetIds: payload.targetExternalIds || [String(meta.targetMemberId || '')],
    targetNames: meta.targetName || String(meta.targetMemberId || ''),
    result: pushResult && pushResult.sent ? 'sent' : (pushResult && pushResult.reason) || 'blocked',
    httpStatus: pushResult && pushResult.httpStatus,
    response: pushResult && pushResult.response,
    note: meta.note || 'backend proposal reminder preflight',
  });
}

module.exports = {
  buildNotifLogEntry,
  writeNotifLogEntry,
  buildProposalReminderNotifLogEntry,
};
