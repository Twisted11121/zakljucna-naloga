const { app, BrowserWindow, ipcMain, screen, dialog } = require('electron')
const { initializeDatabase, getUser, insertContent, queryAllContent, queryUserContent, searchContent} = require('./database');
const { importQuizFromFile } = require('./parseImport');



let mainWindow;
let currentUser = null;
const db = initializeDatabase();

// Handle file import
ipcMain.on('import-file', (event, data) => {
  const result = importQuizFromFile(db, data.user, data.filePath);
  
  if (result.error) {
    event.reply('import-complete', { success: false, error: result.error });
    return;
  }
  
  insertContent(db, event, data.user, result.name, result.description, JSON.stringify(result.questions));
  
  loadIndexAndSend(currentUser);
});

// Handle open import dialog
ipcMain.on('open-import-dialog', (event) => {
  dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Text Files', extensions: ['txt'] }]
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      // Import the file
      const importResult = importQuizFromFile(db, currentUser, filePath);
      
      if (importResult.error) {
        event.reply('import-complete', { success: false, error: importResult.error });
        return;
      }
      
      // Save to database
      insertContent(db, event, currentUser, importResult.name, importResult.description, JSON.stringify(importResult.questions));
      
      // Go back to home page
      loadIndexAndSend(currentUser);
    }
  });
});

// Create main window
app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      width: 1200,
      height: 750,
      nodeIntegration: false,
      contextIsolation: true,
      preload: __dirname + '/preload.js'
    }
  });
  mainWindow.loadFile('login.html');
  mainWindow.webContents.openDevTools({ mode: 'detach' }); // shows debug console
  
});

// Handle login data from preload
ipcMain.on('login-data', (event, data) => {
  getUser(db, event, data.username, data.password)
  loadIndexAndSend(data.username)
});

// Load index and send username and content data
function loadIndexAndSend(username) {
  currentUser = username;
  queryAllContent(db, (rows) => {
    const data = rows;
    mainWindow.loadFile('index.html')
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.send('save-complete', { success: true, username, data })
    })
  });
}

// Handle page navigation from index page
function safeLoad(file) {
if (!mainWindow) return Promise.resolve();
return mainWindow.loadFile(file).catch(err => {
console.error('Failed to load', file, err);
});
}

//Load index
ipcMain.on('home-clicked', () => 
  loadIndexAndSend(currentUser));

// Load profile page and send username
ipcMain.on('profile-clicked', () => {
  safeLoad('profile.html').then(() => {
    queryUserContent(db, currentUser, (data) => {
      mainWindow.webContents.send('profile-data', currentUser, data.data);
    });
  });
});

ipcMain.on('create-clicked', () => {
  safeLoad('create.html').then(() => {
    mainWindow.webContents.send('profile-name', currentUser);
  });
});

ipcMain.on("create-data", (event, data) => {
  insertContent(db, event, data.user, data.title, data.description, JSON.stringify(data.questions));
  safeLoad('index.html');
});

// Handle quiz being clicked on profile page
ipcMain.on('open-content', (event, contentId) => {
  console.log('Opening content with ID:', contentId);
  // load quiz.html and send contentId
  queryUserContent(db, currentUser, (data) => {
    const content = data.data.find(item => item.id === contentId);
    console.log('Found content:', content);
    safeLoad('quiz.html').then(() => {
      mainWindow.webContents.send('quiz-data', content);
    })
  });
});

// Search
ipcMain.on('search-query', (event, query) => {
  searchContent(db, query, (data) => {
    mainWindow.webContents.send('search-results', data);
  });
});