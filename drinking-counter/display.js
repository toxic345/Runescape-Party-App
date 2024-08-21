const { ipcRenderer } = require('electron');
const confetti = require('canvas-confetti');

let currentXP = 0;
let currentLevel = 1;
let xpToNextLevel = 100;

let myCanvas = document.getElementById('confetti-canvas');
let myConfetti = confetti.create(myCanvas, {
    resize: true,
    useWorker: true
});

ipcRenderer.on('load-progress', (event, level, xp) => {
    currentLevel = level;
    currentXP = xp;
    xpToNextLevel = calculateXpToNextLevel(currentLevel);
    updateXPDisplay();
});

ipcRenderer.on('update-xp', (event, level, xp) => {
    if (level > currentLevel) {
        launchFireworks();
    }

    currentLevel = level;
    currentXP = xp;
    xpToNextLevel = calculateXpToNextLevel(currentLevel);
    updateXPDisplay();
});

function launchFireworks() {
    myConfetti({
        particleCount: 100,
        spread: 160,
        origin: { y: 0.6 }
    });
}

function calculateXpToNextLevel(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
}

function updateXPDisplay() {
    document.getElementById('level').innerText = `Level: ${currentLevel}`;
    document.getElementById('xp-fill').style.width = `${(currentXP / xpToNextLevel) * 100}%`;
    document.getElementById('xp-display').innerText = `${currentXP} / ${xpToNextLevel} XP`;
}
