const { ipcRenderer } = require('electron');

function addXP(xp) {
    ipcRenderer.send('update-xp', xp);
}
