const {app, BrowserWindow, ipcMain, dialog} = require('electron')
const path = require('path')
const url = require('url')
try { require('electron-reloader')(module);} catch {};
const mysql = require('mysql2');
const DiscordRPC = require('discord-rpc');

const log = require('electron-log/main');

const { autoUpdater } = require('electron-updater');

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow = null;
let connections = [];
let rlConnections = [];

let needRestart = false;

let activeDB = -1;

let rpc;

async function setActivity() {
    if (!rpc || !mainWindow) {
        return;
    }

    const activity = { 
        instance: false, 
        startTimestamp, 
        // details: "Magma Editor",
        state: "Handling some databases",
        largeImageKey: "biglogo",
        largeImageText: "Magma logo",
        smallImageKey: "smalllogodocument",
        smallImageText: "Editing...",
    }; 

    rpc.setActivity(activity);
}

function discordRPC(clientId) {
    if (rpc) {
        rpc.clearActivity();
        rpc.destroy();
        rpc = undefined;
    }
    rpc = new DiscordRPC.Client({ transport: 'ipc' });
    rpc.on('ready', () => {
        setActivity();

        setInterval(() => {
            setActivity();
        }, 15e3);
    });

    startTimestamp = new Date();
    rpc.login({ clientId });
}


const createWindow = () => {
    mainWindow = new BrowserWindow({
        autoHideMenuBar: true,
        width: 1200,
        height: 800,
        icon: __dirname + '/assets/favicon/favicon-96x96.png',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        frame: false,
        titleBarStyle: 'hidden',
    });

    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, 'index.html'),
            protocol: 'file:',
            slashes: true
        })
    );

    mainWindow.on('closed', () => {
        mainWindow = null
    });

    // mainWindow.on("ready-to-show", () => {
    //     mainWindow.webContents.openDevTools();
    // });

}


async function getItem(key) {

    let result = await mainWindow.webContents.executeJavaScript('localStorage.getItem("'+key+'");', true);
    
    return JSON.parse(result);
    
}

async function setItem(key, value) {

    let result = await mainWindow.webContents.executeJavaScript('localStorage.setItem("'+key+'", JSON.stringify('+value+'));', true);

    return result;
    
}

async function loadConnection(customName, ip, port, user, password, database, id = -1) {
    
    try{

        const connection = await createConnection(ip, port, user, password, database);

        let testCon = await new Promise((resolve, reject) => {
            connection.query("SELECT 1", (err, results) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(results);
                }
            });
        });

        if(testCon.length === 0) return { status: "error", message: "Connection refused" };

        rlConnections.push(connection);

        let resp = await getInitialQuery(id === -1 ? connections.length : id);

        if(resp.state === "error") return { status: "error", message: "Error with the query conversion" };
            
        const data = { name: customName ? customName : database, database: database, data: resp.data };

        if(id === -1) {
            data.id = connections.length;
        } else {
            data.id = id;
        }

        connections.push(data);

        return data;
    }catch(error){

        console.error("Connection failed:", error);
    
        if(id !== -1) {
            if(needRestart) return;

            const select = dialog.showMessageBoxSync(mainWindow, {
                type: 'warning',
                title: 'Error loading connection \'' + customName + '\'',
                message: 'Error loading connection \'' + customName + (customName != database ? ('/' + database) : "")+'\' (' + error.code + ') to fix this error put the database server on and open again the program.',
                buttons: ['Ignore', 'Restart'],
                defaultId: 0,
            })
    
            if(select === 1) {
                needRestart = true;
                app.relaunch();
                app.exit();
            }
            
        }else {
            return handleError(error);
        }

    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

app.whenReady().then(async ()=>{

    discordRPC("1176467877176557649");

    ipcMain.handle('new-connection', async (event, ...args) => {
        try {
            const [customName, ip, port, user, password, database] = args;
            
            const data = await loadConnection(customName, ip, port, user, password, database);

            if(data.status === "error") return data;

            let rlConnectionsData = await getItem('connections');
            rlConnectionsData.push({ customName: customName, ip: ip, port: port, user: user, password: password, database: database });
            await setItem('connections', JSON.stringify(rlConnectionsData));

            const status = { status: "success", message: "Connected successfully", data: data };

            log.debug("New connection: " + status);

            return status;
        } catch (error) {

            console.error("Connection failed:", error);
            log.debug("Connection failed: " + error);

            return handleError(error);

        }
    });
    
    ipcMain.handle('close-connection', async (event, id) => {

        const userSelection = dialog.showMessageBoxSync(mainWindow, {
            type: 'warning',
            title: 'Erase connection \'' + connections[id].name + '\'',
            message: 'Are you sure you want to close and delete this connection?',
            buttons: ['Cancel', 'Erase and Continue'],
            defaultId: 0,
            cancelId: 0
        })

        if(userSelection === 0) return false;

        rlConnections[id].end();
        connections.splice(id, 1);
        rlConnections.splice(id, 1);

        let connectiondata = await getItem('connections');

        await setItem('connections', JSON.stringify(connectiondata.filter((connection) => connection.index != id)));

        log.debug("Connection closed: " + id);

        return true;
    });

    ipcMain.handle('clear-connections', async (event) => {

        const userSelection = dialog.showMessageBoxSync(mainWindow, {
            type: 'warning',
            title: 'Erase all connections',
            message: 'Are you sure you want to close and delete all connections?',
            buttons: ['Cancel', 'Erase and Continue'],
            defaultId: 0,
            cancelId: 0
        })

        if(userSelection === 0) return false;

        rlConnections.forEach(connection => {
            connection.end();
        });

        connections = [];
        rlConnections = [];

        await setItem('connections', JSON.stringify([]));

        log.debug("All connections closed");

        return true;
    });

    ipcMain.handle('activate-db', (event, id) => {
        activeDB = id;

        log.debug("Active DB: " + id);

        return true;
    });

    ipcMain.on('get-activedb-data', (event) => {
        if(activeDB === -1) {
            event.returnValue = false;
            return;
        }
        // connections[activeDB].id = activeDB;
        event.returnValue = connections[activeDB];
    });

    ipcMain.on('get-activedb', (event) => {
        event.returnValue = rlConnections[activeDB];
    });

    // ipcMain.handle('get-query', async (event, id) => {

    //     try {
    //         return await getQuery(id);
    //     } catch (error) {

    //         return { state: "error", message: error.message };
    //     }

    // });

    ipcMain.handle('execute-query', async (event, query) => {

        try {
            const result = await new Promise((resolve, reject) => {

                // rlConnections[activeDB].connect((err) => {
                //     if (err) {
                //         console.error(err.code);
                //         console.error(err.fatal);
                        
                //         return reject(err);;
                //     }
                    rlConnections[activeDB].query(query, function (error, results, fields) {
                        if (error) {
                            return reject(error);
                        }else{
                            return resolve(results);
                        }
                    });
                // });
            });
            
            // rlConnections[activeDB].end();

            const status = { state: "success", message: "Query executed successfully", result: result };

            log.debug("Query executed: " + status);

            return status;
        } catch (error) {
            // rlConnections[activeDB].end();

            console.error('Error:', error);

            const status = { state: "error", message: error.sqlMessage };

            log.debug("Query error: " + status);

            return status;

        }
    });

    ipcMain.on('get-connections', (event) => {
        event.returnValue = connections;
    });

    ipcMain.on('close', () => {
        BrowserWindow.getFocusedWindow().close();
    });

    ipcMain.on('minimize', () => {
        BrowserWindow.getFocusedWindow().minimize();
    });

    ipcMain.on('maximize', () => {
        if (BrowserWindow.getFocusedWindow().isMaximized()) {
            BrowserWindow.getFocusedWindow().unmaximize();
        } else {
            BrowserWindow.getFocusedWindow().maximize();
        }
    });

    ipcMain.on("send-alert", (event, system, incomingMessage) => {
        const options = {
            type: system,
            buttons: ["Ok"],
            title: system.charAt(0).toUpperCase() + system.slice(1) + " message",
            message: incomingMessage
        };
        dialog.showMessageBox(mainWindow, options);

        log.debug("Alert: " + incomingMessage);

    });


    if (mainWindow === null){
        createWindow();
        mainWindow.webContents.send('version', app.getVersion());

        log.debug("-----------------------\n\nWindow created\n\n-----------------------");

        autoUpdater.checkForUpdates();

        let startUpMysql = await getItem('run_mysql_at_startup');

        if(startUpMysql && startUpMysql.startup) {
            log.debug("Starting MySQL at startup");
            
            let mysqlPath = await getItem('mysql_bin_path');

            if(mysqlPath) {
                mysqlPath = mysqlPath.path;
            } else {
                mysqlPath = "C:\\xampp\\mysql\\bin\\mysqld.exe";
            }

            //before start, check if the process is already running
            const exec = require('child_process').exec;
            function isRunning(win, mac, linux){
                return new Promise(function(resolve, reject){
                    const plat = process.platform
                    const cmd = plat == 'win32' ? 'tasklist' : (plat == 'darwin' ? 'ps -ax | grep ' + mac : (plat == 'linux' ? 'ps -A' : ''))
                    const proc = plat == 'win32' ? win : (plat == 'darwin' ? mac : (plat == 'linux' ? linux : ''))
                    if(cmd === '' || proc === ''){
                        resolve(false)
                    }
                    exec(cmd, function(err, stdout, stderr) {
                        resolve(stdout.toLowerCase().indexOf(proc.toLowerCase()) > -1)
                    })
                })
            }

            const file = mysqlPath.split("\\")[mysqlPath.split("\\").length - 1];

            let running = await isRunning(file, file, file);

            if(!running) {
                // exec('cmd /c "' + mysqlPath + '\\mysqld.exe"', (error, stdout, stderr) => {
                //     if (error) {
                //         log.error(`exec error: ${error}`);
                //         return;
                //     }
                //     log.debug(`stdout: ${stdout}`);
                //     log.debug(`stderr: ${stderr}`);
                // });

                const { stdout, stderr } = await exec('cmd /c "' + mysqlPath);

                await sleep(2000);
            }
        }

        const storedConnections = await getItem('connections');
  
        if (storedConnections) {

            rlConnections = [];
            connections = [];
            
            // let sortedCons = storedConnections.sort((a,b)=> (a.index > b.index ? 1 : -1));

            let index = 0;
            for(let connection of storedConnections) {
                connection.index = index;
                await loadConnection(connection.customName, connection.ip, connection.port, connection.user, connection.password, connection.database, connection.index); 
                index++;
            }

            await setItem('connections', JSON.stringify(storedConnections));

            log.debug("Connections loaded: " + storedConnections.length);

        }else{
            await setItem('connections', JSON.stringify([]));

            log.debug("Connections loaded: 0");
        }
    }

});

async function createConnection(ip, port, user, password, database) {

    return new Promise((resolve, reject) => {
        const connection = mysql.createConnection({
            host: ip,
            port: port,
            user: user,
            password: password,
            database: database
        });

        connection.connect((err) => {
            if (err) {
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });
}

function handleError(error) {
    if (error.code === "ECONNREFUSED") {
        return { status: "error", message: "Connection refused" };
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
        return { status: "error", message: "Access denied" };
    } else if (error.code === "ER_BAD_DB_ERROR") {
        return { status: "error", message: error.sqlMessage };
    } else if (error.code === "ER_WRONG_DB_NAME") {
        return { status: "error", message: error.sqlMessage };
    } else {
        return { status: "error", message: "Unknown error (try to restart)" };
    }
}

async function getInitialQuery(id) {
    try {
        const createTables = await new Promise((resolve, reject) => {
            // rlConnections[id].connect((err) => {
            //     if (err) {
            //         console.error(err.code);
            //         console.error(err.fatal);
                    
            //         return reject(err);;
            //     }

            //     log.debug(rlConnections[id].state);

                rlConnections[id].query(`SHOW TABLES`, function (error, results, fields) {
                    if (error) {
                        reject(error);
                    } else {

                        const tableNames = results.map(result => result[`Tables_in_${rlConnections[id].config.database}`]);

                        const createTableQueryPromises = [];

                        const getCreateTableQuery = (tableName) => {
                            return new Promise((resolve, reject) => {
                                const query = `SHOW CREATE TABLE \`${tableName}\``;
                                rlConnections[id].query(query, (err, results) => {
                                    if (err) {
                                        return reject(err);
                                    } else {
                                        resolve(results[0]['Create Table']);
                                    }
                                });
                            });
                        };

                        tableNames.forEach((tableName) => {
                            createTableQueryPromises.push(getCreateTableQuery(tableName));
                        });

                        Promise.all(createTableQueryPromises)
                            .then((createTableQueries) => {
                                resolve(createTableQueries);
                            })
                            .catch((err) => {
                                reject(err);
                            });
                    }
                });
            // });
        });

        // rlConnections[id].end();

        let query = createTables.join("\n\n").replaceAll("`", "");
        
        let newQuery = convertSqlToGraph(query);

        return { state: "success", data: newQuery, query: query };
    } catch (error) {
        
        // rlConnections[id].end();

        throw error;
    }
}

// function convertSqlToGraph(sqlQuery) {
//     const data = {
//       nodes: [],
//       links: [],
//     };
  
//     const statements = sqlQuery.split(";");

//     for (const statement of statements) {
//       const createTableRegex = /CREATE\s+TABLE\s+["]?(\w+)["]?\s+\(((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi;
//       const match = statement.match(createTableRegex);

//       if(match === null) return data;
  
//       match.forEach((table) => {
//         const createTableRegex = /CREATE\s+TABLE\s+["]?(\w+)["]?\s+\(((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*)\)/i;
//         const matchTableName = table.match(createTableRegex);
  
//         let columnsNew = [];
  
//         if (matchTableName) {
//           const tableName = matchTableName[1];
//           const columns = matchTableName[2].split(",\n");
  
//           for (let column of columns) {
//             column = column.trim();
  
//             columnsNew.push(column);
//             const foreignKeyRegex = /FOREIGN\s+KEY\s+\("?(.+?)"?\)\s+REFERENCES\s+"?(\w+)"?\s*\("?(.+?)"?\)/i;
//               ///FOREIGN\s+KEY\s+\(([^)]+)\)\s+REFERENCES\s+(\w+)\s*\(([^)]+)\)/i;
//             const columnMatch = column.match(foreignKeyRegex);
  
//             if (columnMatch) {
//               const columnNames = columnMatch[1]
//                 .split(",")
//                 .map((name) => name.trim());
//               const referencedTable = columnMatch[2];
//               const referencedColumns = columnMatch[3]
//                 .split(",")
//                 .map((name) => name.trim());
  
//               for (let i = 0; i < columnNames.length; i++) {
//                 data.links.push({
//                   source: tableName,
//                   target: referencedTable,
//                   label: columnNames[i] + " -> " + referencedColumns[i],
//                 });
//               }
//             }
//           }
  
//           let columnsNewDone = [];
  
//           columnsNew.forEach(c => {
//             const match = c.match(/\b(\w+)\b/);
  
//             if (match && match.length > 1) {
//                 if(!match[1].toLowerCase().includes("primary") && !match[1].toLowerCase().includes("key") && !match[1].toLowerCase().includes("constraint") && !match[1].toLowerCase().includes("unique")){
//                     columnsNewDone.push({ label: match[1] });
//                 }
//             } 
//           })
  
//           data.nodes.push({
//             id: tableName,
//             label: tableName,
//             columns: columnsNewDone,
//           });
//         }
//       });
//     }
  
//     return data;
//   }

function convertSqlToGraph(sqlQuery) {
    const data = {
      nodes: [],
      links: [],
    };
  
    const statements = sqlQuery.split(";");
  
    for (const statement of statements) {
      const createTableRegex = /CREATE\s+TABLE\s+["]?(\w+)["]?\s+\(((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi;
      const match = statement.match(createTableRegex);
  
      if (match === null) return data;
  
      match.forEach((table) => {
        const createTableRegex = /CREATE\s+TABLE\s+["]?(\w+)["]?\s+\(((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*)\)/i;
        const matchTableName = table.match(createTableRegex);
  
        let columnsNew = [];
  
        if (matchTableName) {
          const tableName = matchTableName[1];
          const columns = matchTableName[2].split(",\n");
  
          for (let column of columns) {
            column = column.trim();
  
            columnsNew.push(column);
            const foreignKeyRegex = /FOREIGN\s+KEY\s+\("?(.+?)"?\)\s+REFERENCES\s+"?(\w+)"?\s*\("?(.+?)"?\)/i;
            const columnMatch = column.match(foreignKeyRegex);
  
            if (columnMatch) {
              const columnNames = columnMatch[1]
                .split(",") 
                .map((name) => name.trim());
              const referencedTable = columnMatch[2];
              const referencedColumns = columnMatch[3]
                .split(",")
                .map((name) => name.trim());
  
              for (let i = 0; i < columnNames.length; i++) {
                data.links.push({
                  source: tableName,
                  target: referencedTable,
                  label: columnNames[i] + " -> " + referencedColumns[i],
                });
              }
            }
          }
  
          let columnsNewDone = [];
  
          columnsNew.forEach((c, index) => {
            
            const match = c.match(/\b(\w+)\b/);
  
            if (match && match.length > 1) {
              if (
                !match[1].toLowerCase().includes("primary") &&
                !match[1].toLowerCase().includes("key") &&
                !match[1].toLowerCase().includes("constraint") &&
                !match[1].toLowerCase().includes("unique")
              ) {
                const matchType = c.match(/\b(\w+\(\w+)\b/) || c.match(/\b(\w+)\b/);

                columnsNewDone.push({
                    id: match[1],
                    label: match[1],
                    child: true,
                    parent: tableName,
                    type: matchType[1].trim().split("(")[0],	
                    length: matchType[1].trim().split("(")[1] ? matchType[1].trim().split("(")[1].split(")")[0] : undefined
                });

              }
            }
          });
  
          data.nodes.push({
            id: tableName,
            label: tableName,
            columns: columnsNewDone,
          });
        }
      });
    }

    return data;
}


autoUpdater.on('checking-for-update', () => {
    log.debug("Checking for update...");
});

autoUpdater.on('update-not-available', () => {
    log.debug("Update not available");
});

autoUpdater.on('download-progress', (p) => {
    log.debug("Download progress\n" + p.percent + "%");
});
  
autoUpdater.on('update-available', () => {
    log.debug("Update available");
    // const options = {
    //     type: "info",
    //     buttons: ["Ok"],
    //     title: "New update available",
    //     message: "A new update is available, it will be downloaded in the background PLS DON'T CLOSE THE APPLICATION."
    // }
    // dialog.showMessageBox(mainWindow, options)
    // autoUpdater.downloadUpdate();
});

autoUpdater.on('update-downloaded', () => {
    log.debug("Update downloaded");
    const options = {
        type: "info",
        buttons: ["Ok"],
        title: "Update Avaible!",
        message: "A new update has been found and downloaded and will be installed when you close the application."
    }
    dialog.showMessageBox(mainWindow, options);
});
