import * as vscode from 'vscode';
import { exec, ChildProcess } from 'child_process';
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
            this.logging_socket = io(this.logging_url); //{
            //     path: "/socket.io",
            //     transports: ["websocket"],
            //     reconnection: true,
            //     withCredentials: true,
            // });
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
            // args.forEach((arg, index) => {
            //     this.logger.orcaLog(`Argument ${index}: ${JSON.stringify(arg, null, 2)}`);
            // });

        });

        socket.on('disconnect', () => {
            vscode.window.showWarningMessage('Disconnected from Orca logs.');
            this.logger.extensionLog('Socket.IO disconnected');
            this.logging_socket = null;
        });

        // socket.onAny((event, ...args) => {
        //     vscode.window.showInformationMessage('Message Received');
        //     this.logger.extensionLog(`Received event: ${event}, with args: ${JSON.stringify(args)}`);
        // });

        socket.on('connect_error', (error) => {
            this.logger.extensionLog(`Socket.IO connection error: ${error}`);
            vscode.window.showErrorMessage('Error connecting to Orca logs');
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
        
        // TODO: fix paths
        const pythonPath = `C:\\Users\\miike\\source\\repos\\orca\\orca-core\\.venv\\Scripts\\python`;
        const scriptPath = `C:\\Users\\miike\\source\\repos\\orca\\orca-core\\src\\orca\\cli\\orca_rest_api.py`;
        
        this.logger.extensionLog(`Starting Orca server...`);
        this.orcaProcess = await exec(`${pythonPath} ${scriptPath}`);
    
        this.orcaProcess.stdout?.on("data", (data: string) => {
            this.logger.serverLog(data);
         });
         this.orcaProcess.stderr?.on("data", (data: string) => {
            this.logger.serverLog(data);
        });
        // this.orcaProcess.on("exit", (code, signal) => {
        //     const exitMessage = `Orca server exited with code ${code} and signal ${signal}`;
        //     this.logger.serverLog(exitMessage);
        //     this.logger.extensionLog(exitMessage);
        //     vscode.window.showInformationMessage('Orca server stopped.');
        //     this.orcaProcess = null;
        //  });
        // process.on('exit', () => this.stopOrcaServer());
        // process.on('SIGINT', () => this.stopOrcaServer());
        // process.on('SIGTERM', () => this.stopOrcaServer());
        this.logger.extensionLog(`Orca server started.`);
    }
    stopOrcaServer() {
        if (this.orcaProcess) {
            fetch(`${this.url}/shutdown`).then(response => this.logger.extensionLog(`Orca server shutdown: ${response.status}`));
            this.orcaProcess.kill();
            // this.orcaProcess.stdin?.end();
            this.orcaProcess = null;
            vscode.window.showInformationMessage('Orca server stopped.');
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