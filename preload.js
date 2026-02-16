const { contextBridge, ipcRenderer } = require('electron');

// Login preload script
contextBridge.exposeInMainWorld('api', {
  sendLoginData: (data) => ipcRenderer.send('login-data', data),
  onSaveComplete: (callback) => ipcRenderer.on('save-complete', (event, result) => callback(result)),
  sendNav: (page) => ipcRenderer.send(`${page}-clicked`, true),

  onProfileData: (callback) =>
    ipcRenderer.on('profile-data', (event, username, data) => {
      callback(username, data);
    }),
  sendCreateData: (data) => ipcRenderer.send('create-data', data),

  onProfileName: (callback) =>
  ipcRenderer.on('profile-name', (event, username) => {
    callback(username);
  }),

  openContent: (contentId) => ipcRenderer.send('open-content', contentId),

  // Add quiz data request for quizMainPage.html
  onQuizData: (callback) =>
    ipcRenderer.on('quiz-data', (event, quizData) => {
      callback(quizData);
    })

});
