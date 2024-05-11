const { app, BrowserWindow, ipcMain } = require('electron');
const { run, GetChatHistory, GetSaveData, SetSaveData } = require('./excle.js'); 
const path = require('path');
const fs = require('fs');
const documentsFolder = app.getPath('documents');


function createWindow() {
  let win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'), // path to the preload script
      nodeIntegration: true,
    }
  });

  win.loadFile('index.html');
  win.setMenuBarVisibility(false);
  
  win.on('close', (e) => {
    if (!win) return;
    e.preventDefault(); // Prevents the window from closing immediately
  
    const newFolder = path.join(documentsFolder, 'ChatBot');
    if (!fs.existsSync(newFolder)) {
      fs.mkdirSync(newFolder);
    }
  
    const newFile = path.join(newFolder, 'myChats.json');
    
    let data = GetSaveData();
  
    fs.writeFileSync(newFile, data);

    win.removeAllListeners('close'); // Remove this close event listener
    win.close(); // Close the window
  });
}

app.whenReady().then(() => {
  const newFolder = path.join(documentsFolder, 'ChatBot');
  if (!fs.existsSync(newFolder)) {
    fs.mkdirSync(newFolder);
  }

  const newFile = path.join(newFolder, 'myChats.json');

  if (fs.existsSync(newFile)) {
    const data = fs.readFileSync(newFile, 'utf8');

    if(data.trim() !== '') {
      SetSaveData(data);
    }
  }

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Listen to the event 'enviarMensagemParaExcle' of the render process
ipcMain.on('requestAIResponse', (event, SendObject) => {
  let { chatId, message } = SendObject;
  let Data = JSON.parse(SendObject);

  run(Data.message, Data.chatId).then(response => {
    event.reply('responseAI', response);
  }).catch(error => {
    console.error("Erro ao enviar mensagem para o Excle: ", error);
  });
});

ipcMain.on('requestChatHistory', (event, currentChatId) => {
  let ChatHistory = GetChatHistory(currentChatId)
  
  event.reply('responseChatHistory', ChatHistory);
});

ipcMain.on('requestAllChats', (event, currentChatId) => {
  let SaveData = GetSaveData()
  event.reply('responseAllChats', SaveData);
});