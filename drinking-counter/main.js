const { app, BrowserWindow, ipcMain, Menu, dialog  } = require('electron');
const sqlite3 = require('sqlite3').verbose();

let mainWindow, controlWindow, settingsWindow;
let db;

let baseGrowthFactor = 1.044;
let currentGrowthFactor = 1.044;

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

    //mainWindow.webContents.openDevTools(); // TODO remove
    //controlWindow.webContents.openDevTools(); // TODO remove
    console.log('App started!!!');

    logTotalXpRequirement();
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
                xp INTEGER,
                growthFactor REAL
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS drinks (
                id INTEGER PRIMARY KEY,
                type TEXT,
                count INTEGER,
                xp INTEGER
            )`);

            // Ensure there's a row to store progress
            db.get("SELECT * FROM progress", (err, row) => {
                if (!row) {
                    db.run("INSERT INTO progress (level, xp, growthFactor) VALUES (1, 0, ?)", [baseGrowthFactor]);
                }
            });

            db.get("SELECT * FROM drinks", (err, row) => {
                if (!row) {
                    db.run("INSERT INTO drinks (type, count, xp) VALUES ('beer', 0, 100)");
                    db.run("INSERT INTO drinks (type, count, xp) VALUES ('cocktail', 0, 200)");
                }
            });
        }
    });
}

function resetProgress() {
    
    db.run("UPDATE drinks SET count = 0, xp = 100 WHERE id = 1", () => {});
    db.run("UPDATE drinks SET count = 0, xp = 200 WHERE id = 2", () => {});

    db.run("UPDATE progress SET level = 1, xp = 0, growthFactor = ?", [baseGrowthFactor], () => {
        mainWindow.webContents.send('load-progress', 1, 0);
    });

    currentGrowthFactor = baseGrowthFactor;

    mainWindow.webContents.send('settings-updated', currentGrowthFactor);
    controlWindow.webContents.send('settings-updated', [100, 200]);
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
                mainWindow.webContents.send('settings-updated', row.growthFactor);
            } else {
                // In case of a new database, initialize it with level 1 and 0 XP
                mainWindow.webContents.send('load-progress', 1, 0);
                mainWindow.webContents.send('settings-updated', currentGrowthFactor);
            }
        });
    });

    controlWindow.webContents.on('did-finish-load', () => {
        var xpList = [];
        console.log("Loading drink xp for each drink: ");
        // Load XP and Level from the database on app startup
        db.all("SELECT * FROM drinks ORDER BY id ASC", (err, rows) => {
            rows.forEach(function (row) {
                console.log(row);
                xpList.push(row.xp);
            })
            console.log(xpList);
            controlWindow.webContents.send('settings-updated', xpList);
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
                {
                    label: 'Settings',
                    click() {
                        settingsWindow = new BrowserWindow({
                            width: 400,
                            height: 400,
                            frame: false,
                            webPreferences: {
                              nodeIntegration: true,
                              contextIsolation: false,
                            },
                          });
                        
                          settingsWindow.loadFile('settings.html');
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
    console.log('update xp');
    db.get("SELECT * FROM progress", (err, row) => {
        if (row) {
            console.log(row);
            let newXP = row.xp + xp;
            let newLevel = row.level;

            // Level up logic
            while (newXP >= xpToNextLevel(newLevel)) {
                newXP -= xpToNextLevel(newLevel);
                newLevel++;
            }

            if (newLevel < 100) {
                db.run("UPDATE progress SET level = ?, xp = ?", [newLevel, newXP], () => {
                    console.log('sending update');
                    mainWindow.webContents.send('update-xp', newLevel, newXP);
                });
            }
        }
    });
});

ipcMain.on('log', (event, message) => {
    console.log(message);
});

ipcMain.on('level-up', (event) => {
    db.get("SELECT * FROM progress", (err, row) => {
        if (row) {
            console.log(row);
            let newLevel = row.level+1;
            let newXP = xpToNextLevel(newLevel);

            if (newLevel < 100) {
                db.run("UPDATE progress SET level = ?, xp = ?", [newLevel, newXP], () => {
                    console.log('sending update');
                    mainWindow.webContents.send('update-xp', newLevel, newXP);
                });
            }
        }
    });
});

ipcMain.on('drink-bought', (event, drinkId) => {
    db.get("SELECT * FROM drinks WHERE id = ?", [drinkId], (err, row) => {
        if (row) {
            console.log(row);
            db.run("UPDATE drinks SET count = ? WHERE id = ?", [row.count+1, drinkId], () => {});
        }
    });
});

// Experience function with a growing factor (geometric progression)
function xpToNextLevel(level) {
    return Math.floor(50 * Math.pow(currentGrowthFactor, level - 1));
}

function logTotalXpRequirement() {
    let cumulativeXP = 0;
    for (let level = 1; level <= 99; level++) {
      cumulativeXP += xpToNextLevel(level);
    }
    console.log('total xp needed: ' + cumulativeXP);
    return cumulativeXP;
}

// Listen for settings changes and update the global variables
ipcMain.on('update-settings', (event, newXpList, newGrowthFactor) => {
    console.log("received updated settings: ? & ?", [newXpList, newGrowthFactor]);
    settingsWindow.close();

    currentGrowthFactor = newGrowthFactor;

    mainWindow.webContents.send('settings-updated', currentGrowthFactor);
    controlWindow.webContents.send('settings-updated', newXpList);
});