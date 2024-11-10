import * as vscode from 'vscode';

export class loggingChannels {
    private orcaOutputChannel = vscode.window.createOutputChannel("Orca Logs");
    private orcaServerOutputChannel = vscode.window.createOutputChannel("Orca Server Logs");
    private extensionOutputChannel = vscode.window.createOutputChannel("Orca Extension Logs");
    constructor() {
        this.orcaOutputChannel.show();
        this.orcaServerOutputChannel.show();
        this.extensionOutputChannel.show();
    }

    serverLog(message: string) {
        this.orcaServerOutputChannel.appendLine(message);
    }
    orcaLog(message: string) {
        this.orcaOutputChannel.appendLine(message);
    }
    extensionLog(message: string) {
        this.extensionOutputChannel.appendLine(message);
    }
}