/**
 * Out of Time calendar date/status helpers (C1a — r953, C2a — r954, C3a — r955, C4a — r957, C5a — r958, C6a — r959, C7a — r960).
 * Loaded after flyer helpers and before the main inline script.
 * Preserves legacy _cal* / _isPastGig / _blackout* / getHoliday* / birthday / important-date / Next Up global names for Calendar compatibility.
 * _calColor defers gig/rehearsal/blackout colors to inline _eventColor(EC).
 * Blackout confirm UI / conflict discovery remain inline.
 * Holiday helpers are exact-date only (no weekend-observed substitution).
 * Birthday helpers match MM-DD only; getMembersBornOn accepts an explicit members list (no owned members array).
 * getImportantDatesOn accepts an explicit Important Date list (legacy one-arg alias uses window.importantDates).
 * Next Up formatters: _calNextUpLine accepts an explicit gigDetails map (legacy one-arg alias uses window.gigDetails).
 * Inline function _pad remains in index.html for Important Date modal use.
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

// US Federal Holidays (C4a — r957). Module-private pad/fmt; do not export window._pad.
function _holidayPad(n){ return n<10 ? '0'+n : ''+n; }
function _holidayFmt(year, month0, day){ return year + '-' + _holidayPad(month0+1) + '-' + _holidayPad(day); }

function _nthDayOfMonth(year, month0, dayOfWeek, n){
  // n-th occurrence of dayOfWeek (0=Sun..6=Sat) in month0 (0..11) of year
  var first = new Date(year, month0, 1);
  var offset = (dayOfWeek - first.getDay() + 7) % 7;
  return 1 + offset + (n-1)*7;
}
function _lastDayOfMonth(year, month0, dayOfWeek){
  var lastDate = new Date(year, month0+1, 0);
  var diff = (lastDate.getDay() - dayOfWeek + 7) % 7;
  return lastDate.getDate() - diff;
}

function getUSFederalHolidays(year){
  // Returns array of {date:'YYYY-MM-DD', name:'...'}
  return [
    {date: _holidayFmt(year, 0, 1),  name: "New Year's Day"},
    {date: _holidayFmt(year, 0, _nthDayOfMonth(year, 0, 1, 3)),  name: 'Martin Luther King Jr. Day'},
    {date: _holidayFmt(year, 1, _nthDayOfMonth(year, 1, 1, 3)),  name: "Presidents' Day"},
    {date: _holidayFmt(year, 4, _lastDayOfMonth(year, 4, 1)),    name: 'Memorial Day'},
    {date: _holidayFmt(year, 5, 19), name: 'Juneteenth'},
    {date: _holidayFmt(year, 6, 4),  name: 'Independence Day'},
    {date: _holidayFmt(year, 8, _nthDayOfMonth(year, 8, 1, 1)),  name: 'Labor Day'},
    {date: _holidayFmt(year, 9, _nthDayOfMonth(year, 9, 1, 2)),  name: 'Columbus Day'},
    {date: _holidayFmt(year, 10, 11),name: 'Veterans Day'},
    {date: _holidayFmt(year, 10, _nthDayOfMonth(year, 10, 4, 4)),name: 'Thanksgiving'},
    {date: _holidayFmt(year, 11, 25),name: 'Christmas Day'}
  ];
}
function getHolidayOn(ds){
  if(!ds) return null;
  var y = parseInt(ds.split('-')[0], 10);
  if(isNaN(y)) return null;
  var list = getUSFederalHolidays(y);
  for(var i=0;i<list.length;i++){
    if(list[i].date === ds) return list[i];
  }
  return null;
}

// Birthday MM-DD helpers (C5a — r958). getMembersBornOn takes membersList explicitly.
function isBirthdayToday(bday){
  if(!bday) return false;
  // Accept YYYY-MM-DD; compare MM-DD only so year doesn't matter
  var parts = String(bday).split('-');
  if(parts.length<3) return false;
  var t = new Date();
  var todayMonth = t.getMonth()+1;
  var todayDay = t.getDate();
  return parseInt(parts[1],10)===todayMonth && parseInt(parts[2],10)===todayDay;
}
function isBirthdayOnDate(bday, ds){
  if(!bday || !ds) return false;
  var b = String(bday).split('-');
  var d = String(ds).split('-');
  if(b.length<3 || d.length<3) return false;
  return parseInt(b[1],10)===parseInt(d[1],10) && parseInt(b[2],10)===parseInt(d[2],10);
}
function getMembersBornOn(dateString, membersList){
  var list = membersList || [];
  return list.filter(function(m){ return isBirthdayOnDate(m.bday, dateString); });
}

// Important Date day filter (C6a — r959). getImportantDatesOn takes importantDatesList explicitly.
function getImportantDatesOn(ds, importantDatesList){
  if(!ds) return [];
  var d = ds.split('-');
  if(d.length<3) return [];
  var mm = d[1], dd = d[2];
  var list = importantDatesList || [];
  return list.filter(function(x){
    if(!x.date) return false;
    if(x.recurring){
      // Stored as 'MM-DD' (recurring annually) or 'YYYY-MM-DD' (we still match MM-DD)
      var p = String(x.date).split('-');
      var xMM = p.length===2 ? p[0] : p[1];
      var xDD = p.length===2 ? p[1] : p[2];
      return xMM===mm && xDD===dd;
    } else {
      return x.date === ds;
    }
  });
}

// Next Up display formatters (C7a — r960). _calNextUpLine takes gigDetailsMap explicitly.
function _calNextUpCalendarIcon(){
  return '<span class="cal-next-up-icon" aria-hidden="true"><img src="Calendaricon.png?v=r250" class="cal-next-up-img" alt=""></span>';
}

function _calNextUpLine(row, gigDetailsMap){
  if(!row) return 'No upcoming calendar items';
  var bits = [_calCompactDateLabel(row.date)];
  if(row.title) bits.push(_calSafe(row.title));
  var details = gigDetailsMap || {};
  var det = (row.type === 'gig' && row.id && details[row.id]) ? details[row.id] : null;
  var time = (det && det.settime) || row.settime || row.time || '';
  if(time) bits.push(_calSafe(String(time).toUpperCase()));
  return bits.join('<span class="next-up-dot">•</span>');
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
  blackoutConflictMessage: _blackoutConflictMessage,
  usFederalHolidays: getUSFederalHolidays,
  getUSFederalHolidays: getUSFederalHolidays,
  holidayOn: getHolidayOn,
  getHolidayOn: getHolidayOn,
  birthdayToday: isBirthdayToday,
  isBirthdayToday: isBirthdayToday,
  birthdayOnDate: isBirthdayOnDate,
  isBirthdayOnDate: isBirthdayOnDate,
  membersBornOn: getMembersBornOn,
  getMembersBornOn: getMembersBornOn,
  importantDatesOn: getImportantDatesOn,
  getImportantDatesOn: getImportantDatesOn,
  nextUpCalendarIcon: _calNextUpCalendarIcon,
  nextUpLine: _calNextUpLine
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
window.getUSFederalHolidays = window.OOT_CALENDAR_HELPERS.usFederalHolidays;
window.getHolidayOn = window.OOT_CALENDAR_HELPERS.holidayOn;
window.isBirthdayToday = window.OOT_CALENDAR_HELPERS.isBirthdayToday;
window.isBirthdayOnDate = window.OOT_CALENDAR_HELPERS.isBirthdayOnDate;
window.getMembersBornOn = function(ds){
  return window.OOT_CALENDAR_HELPERS.getMembersBornOn(ds, window.members);
};
window.getImportantDatesOn = function(ds){
  return window.OOT_CALENDAR_HELPERS.getImportantDatesOn(ds, window.importantDates);
};
window._calNextUpCalendarIcon = window.OOT_CALENDAR_HELPERS.nextUpCalendarIcon;
window._calNextUpLine = function(row){
  return window.OOT_CALENDAR_HELPERS.nextUpLine(row, window.gigDetails);
};
