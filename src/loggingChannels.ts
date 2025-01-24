import * as vscode from 'vscode';

export class LoggingChannels {
    private orcaOutputChannel = vscode.window.createOutputChannel("Orca Logs");
    private orcaServerOutputChannel = vscode.window.createOutputChannel("Orca Server Logs");
    private orcaLogListeners: ((message: any) => void)[] = [];
    private extensionOutputChannel = vscode.window.createOutputChannel("Orca Extension Logs");
    constructor() {
        this.orcaOutputChannel.show();
        this.orcaServerOutputChannel.show();
        this.extensionOutputChannel.show();
    }

    serverLog(message: string) {
        this.orcaServerOutputChannel.appendLine(message);
    }
    onOrcaLog(listener: (message: any) => void) {
        this.orcaLogListeners.push(listener);
    }
    orcaLog(message: string) {
        this.orcaOutputChannel.appendLine(message);
        this.orcaLogListeners.forEach(listener => listener(message));
    }
    extensionLog(message: string) {
        this.extensionOutputChannel.appendLine(message);
    }
    showOrcaLogs(){
        this.orcaOutputChannel.show();
    }
    showOrcaServerLogs(){
        this.orcaServerOutputChannel.show();
    }
    showExtensionLogs(){
        this.extensionOutputChannel.show();
    }
}