import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function copyExamplesToWorkspace() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder is open.');
        return;
    }

    const workspaceDir = workspaceFolders[0].uri.fsPath; // Use the first workspace folder
    const extensionPath = vscode.extensions.getExtension('orca-ide')?.extensionPath;

    if (!extensionPath) {
        vscode.window.showErrorMessage('Failed to locate the extension path.');
        return;
    }

    const sourceDir = path.join(extensionPath, 'examples');
    const destinationDir = path.join(workspaceDir, 'examples');

    // Use fs.cp for recursive copying
    fs.cp(sourceDir, destinationDir, { recursive: true, force: true }, (err) => {
        if (err) {
            vscode.window.showErrorMessage(`Failed to copy examples: ${err.message}`);
        } else {
            vscode.window.showInformationMessage(
                `Examples have been copied to ${destinationDir}.`
            );
        }
    });
}
