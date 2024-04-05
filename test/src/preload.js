const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('eAPI', {
  test: () => ipcRenderer.send('test')
})