/**
 * Out of Time calendar date/status helpers (C1a — r953, C2a — r954, C3a — r955).
 * Loaded after flyer helpers and before the main inline script.
 * Preserves legacy _cal* / _isPastGig / _blackout* global names for Calendar compatibility.
 * _calColor defers gig/rehearsal/blackout colors to inline _eventColor(EC).
 * Blackout confirm UI / conflict discovery remain inline.
 */
function _calTypeIcon(type){
  if(type === 'gig') return '&#127928;';
  if(type === 'rehearsal') return '&#129345;';
  if(type === 'blackout') return '&#128683;';
  if(type === 'custom') return '&#9733;';
  if(type === 'birthday') return '<span class="icon-cake" aria-hidden="true" style="width:1.1em;height:1.1em;vertical-align:-.25em;"></span>';
  if(type === 'holiday') return '<span class="icon-usflag" aria-hidden="true" style="width:1.1em;height:1.1em;vertical-align:-.25em;"></span>';
  return '&#8226;';
}

function _calSafe(s){
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function _calColor(type, row){
  if(type === 'custom') return (row && row._customColor) || '#06d6a0';
  if(type === 'birthday') return '#f5c518';
  if(type === 'holiday') return '#4a9eff';
  try {
    if(typeof window !== 'undefined' && typeof window._eventColor === 'function'){
      return window._eventColor(type);
    }
  } catch(e){}
  if(typeof _eventColor === 'function') return _eventColor(type);
  return '#06d6a0';
}

function _calCompactDateLabel(dateStr){
  var parts = String(dateStr||'').split('-');
  if(parts.length !== 3) return String(dateStr||'');
  var dt = new Date(Number(parts[0]), Number(parts[1])-1, Number(parts[2]));
  try { return dt.toLocaleDateString([], {weekday:'short', day:'numeric'}); }
  catch(e){ return String(dateStr||''); }
}

function _calTodayDate(){ return new Date(); }

function _calTodayKey(d){
  d = d || _calTodayDate();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

// True if the gig date has already passed (debrief makes sense).
function _isPastGig(ev){
  if(!ev || !ev.date) return false;
  // Compare YYYY-MM-DD strings — robust against timezones.
  // Strictly before today; same-day = not yet.
  return ev.date < _calTodayKey();
}

function _blackoutNameFromTitle(title){
  var t = String(title || 'Unavailable').trim();
  return t.replace(/\s+unavailable\s*$/i,'').trim() || t || 'Unavailable';
}

function _blackoutConflictLine(conflicts){
  var names = conflicts.map(function(c){ return c.person; }).filter(Boolean);
  var unique = [];
  var seen = {};
  names.forEach(function(n){ if(!seen[n]){ seen[n]=true; unique.push(n); } });
  var shown = unique.slice(0,6).join(', ');
  if(unique.length > 6) shown += ' +' + (unique.length - 6) + ' more';
  return unique.length === 1 ? (shown + ' is unavailable') : (shown + ' are unavailable');
}

function _blackoutConflictMessage(kind, dateStr, conflicts, mode){
  var noun = String(kind || 'event');
  var action = mode === 'open'
    ? 'This is a scheduling conflict. Choose a different date unless you intentionally want to continue anyway.'
    : 'This is a scheduling conflict. Choose a different date unless you intentionally want to save anyway.';
  return 'Blackout conflict found for ' + dateStr + '.\n\n' + _blackoutConflictLine(conflicts) + '.\n\n' + action;
}

window.OOT_CALENDAR_HELPERS = {
  typeIcon: _calTypeIcon,
  safe: _calSafe,
  color: _calColor,
  compactDateLabel: _calCompactDateLabel,
  todayDate: _calTodayDate,
  todayKey: _calTodayKey,
  isPastGig: _isPastGig,
  blackoutNameFromTitle: _blackoutNameFromTitle,
  blackoutConflictLine: _blackoutConflictLine,
  blackoutConflictMessage: _blackoutConflictMessage
};

window._calTypeIcon = window.OOT_CALENDAR_HELPERS.typeIcon;
window._calSafe = window.OOT_CALENDAR_HELPERS.safe;
window._calColor = window.OOT_CALENDAR_HELPERS.color;
window._calCompactDateLabel = window.OOT_CALENDAR_HELPERS.compactDateLabel;
window._calTodayDate = window.OOT_CALENDAR_HELPERS.todayDate;
window._calTodayKey = window.OOT_CALENDAR_HELPERS.todayKey;
window._isPastGig = window.OOT_CALENDAR_HELPERS.isPastGig;
window._blackoutNameFromTitle = window.OOT_CALENDAR_HELPERS.blackoutNameFromTitle;
window._blackoutConflictLine = window.OOT_CALENDAR_HELPERS.blackoutConflictLine;
window._blackoutConflictMessage = window.OOT_CALENDAR_HELPERS.blackoutConflictMessage;
