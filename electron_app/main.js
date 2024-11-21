// const { app, BrowserWindow } = require('electron');
// const path = require('path');
// const log = require('electron-log');
// const fs = require('fs');
// const os = require('os');
// const { spawn } = require('child_process');

// let mainWindow;
// let shinyPort;

// function createWindow() {
//   mainWindow = new BrowserWindow({
//     width: 1024,
//     height: 768,
//     icon: path.join(__dirname, 'icon.ico'),
//     webPreferences: {
//       nodeIntegration: false,
//       contextIsolation: true,
//       enableRemoteModule: false,
//       webSecurity: true,
//     },
//   });

//   // Open DevTools
//   mainWindow.webContents.openDevTools();

//   // Add event listeners for crash events
//   mainWindow.webContents.on('crashed', () => {
//     log.error('Renderer process crashed.');
//     console.error('Renderer process crashed.');
//   });

//   mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
//     log.error(`Failed to load URL: ${errorDescription} (${errorCode})`);
//     console.error(`Failed to load URL: ${errorDescription} (${errorCode})`);
//   });

//   mainWindow.on('unresponsive', () => {
//     log.warn('Window is unresponsive.');
//     console.warn('Window is unresponsive.');
//   });

//   mainWindow.on('closed', () => {
//     log.info('Window was closed.');
//     console.log('Window was closed.');
//   });
// }


// function startShinyApp() {
//   const platform = os.platform();
//   let rBinaryPath;
//   let rScriptPath;

//   // Determine the base path
//   let basePath;
//   log.info(`app.isPackaged: ${app.isPackaged}`);
//   if (app.isPackaged) {
//     basePath = path.join(process.resourcesPath, 'app.asar.unpacked');
//     log.info(`Base path (packaged): ${basePath}`);
//   } else {
//     basePath = __dirname;
//     log.info(`Base path (development): ${basePath}`);
//   }

//   // Set the Rscript binary path
//   if (app.isPackaged) {
//     if (platform === 'win32') {
//       rBinaryPath = path.join(basePath, 'R', 'bin', 'Rscript.exe');
//     } else if (platform === 'darwin') {
//       rBinaryPath = path.join(basePath, 'R', 'R.framework', 'Resources', 'bin', 'Rscript');
//     } else if (platform === 'linux') {
//       rBinaryPath = path.join(basePath, 'R', 'bin', 'Rscript');
//     } else {
//       log.error(`Unsupported platform: ${platform}`);
//       app.quit();
//       return;
//     }
//   } else {
//     // In development mode, use system Rscript
//     rBinaryPath = 'Rscript';
//   }

//   // Set the path to the R script
//   rScriptPath = path.join(basePath, 'launch_app.R');

//   // Check if Rscript exists (only when packaged)
//   if (app.isPackaged && !fs.existsSync(rBinaryPath)) {
//     log.error(`Rscript not found at ${rBinaryPath}`);
//     app.quit();
//     return;
//   }

//   if (!fs.existsSync(rScriptPath)) {
//     log.error(`launch_app.R not found at ${rScriptPath}`);
//     app.quit();
//     return;
//   }

//   // Start the Shiny app
//   log.info(`Starting Shiny app with command: ${rBinaryPath} ${rScriptPath}`);

//   const shinyProcess = spawn(rBinaryPath, [rScriptPath]);

//   // Log stdout and stderr in real-time
//   shinyProcess.stdout.on('data', (data) => {
//     const message = data.toString();
//     log.info(`Shiny stdout: ${message}`);
  
//     // Extract port number
//     const portMatch = message.match(/Selected port: (\d+)/);
//     if (portMatch) {
//       shinyPort = portMatch[1];
//       log.info(`Detected Shiny app port: ${shinyPort}`);
//     }
  
//     // Detect when Shiny app is ready
//     const listeningMatch = message.match(/Listening on http:\/\/127\.0\.0\.1:(\d+)/);
//     if (listeningMatch && shinyPort) {
//       log.info(`Shiny app is ready at port ${shinyPort}`);
  
//       // Load the Shiny app in Electron window
//       if (mainWindow) {
//         mainWindow.loadURL(`http://127.0.0.1:${shinyPort}/`);
//       }
//     }
//   });
  

//   shinyProcess.stderr.on('data', (data) => {
//     log.error(`Shiny stderr: ${data}`);
//   });

//   shinyProcess.on('close', (code) => {
//     log.info(`Shiny process exited with code ${code}`);
//     app.quit();
//   });

//   shinyProcess.on('error', (err) => {
//     log.error(`Failed to start Shiny process: ${err}`);
//     app.quit();
//   });
// }

// app.whenReady().then(() => {
//   createWindow();
//   startShinyApp();

//   app.on('activate', function () {
//     if (BrowserWindow.getAllWindows().length === 0) createWindow();
//   });
// });

// app.on('window-all-closed', () => {
//   // On macOS, it's common for applications to stay open until the user explicitly quits
//   if (process.platform !== 'darwin') {
//     app.quit();
//   }
// });


const log = require('electron-log');
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const axios = require('axios'); // Ensure axios is installed: npm install axios
const os = require('os');

let shinyProcess;
let mainWindow;
let shinyPort;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    icon: path.join(__dirname, 'icon.icns'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
    },
  });

  mainWindow.loadURL(`http://localhost:${shinyPort}/`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function waitForShinyServer(port, retries = 20, delay = 500) {
  return new Promise((resolve, reject) => {
    const attempt = (currentRetry) => {
      axios.get(`http://localhost:${port}/`)
        .then(() => resolve())
        .catch((err) => {
          if (currentRetry <= 0) {
            reject(new Error('Shiny server did not start in time.'));
          } else {
            setTimeout(() => attempt(currentRetry - 1), delay);
          }
        });
    };
    attempt(retries);
  });
}

function handleShinyOutput(data) {
  const output = data.toString().trim();
  log.info(`Shiny output: ${output}`);

  // Look for the "Selected port" message
  const portMatch = output.match(/Selected port: (\d+)/);
  if (portMatch) {
    shinyPort = portMatch[1];
    log.info(`Selected port: ${shinyPort}`);
  }

  // Look for the "Listening on" message
  const listeningMatch = output.match(/Listening on (http:\/\/127\.0\.0\.1:\d+)/);
  if (listeningMatch) {
    log.info(`Shiny app is fully running on port ${shinyPort}`);
    
    // Wait for the Shiny server to be ready before creating the window
    waitForShinyServer(shinyPort)
      .then(() => {
        log.info(`Shiny server is up on port ${shinyPort}. Creating window.`);
        createWindow();
      })
      .catch((err) => {
        log.error(err.message);
        app.quit();
      });
  }
}

function startShinyApp() {
  const platform = os.platform();
  let rBinaryPath;
  let rScriptPath;

  // Determine the base path
  let basePath;
  log.info(`app.isPackaged: ${app.isPackaged}`);
  if (app.isPackaged) {
    basePath = path.join(process.resourcesPath, 'app.asar.unpacked');
    log.info(`Base path (packaged): ${basePath}`);
  } else {
    basePath = __dirname;
    log.info(`Base path (development): ${basePath}`);
  }

  // Set the Rscript binary path
  if (app.isPackaged) {
    if (platform === 'win32') {
      rBinaryPath = path.join(basePath, 'R', 'bin', 'Rscript.exe');
    } else if (platform === 'darwin') {
      rBinaryPath = path.join(basePath, 'R', 'R.framework', 'Resources', 'bin', 'Rscript');
    } else if (platform === 'linux') {
      rBinaryPath = path.join(basePath, 'R', 'bin', 'Rscript');
    } else {
      log.error(`Unsupported platform: ${platform}`);
      app.quit();
      return;
    }
  } else {
    // In development mode, use system Rscript
    rBinaryPath = 'Rscript';
  }

  // Set the path to the R script
  rScriptPath = path.join(basePath, 'launch_app.R');

  // Check if Rscript exists (only when packaged)
  if (app.isPackaged && !fs.existsSync(rBinaryPath)) {
    log.error(`Rscript not found at ${rBinaryPath}`);
    app.quit();
    return;
  }

  if (!fs.existsSync(rScriptPath)) {
    log.error(`launch_app.R not found at ${rScriptPath}`);
    app.quit();
    return;
  }

  // Start the Shiny app
  log.info(`Starting Shiny app with command: "${rBinaryPath}" "${rScriptPath}"`);

  shinyProcess = spawn(rBinaryPath, [rScriptPath]);

  // Listen to stdout
  shinyProcess.stdout.on('data', (data) => {
    handleShinyOutput(data);
  });

  // Listen to stderr
  shinyProcess.stderr.on('data', (data) => {
    handleShinyOutput(data);
  });

  shinyProcess.on('close', (code) => {
    log.info(`Shiny process exited with code ${code}`);
    // If the Shiny app closes, quit the Electron app
    app.quit();
  });
}

app.whenReady().then(() => {
  log.info('Electron app is ready.');
  startShinyApp();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0 && shinyPort) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Terminate the Shiny process when all windows are closed
  if (shinyProcess) {
    shinyProcess.kill();
    shinyProcess = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
