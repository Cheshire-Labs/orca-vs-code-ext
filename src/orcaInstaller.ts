import { spawnSync, spawn } from "child_process";
import * as path from "path";
import * as vscode from "vscode";
import * as fs from "fs";



class OrcaManager {

    static isOrcaInstalled(pythonPath: string): boolean {
        const checkProcess = spawnSync(pythonPath, ["-c", `"import orca"`], { shell: true });
        if (checkProcess.error) {
            console.error("SpawnSync Error:", checkProcess.error);
        }
        if (checkProcess.stderr) {
            console.error("SpawnSync STDERR:", checkProcess.stderr);
        }
        if (checkProcess.stdout) {
            console.log("SpawnSync STDOUT:", checkProcess.stdout);
        }

        return checkProcess.status === 0;
    }

    static async promptOrcaInstallation(): Promise<boolean> {
        const selection = await vscode.window.showQuickPick(["Yes, install Orca", "No, skip"], {
            placeHolder: "Orca is not installed. Would you like to install it?",
            ignoreFocusOut: true,
        });

        return selection === "Yes, install Orca";
    }

    static async installOrca(pythonPath: string): Promise<boolean> {
        vscode.window.showInformationMessage("Installing Orca via pip...");

        return new Promise((resolve) => {
            const installProcess = spawn(pythonPath, ["-m", "pip", "install", "cheshire-orca"], {
                shell: true,
                stdio: "inherit",
            });

            installProcess.on("exit", (code) => {
                if (code === 0) {
                    vscode.window.showInformationMessage("Orca installed successfully.");
                    resolve(true);
                } else {
                    vscode.window.showErrorMessage("Failed to install Orca. Please install manually using: pip install cheshire-orca");
                    resolve(false);
                }
            });
        });
    }
}

export class OrcaInstaller {
    public pythonPath: string | undefined = vscode.workspace.getConfiguration("python").get<string>("defaultInterpreterPath");
    async ensureOrcaInstalled(): Promise<boolean> {
        if (!this.pythonPath) {
            vscode.window.showErrorMessage('Python interpreter not found. Set the Python interpreter path in VS Code settings.');
            return false;
        }
        if (OrcaManager.isOrcaInstalled(this.pythonPath)) {
            return true;
        }

        const shouldInstall = await OrcaManager.promptOrcaInstallation();
        if (shouldInstall) {
            return await OrcaManager.installOrca(this.pythonPath);
        }

        vscode.window.showErrorMessage("Orca is required but not installed.");
        return false;
    }

    getOrcaExecutable(): string | undefined{
        if(!this.pythonPath) {
            vscode.window.showErrorMessage('Python interpreter not found. Set the Python interpreter path in VS Code settings.');
            return;
        }
        const envDir = path.dirname(path.dirname(this.pythonPath)); // Go up to environment root
        const orcaExecutable = process.platform === "win32"
            ? path.join(envDir, "Scripts", "orca.exe") // Windows path
            : path.join(envDir, "bin", "orca"); // macOS/Linux path

        if (!fs.existsSync(orcaExecutable)) {
            vscode.window.showErrorMessage(`Could not find Orca executable at: ${orcaExecutable}. Ensure Orca is installed.`);
            return;
        }
        return orcaExecutable;
    }

}
