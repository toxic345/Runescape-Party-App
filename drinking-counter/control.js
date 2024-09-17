const { ipcRenderer } = require('electron');

let xpList = [100, 200];

document.addEventListener('keyup', (event) => {
    const key = event.key;

    switch (key) {
        case '1':
            triggerDrinkButton(1);
            break;
        case '2':
            triggerDrinkButton(2);
            break;
        case '9':
            triggerDrinkButton(4);
        default:
            break;
    }
});

function triggerDrinkButton(drinkId) {
    switch (drinkId) {
        case 1:
            addXP(0);
            break;
        case 2:
            addXP(1);
            break;
        case 4:
            levelUp();
            break;
        default:
            break;
    }
    ipcRenderer.send('drink-bought', drinkId);
}

function addXP(index) {
    console.log("adding xp");
    xp = xpList[index];
    ipcRenderer.send('update-xp', xp);
}

function levelUp() {
    console.log("level up!");
    ipcRenderer.send('level-up');
}

ipcRenderer.on('settings-updated', (event, newXPList) => {
    xpList = newXPList;
});