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

// === NOTIFICATION PERMISSION ===
var notificationGranted = false;

function requestNotificationPermission() {
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      notificationGranted = true;
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then(function (perm) {
        notificationGranted = (perm === 'granted');
      });
    }
  }
}

requestNotificationPermission();

// Re-request on user gesture (required by some mobile browsers)
document.addEventListener('click', function () {
  if (!notificationGranted && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(function (perm) {
      notificationGranted = (perm === 'granted');
    });
  }
}, { once: false });

// === AUDIO ===
var audioCtx = null;

function resumeAudio() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playBeeps() {
  try {
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
    resumeAudio();
    var notes = [660, 880, 1100];

    notes.forEach(function (freq, i) {
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.18 + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + i * 0.18);
      osc.stop(audioCtx.currentTime + i * 0.18 + 0.35);
    });
  } catch (_) { /* audio not available */ }
}

// === NOTIFICATION ===
function sendNotification(title, body) {
  if (!notificationGranted) return;
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
  // Mobile: audio context needs a user gesture to resume
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

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
  tickInterval = setInterval(tick, 200);
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
  resumeAudio();
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

// === WAKE LOCK (prevent screen sleep during focus) ===
var wakeLock = null;

function requestWakeLock() {
  if ('wakeLock' in navigator && state === 'running') {
    navigator.wakeLock.request('screen').then(function (wl) {
      wakeLock = wl;
      wakeLock.addEventListener('release', function () {
        wakeLock = null;
      });
    }).catch(function () { /* not supported or denied */ });
  }
}

function releaseWakeLock() {
  if (wakeLock !== null) {
    wakeLock.release().catch(function () {});
    wakeLock = null;
  }
}

// Override startTimer to include wake lock
var originalStartTimer = startTimer;
startTimer = function () {
  originalStartTimer();
  requestWakeLock();
};

var originalPauseTimer = pauseTimer;
pauseTimer = function () {
  originalPauseTimer();
  releaseWakeLock();
};

var originalResetTimer = resetTimer;
resetTimer = function () {
  originalResetTimer();
  releaseWakeLock();
};

var originalCompleteCycle = completeCycle;
completeCycle = function () {
  releaseWakeLock();
  originalCompleteCycle();
  requestWakeLock();
};

// === INIT ===
progressCircle.style.strokeDasharray = RING_CIRCUMFERENCE;
progressCircle.style.strokeDashoffset = '0';
refreshUI();
