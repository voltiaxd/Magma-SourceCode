const {app, BrowserWindow, ipcMain, dialog} = require('electron')
const path = require('path')
const url = require('url')
try { require('electron-reloader')(module);} catch {};
const { Sequelize, Model, DataTypes, QueryTypes } = require('sequelize');

let mainWindow = null;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        autoHideMenuBar: true,
        width: 1200,
        height: 800,
        // icon: __dirname + '/assets/favicon/favicon-96x96.png',
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

    mainWindow.on("ready-to-show", () => {
        mainWindow.webContents.openDevTools();
    });

}

app.whenReady().then(async ()=>{
    if (mainWindow === null){
        createWindow();
    }

    ipcMain.on('test', async (event, arg) => {
        console.log('test');
        
        // const sequelize = new Sequelize('sqlite::memory:');
        // const sequelize = new Sequelize('postgres://user:pass@example.com:5432/dbname')
        // const sequelize = new Sequelize({
        //     dialect: 'sqlite',
        //     storage: 'database.sqlite'
        // });
        
        const sequelize = new Sequelize('test', 'postgres', '123', {
            host: 'localhost',
            dialect: 'postgres'
        });

        try {
            await sequelize.authenticate();
            console.log('Connection has been established successfully.');
        } catch (error) {
            console.error('Unable to connect to the database:', error);
        }    

        const users = await sequelize.query("show create table users", { type: QueryTypes.SELECT });

        console.log(users);

    });

});