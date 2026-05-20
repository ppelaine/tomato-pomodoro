// === CONSTANTS ===
var FOCUS_SECONDS = 25 * 60;
var BREAK_SECONDS = 5 * 60;
var RING_CIRCUMFERENCE = 2 * Math.PI * 45; // ~282.74

// === STATE ===
var mode = 'focus';       // 'focus' | 'break'
var state = 'idle';       // 'idle' | 'running' | 'paused'
var totalSeconds = FOCUS_SECONDS;
var remainingSeconds = FOCUS_SECONDS;
var sessionCount = 0;
var startTimestamp = null;
var pausedRemaining = null;
var tickInterval = null;

// === DOM REFS ===
var tomatoFace = document.getElementById('tomato-face');
var timerLabel = document.getElementById('timer-label');
var timerDisplay = document.getElementById('timer-display');
var progressCircle = document.getElementById('progress-circle');
var sessionCountEl = document.getElementById('session-count');
var btnStart = document.getElementById('btn-start');
var btnPause = document.getElementById('btn-pause');
var btnReset = document.getElementById('btn-reset');

// === AUDIO ===
function playBeeps() {
  try {
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    var ctx = new AudioContext();
    var notes = [660, 880, 1100];

    notes.forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.35);
    });
  } catch (_) { /* audio not available */ }
}

// === NOTIFICATION ===
function sendNotification(title, body) {
  try {
    new Notification(title, { body: body, silent: true });
  } catch (_) { /* notifications unavailable */ }
}

// === UI UPDATES ===
function formatTime(seconds) {
  var m = Math.floor(seconds / 60);
  var s = seconds % 60;
  return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
}

function updateDisplay() {
  timerDisplay.textContent = formatTime(remainingSeconds);

  var elapsed = totalSeconds - remainingSeconds;
  var fraction = elapsed / totalSeconds;
  progressCircle.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - fraction);

  // urgency in last minute
  if (remainingSeconds <= 60 && remainingSeconds > 0 && state === 'running') {
    progressCircle.classList.add('urgent');
  } else {
    progressCircle.classList.remove('urgent');
  }
}

function updateButtonStates() {
  if (state === 'running') {
    btnStart.disabled = true;
    btnPause.disabled = false;
  } else if (state === 'paused') {
    btnStart.disabled = false;
    btnPause.disabled = true;
  } else {
    btnStart.disabled = false;
    btnPause.disabled = true;
  }
}

function updateLabel() {
  timerLabel.textContent = mode === 'focus' ? 'Focus Time' : 'Break Time';
}

function updateTomatoFace() {
  tomatoFace.className = '';
  if (state === 'running') {
    tomatoFace.classList.add(mode === 'focus' ? 'focus' : 'break');
  } else if (state === 'paused') {
    tomatoFace.classList.add('paused');
  } else {
    tomatoFace.classList.add('idle');
  }
}

function updateProgressRingMode() {
  if (mode === 'break') {
    progressCircle.classList.add('break-mode');
  } else {
    progressCircle.classList.remove('break-mode');
  }
}

function updateSessionCount() {
  sessionCountEl.textContent = 'Session: ' + sessionCount;
}

function refreshUI() {
  updateDisplay();
  updateButtonStates();
  updateLabel();
  updateTomatoFace();
  updateProgressRingMode();
  updateSessionCount();
}

// === TIMER LOGIC ===
function tick() {
  if (startTimestamp === null) return;

  var elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
  remainingSeconds = totalSeconds - elapsed;

  if (remainingSeconds <= 0) {
    remainingSeconds = 0;
    updateDisplay();
    completeCycle();
    return;
  }

  updateDisplay();
}

function startTimer() {
  if (tickInterval !== null) {
    clearInterval(tickInterval);
  }

  if (state === 'paused') {
    totalSeconds = pausedRemaining;
    remainingSeconds = pausedRemaining;
    pausedRemaining = null;
  }

  startTimestamp = Date.now() - ((totalSeconds - remainingSeconds) * 1000);
  state = 'running';
  tickInterval = setInterval(tick, 200); // sub-second check for smooth UI
  refreshUI();
}

function pauseTimer() {
  if (tickInterval !== null) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
  pausedRemaining = remainingSeconds;
  startTimestamp = null;
  state = 'paused';
  refreshUI();
}

function resetTimer() {
  if (tickInterval !== null) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
  mode = 'focus';
  state = 'idle';
  totalSeconds = FOCUS_SECONDS;
  remainingSeconds = FOCUS_SECONDS;
  startTimestamp = null;
  pausedRemaining = null;
  progressCircle.classList.remove('urgent');
  refreshUI();
}

function completeCycle() {
  if (tickInterval !== null) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
  startTimestamp = null;

  playBeeps();

  if (mode === 'focus') {
    sendNotification('Focus Complete!', 'Great job! Time for a break.');
    sessionCount++;
    mode = 'break';
    totalSeconds = BREAK_SECONDS;
    remainingSeconds = BREAK_SECONDS;
  } else {
    sendNotification('Break Over!', 'Ready to focus again!');
    mode = 'focus';
    totalSeconds = FOCUS_SECONDS;
    remainingSeconds = FOCUS_SECONDS;
  }

  // auto-start next cycle
  state = 'idle';
  startTimer();
}

// === EVENT HANDLERS ===
btnStart.addEventListener('click', function () {
  if (state === 'idle') {
    totalSeconds = remainingSeconds;
    startTimer();
  } else if (state === 'paused') {
    startTimer();
  }
});

btnPause.addEventListener('click', function () {
  if (state === 'running') {
    pauseTimer();
  }
});

btnReset.addEventListener('click', function () {
  resetTimer();
});

// === INIT ===
progressCircle.style.strokeDasharray = RING_CIRCUMFERENCE;
progressCircle.style.strokeDashoffset = '0';
refreshUI();
