import * as vscode from 'vscode';
import * as path from 'path';
import * as fsExtra from 'fs-extra';

export async function copyExamplesToWorkspace() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder is open.');
        return;
    }

    const workspaceDir = workspaceFolders[0].uri.fsPath; // Use the first workspace folder
    const extensionPath = vscode.extensions.getExtension('cheshirelabs.orca-ide')?.extensionPath;

    if (!extensionPath) {
        vscode.window.showErrorMessage('Failed to locate the extension path.');
        return;
    }

    const sourceDir = path.join(extensionPath, 'examples');
    const destinationDir = path.join(workspaceDir, 'examples');


    try {
        let filesCopied = 0;

        // Copy files and check if they already exist
        await fsExtra.copy(sourceDir, destinationDir, {
            overwrite: false,
            errorOnExist: false,
            filter: (src, dest) => {
                if (fsExtra.existsSync(dest)) {
                    return false; // Skip existing files
                }
                filesCopied++; // Count newly copied files
                return true; // Copy new files
            },
        });

        if (filesCopied > 0) {
            vscode.window.showInformationMessage(
                `Copied ${filesCopied} example Orca configuration files to your workspace. You can find them in the 'examples' folder.`
            );
        }
    } catch (err) {
        vscode.window.showErrorMessage(`Failed to copy examples: ${(err as Error).message}`);
    }
}

