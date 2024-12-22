import * as vscode from 'vscode';
import * as path from 'path';
import * as fsExtra from 'fs-extra';

export function copyExamplesToWorkspace() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder is open.');
        return;
    }

    const workspaceDir = workspaceFolders[0].uri.fsPath; // Use the first workspace folder
    const extensionPath = vscode.extensions.getExtension('cheshire-labs.orca-ide')?.extensionPath;

    if (!extensionPath) {
        vscode.window.showErrorMessage('Failed to locate the extension path.');
        return;
    }

    const sourceDir = path.join(extensionPath, 'examples');
    const destinationDir = path.join(workspaceDir, 'examples');

    // Use fs-extra's copy method with the `overwrite: false` flag
    fsExtra.copy(sourceDir, destinationDir, { overwrite: false }, (err: any) => {
        if (err) {
            vscode.window.showErrorMessage(`Failed to copy examples: ${err.message}`);
        } else {
            vscode.window.showInformationMessage(
                'Example Orca YAML files have been copied to your workspace.'
            );
        }
    });
}
