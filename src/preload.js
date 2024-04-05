const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('eAPI', {
  close: () => ipcRenderer.send('close'),
  minimize: () => ipcRenderer.send('minimize'),
  maximize: () => ipcRenderer.send('maximize'),
  addConnection: (customName, ip, port, user, password, database) => ipcRenderer.invoke('new-connection', customName, ip, port, user, password, database),
  closeConnection: (id) => ipcRenderer.invoke('close-connection', id),
  activateDB: (id) => ipcRenderer.invoke('activate-db', id),
  getActiveDB: () => ipcRenderer.sendSync('get-activedb'),
  getActiveDBData: () => ipcRenderer.sendSync('get-activedb-data'),
  // getQuery: (id) => ipcRenderer.invoke('get-query', id),
  executeQuery: (query) => ipcRenderer.invoke('execute-query', query),
  clearConnections: () => ipcRenderer.invoke('clear-connections'),
  getConnections: () => ipcRenderer.sendSync('get-connections'),
  getRLConnections: () => ipcRenderer.sendSync('get-rl-connections'),
  alert: (system, message) => ipcRenderer.send('send-alert', system, message)
})

ipcRenderer.on('version', (event, version) => {
  console.log('version', version)
})