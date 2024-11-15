const { app, BrowserWindow } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const log = require('electron-log');
const fs = require('fs');

let shinyProcess;

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    icon: path.join(__dirname, 'icon.icns'), // Ensure the icon path is correct
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Open Developer Tools for debugging
  // win.webContents.openDevTools();

  // Load the Shiny app URL after a short delay to ensure Shiny has started
  setTimeout(() => {
    win.loadURL('http://localhost:1234/');
  }, 1000); // 5-second delay; adjust as needed
}

function startShinyApp() {
  const rBinaryPath = path.join(__dirname, 'R', 'R.framework', 'Resources', 'bin', 'Rscript');
  const rScriptPath = path.join(__dirname, 'launch_app.R');

  // Check if Rscript exists
  if (!fs.existsSync(rBinaryPath)) {
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

  shinyProcess = exec(`"${rBinaryPath}" "${rScriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      log.error(`Error starting Shiny app: ${error.message}`);
      app.quit();
      return;
    }
    if (stderr) {
      log.error(`Shiny app stderr: ${stderr}`);
    }
    log.info(`Shiny app stdout: ${stdout}`);
  });

  // Log stdout and stderr in real-time
  shinyProcess.stdout.on('data', (data) => {
    log.info(`Shiny stdout: ${data}`);
  });

  shinyProcess.stderr.on('data', (data) => {
    log.error(`Shiny stderr: ${data}`);
  });

  shinyProcess.on('close', (code) => {
    log.info(`Shiny process exited with code ${code}`);
    // If the Shiny app closes, quit the Electron app
    app.quit();
  });
}

app.whenReady().then(() => {
  startShinyApp();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // On macOS, it's common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
