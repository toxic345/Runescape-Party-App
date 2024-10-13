# Runescape-Party-App
Application used for a private Runescape themed party
App will completely run locally at the bar, so no web features required, unless there will be integration with the chat app.

## Overview
The Drinking Counter App is a lightweight, RuneScape-themed application designed to track and display the group's collective "drinking level" in a fun and interactive way. The app consists of two main components: a control panel for registering drink purchases and a display window that shows the group's progress towards leveling up. The goal is to reach level 99, with special events triggered at key milestones.

## Set-up guide
1. Install Node.js if you haven't already. You can download it from Node.js official website.
2. Make sure you install the required libaries by running the following commands:
   - npm install electron
   - npm install sqlite3
   - npm install canvas-confetti
3. Run the application using the following command: npm start

## Architecture

### 1. **Electron Framework**
- The app is built using Electron, which allows for the creation of cross-platform desktop applications using web technologies (HTML, CSS, JavaScript).
- Electron manages both the frontend (UI) and backend (logic) within a single application.

### 2. **Main Process (`main.js`)**
- The main process handles the creation of application windows and manages inter-process communication (IPC) between the control panel and the display window.
- It initializes two separate windows:
  - **Display Window (`index.html`)**: Shows the current level, XP bar, and progress towards the next level.
  - **Control Window (`control.html`)**: Allows users to register drinks and add XP to the group's total.

### 3. **Renderer Processes**
- Each window (Display and Control) runs in its own renderer process, managing its own UI and logic.
- **Display Window**:
  - Displays the group's current level, total XP, and XP required for the next level.
  - Updates dynamically as XP is added via the control window.
- **Control Window**:
  - Contains buttons for registering different types of drinks.
  - Sends XP updates to the display window through IPC.

### 4. **Inter-Process Communication (IPC)**
- The app uses Electron's IPC mechanism to communicate between the control and display windows.
- XP updates are sent from the control window to the main process, which then forwards them to the display window for real-time updates.

### 5. **Leveling Logic**
- The app includes basic leveling mechanics, where the XP required to reach the next level increases as the group levels up.
- Special events (like a drop party) are triggered at key milestones, such as level 92 and level 99.

### 6. **Styling and Theming**
- The app uses custom HTML and CSS to create a RuneScape-themed user interface, with an XP bar and level display that evoke the game's iconic style.
- Further enhancements can include custom graphics, sounds, and animations to fully immerse users in the theme.


## Ideas
- Progress bar for next level
- Different xp per drink type
- Chat notifications for levels? -> Requires integration with chat app
- Double xp events
- Challenges:
  - Achievements, example: Drink 200 beers total
  - Individual Bar crawls: Drink one of every drink
  - Highscores
- Random events?
  - Drink x amount of drinks for an xp boost

# Chat
## Set-up guide
- Run the server using the following command: node server.js
- Run a client using the following command: npm start
