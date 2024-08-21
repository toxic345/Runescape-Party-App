const { app, BrowserWindow, ipcMain, Menu, dialog  } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

let mainWindow, controlWindow;
let db;

function createWindows() {
    mainWindow = new BrowserWindow({
        fullscreen: true,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    controlWindow = new BrowserWindow({
        fullscreen: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');
    controlWindow.loadFile('control.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    controlWindow.on('closed', () => {
        controlWindow = null;
    });
}

function createDatabase() {
    db = new sqlite3.Database('drinking_counter.db', (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
        } else {
            console.log('Connected to SQLite database.');
            db.run(`CREATE TABLE IF NOT EXISTS progress (
                id INTEGER PRIMARY KEY,
                level INTEGER,
                xp INTEGER
            )`);

            // Ensure there's a row to store progress
            db.get("SELECT * FROM progress", (err, row) => {
                if (!row) {
                    db.run("INSERT INTO progress (level, xp) VALUES (1, 0)");
                }
            });
        }
    });
}

function resetProgress() {
    db.run("UPDATE progress SET level = 1, xp = 0", () => {
        mainWindow.webContents.send('load-progress', 1, 0);
    });
}

app.on('ready', () => {
    createDatabase();
    createWindows();
    
    // Wait for the main window to be ready before sending the event
    mainWindow.webContents.on('did-finish-load', () => {
        // Load XP and Level from the database on app startup
        db.get("SELECT * FROM progress", (err, row) => {
            if (row) {
                mainWindow.webContents.send('load-progress', row.level, row.xp);
            } else {
                // In case of a new database, initialize it with level 1 and 0 XP
                mainWindow.webContents.send('load-progress', 1, 0);
            }
        });
    });

    const menu = Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
                {
                    label: 'Reset Progress',
                    click() {
                        const response = dialog.showMessageBoxSync(mainWindow, {
                            type: 'warning',
                            buttons: ['Cancel', 'Yes, Reset'],
                            defaultId: 0,
                            cancelId: 0,
                            title: 'Confirm Reset',
                            message: 'Are you sure you want to reset all progress?',
                            detail: 'This action cannot be undone.'
                        });
                        if (response === 1) {
                            resetProgress();
                        }
                    }
                },
                { role: 'quit' }
            ]
        }
    ]);
    Menu.setApplicationMenu(menu);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindows();
    }
});

ipcMain.on('update-xp', (event, xp) => {
    db.get("SELECT * FROM progress", (err, row) => {
        if (row) {
            let newXP = row.xp + xp;
            let newLevel = row.level;

            // Level up logic
            while (newXP >= xpToNextLevel(newLevel)) {
                newXP -= xpToNextLevel(newLevel);
                newLevel++;
            }

            db.run("UPDATE progress SET level = ?, xp = ?", [newLevel, newXP], () => {
                mainWindow.webContents.send('update-xp', newLevel, newXP);
            });
        }
    });
});

function xpToNextLevel(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1)); // Example scaling formula
}