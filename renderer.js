// Timer durations in seconds
const WORK_TIME = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;

const CIRCUMFERENCE = 2 * Math.PI * 90; // radius=90

// State
let timeLeft = WORK_TIME;
let totalTime = WORK_TIME;
let isRunning = false;
let intervalId = null;
let completedSessions = 0;
let sessionType = 'work'; // 'work' | 'shortBreak' | 'longBreak'

// DOM elements
const timerText = document.getElementById('timer-text');
const sessionLabel = document.getElementById('session-label');
const sessionCounter = document.getElementById('session-counter');
const ring = document.getElementById('ring');
const btnStart = document.getElementById('btn-start');
const btnPause = document.getElementById('btn-pause');
const btnReset = document.getElementById('btn-reset');
const alwaysOnTop = document.getElementById('always-on-top');

// Initialize ring
ring.style.strokeDasharray = `${CIRCUMFERENCE}`;
ring.style.strokeDashoffset = '0';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateDisplay() {
  timerText.textContent = formatTime(timeLeft);
  const progress = 1 - timeLeft / totalTime;
  ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  updateTray();
}

function updateTray() {
  const emoji = sessionType === 'work' ? '🍅' : '☕';
  window.electronAPI.setTrayTitle(`${emoji} ${formatTime(timeLeft)} - ${getSessionLabel()}`);
}

function getSessionLabel() {
  if (sessionType === 'work') return 'Focus';
  if (sessionType === 'shortBreak') return 'Short Break';
  return 'Long Break';
}

function updateUIForSession() {
  sessionLabel.textContent = getSessionLabel();
  if (sessionType === 'work') {
    totalTime = WORK_TIME;
    timeLeft = WORK_TIME;
    ring.style.stroke = '#e74c3c';
  } else if (sessionType === 'shortBreak') {
    totalTime = SHORT_BREAK;
    timeLeft = SHORT_BREAK;
    ring.style.stroke = '#2ecc71';
  } else {
    totalTime = LONG_BREAK;
    timeLeft = LONG_BREAK;
    ring.style.stroke = '#3498db';
  }
  updateDisplay();
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  btnStart.disabled = true;
  btnPause.disabled = false;

  intervalId = setInterval(() => {
    timeLeft--;
    updateDisplay();

    if (timeLeft <= 0) {
      clearInterval(intervalId);
      isRunning = false;
      btnStart.disabled = false;
      btnPause.disabled = true;
      onSessionEnd();
    }
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  clearInterval(intervalId);
  isRunning = false;
  btnStart.disabled = false;
  btnPause.disabled = true;
}

function resetTimer() {
  clearInterval(intervalId);
  isRunning = false;
  sessionType = 'work';
  completedSessions = 0;
  updateUIForSession();
  sessionCounter.textContent = '0 sessions completed';
  btnStart.disabled = false;
  btnPause.disabled = true;
}

function onSessionEnd() {
  if (sessionType === 'work') {
    completedSessions++;
    sessionCounter.textContent = `${completedSessions} session${completedSessions > 1 ? 's' : ''} completed`;
    window.electronAPI.showNotification('Pomodoro', 'Focus session complete! Time for a break.');

    if (completedSessions % 4 === 0) {
      sessionType = 'longBreak';
    } else {
      sessionType = 'shortBreak';
    }
  } else {
    sessionType = 'work';
    window.electronAPI.showNotification('Pomodoro', 'Break over! Time to focus.');
  }

  updateUIForSession();
}

// Event listeners
btnStart.addEventListener('click', startTimer);
btnPause.addEventListener('click', pauseTimer);
btnReset.addEventListener('click', resetTimer);

alwaysOnTop.addEventListener('change', () => {
  window.electronAPI.setAlwaysOnTop(alwaysOnTop.checked);
});

// Init
updateUIForSession();
