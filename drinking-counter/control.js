const { ipcRenderer } = require('electron');

document.addEventListener('keyup', (event) => {
    const key = event.key;

    switch (key) {
        case '1':
            triggerDrinkButton(1);
            break;
        case '2':
            triggerDrinkButton(2);
            break;
        case '3':
            triggerDrinkButton(3);
            break;
        default:
            break;
    }
});

function triggerDrinkButton(drinkId) {
    switch (drinkId) {
        case 1:
            addXP(10);
            break;
        case 2:
            addXP(20);
            break;
        case 3:
            addXP(30);
            break;
        default:
            break;
    }
}

function addXP(xp) {
    console.log("adding xp");
    ipcRenderer.send('update-xp', xp);
}
