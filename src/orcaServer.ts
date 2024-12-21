import * as vscode from 'vscode';
import { ChildProcess, spawn } from 'child_process';
import { io, Socket } from 'socket.io-client';
import { LoggingChannels } from './loggingChannels';
import { json } from 'stream/consumers';


class LoggingSocketHandler {    
    logging_url: string;
    logging_socket: Socket | null = null;
    logger: LoggingChannels;

    constructor(logging_url: string, logger: LoggingChannels) {
        this.logger = logger;
        this.logging_url = logging_url;        
    }
    connect() {
        if (this.logging_socket?.connected) {
           return; 
        }
        if (this.logging_socket === null) {
            this.logging_socket = io(this.logging_url, {
                reconnectionAttempts: 5,
                reconnectionDelay: 2000,  // waits 2 seconds to decrease number of errors
                timeout: 10000
            });
        }
        this.setupLoggingSocket(this.logging_socket);
        this.logging_socket?.connect();        
    }
    disconnect() {
        this.logging_socket?.disconnect();
        this.logging_socket = null;
    }
    isConnected() {
        return this.logging_socket?.connected;
    }
    setupLoggingSocket(socket: Socket) {
        this.logger.extensionLog('Setting up Socket.IO connection...');
        
        
        socket.on('connect', () => {
            this.logger.extensionLog('Connected to Orca logs via Socket.IO');
            vscode.window.showInformationMessage('Connected to Orca logs');
        });

        socket.on('logMessage', (...args) => {
            vscode.window.showInformationMessage('Message Received');
            this.logger.extensionLog('Message Received');
            const message = args[0];
            this.logger.orcaLog(message["data"]);

        });

        socket.on('disconnect', () => {
            vscode.window.showWarningMessage('Disconnected from Orca logs.');
            this.logger.extensionLog('Socket.IO disconnected');
            this.logging_socket = null;
        });

        socket.on('connect_error', (error) => {
            if (!error.message.includes('xhr poll error')) {
                this.logger.extensionLog(`Socket.IO connect error: ${error.message}`);

            }
            vscode.window.showWarningMessage('Connecting to Orca logs...');
        });

        this.logger.extensionLog('Socket.IO setup complete');
    }
}


class OrcaServerHandler {

   private url: string;
   private logger: LoggingChannels;
   private orcaProcess: ChildProcess | null = null;
   
   constructor(url: string = 'http://127.0.0.1:5000', logger: LoggingChannels) {
    this.url = url;   
    this.logger = logger;
   }
 
    async startOrcaServer(): Promise<void> {
        if (this.orcaProcess) {
            return;
        }
        if (await this.isConnectable()) {
            return;
        }
        
        const config = vscode.workspace.getConfiguration('orca');
        const orcaCommand = process.env.ORCA_PATH || "orca";

        this.logger.extensionLog(`Starting Orca server...`);
        this.logger.extensionLog(`Orca command: ${orcaCommand}`);

        
        try {
            this.orcaProcess = spawn(`${orcaCommand}`, ["server"], {
                shell: true,
            });
            
            this.orcaProcess.stdout?.on("data", (data: string) => {
                this.logger.serverLog(data);
            });
            this.orcaProcess.stderr?.on("data", (data: string) => {
                this.logger.serverLog(data);
            });
            
            this.orcaProcess.on("error", (error) => {
                this.logger.serverLog(`Failed to start Orca server: ${error.message}`);
                vscode.window.showErrorMessage(`Failed to start Orca server: ${error.message}`);
                this.orcaProcess = null;
            });
    
            this.logger.extensionLog(`Orca server started.`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.serverLog(`Failed to start Orca server: ${errorMessage}`);
            vscode.window.showErrorMessage(`Failed to start Orca server: ${errorMessage}`);
            this.orcaProcess = null;
            throw error;
        }
    }
    async stopOrcaServer() {
        if (this.orcaProcess) {
            try {
                const response = await fetch(`${this.url}/shutdown`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                this.logger.extensionLog(`Orca server shutdown: ${response.status}`);

                if (!response.ok) {
                    this.logger.extensionLog(`HTTP error, status: ${response.status}`);
                }
 
                this.orcaProcess = null;
            vscode.window.showInformationMessage('Orca server stopped.');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.logger.extensionLog(`Failed to stop Orca server: ${errorMessage}`);
                vscode.window.showErrorMessage(`Failed to stop Orca server`);
            }
        } else {
            vscode.window.showWarningMessage('Orca server is not running.');
        }
    }

    async isConnectable() {
        return fetch(`${this.url}/test`).then(response => response.status === 200).catch(() => false);
    }
    
    waitforhost(interval: number = 1000, attempts: number = 10): Promise<void> {
      
        const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
        
        let count = 1;
      
        return new Promise(async (resolve, reject) => {
            while (count < attempts) {
        
                await sleep(interval);
            
                try {
                    if (await this.isConnectable()){
                        resolve();
                        break;
                    }
                    else {
                        count++;
                    }
                } catch {
                    count++;
                    console.log(`Still down, trying ${count} of ${attempts}`);
                }
            }
      
            reject(new Error(`Server is down: ${count} attempts tried`));
        });
    }
}

export class OrcaServer{
    loggingSocketHandler: LoggingSocketHandler;
    orcaServerHandler: OrcaServerHandler;
    constructor(url: string = 'http://127.0.0.1:5000', vscodeLogs: LoggingChannels, logging_url: string | null = null) {
        if (logging_url === null) {
            logging_url = `${url}/logging`;
        }
        this.loggingSocketHandler = new LoggingSocketHandler(logging_url, vscodeLogs);
        this.orcaServerHandler = new OrcaServerHandler(url, vscodeLogs);
    }
    async isConnectable() {
        return await this.orcaServerHandler.isConnectable() && this.loggingSocketHandler.isConnected();
    }
    async startOrcaServer() {
        await this.orcaServerHandler.startOrcaServer();
        this.orcaServerHandler.waitforhost();
        await this.loggingSocketHandler.connect();
    }
    stopOrcaServer() {
        this.loggingSocketHandler.disconnect();
        this.orcaServerHandler.stopOrcaServer();
    }
}