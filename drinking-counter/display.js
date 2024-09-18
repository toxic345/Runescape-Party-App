const { ipcRenderer } = require('electron');
const confetti = require('canvas-confetti');

let currentXP = 0;
let currentLevel = 1;
let xpToNextLevel = 50;
let growthFactor = 1.044;

let myCanvas = document.getElementById('confetti-canvas');
let myConfetti = confetti.create(myCanvas, {
    resize: true,
    useWorker: true,
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 0,
    colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8']
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

function randomInRange(min, max) {
    return Math.random() * (max - min) + min;//
}

function launchFireworks() {
    
    var duration = 3 * 1000;
    var animationEnd = Date.now() + duration;
    
    var interval = setInterval(function() {
        var timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        var particleCount = 50 * (timeLeft / duration);
        
        myConfetti({
            particleCount: particleCount,
            spread: 160,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8'],
            resize: true,
            useWorker: true,
            startVelocity: 30,
            spread: 360,
            ticks: 60,
            zIndex: 0
        });
        myConfetti({
            particleCount: particleCount,
            spread: 160,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8'],
            resize: true,
            useWorker: true,
            startVelocity: 30,
            spread: 360,
            ticks: 60,
            zIndex: 0
        });
    }, 250);
}

function calculateXpToNextLevel(level) {
    return Math.floor(50 * Math.pow(growthFactor, level - 1));
}

function updateXPDisplay() {
    ipcRenderer.send('log', 'updating display-- level: ' + currentLevel + '- xp: ' + currentXP);
    ipcRenderer.send('log', document.getElementById('level-text-1').innerText);
    if (currentLevel < 99) {
        document.getElementById('xp-fill').style.width = `${(currentXP / xpToNextLevel) * 100}%`;
        document.getElementById('xp-display').innerText = `${currentXP} / ${xpToNextLevel} XP`;
    } else {
        document.getElementById('xp-fill').style.width = `${(xpToNextLevel / xpToNextLevel) * 100}%`;
        document.getElementById('xp-display').innerText = `${xpToNextLevel} / ${xpToNextLevel} XP`;
    }
    document.getElementById('level-text-1').innerText = `${currentLevel}`;
    document.getElementById('level-text-1').style.left = currentLevel > 9 ? '94vh' : '101vh';
    document.getElementById('level-text-2').innerText = `${currentLevel}`;
    document.getElementById('level-text-2').style.right = currentLevel > 9 ? '41vh' : '50vh';
}

ipcRenderer.on('settings-updated', (event, newGrowthFactor) => {
    growthFactor = newGrowthFactor;
});