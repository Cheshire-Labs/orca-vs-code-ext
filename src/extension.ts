// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { generateYamlTemplate } from './generateYamlTemplate';
import { python } from 'pythonia';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "orca-ide" is now active!');

    let orcaCoreInstance: any;

    async function loadOrcaConfig(configFilePath: string) {
        const orcaModule = await python('orca_core');
        const orcaCore = await orcaModule.OrcaCore;
        orcaCoreInstance = await new orcaCore(configFilePath);
    }

	// Command to generate a YAML template
	let generateYamlCommand = vscode.commands.registerCommand('orca-ide.generateYamlTemplate', async () => {
		await generateYamlTemplate();
	});


	  // Command to load a YAML file in Orca and initialize
	  let loadYamlCommand = vscode.commands.registerCommand('orca-ide.loadYaml', async () => {
        const filePath = await vscode.window.showInputBox({ placeHolder: 'Enter the path to the YAML file' });
        if (filePath) {
            try {
                vscode.window.showInformationMessage(`Loading YAML file: ${filePath}`);
                await loadOrcaConfig(filePath);
                vscode.window.showInformationMessage(`Orca loaded: ${filePath}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to initialize Orca: ${error}`);
            }
        }
    });

    // Command to initialize resources
    let initializeCommand = vscode.commands.registerCommand('orca-ide.initialize', async () => {
        if (!orcaCoreInstance) {
            vscode.window.showErrorMessage('Orca Core is not connfigured with a YAML file. Load a YAML file first.');
            return;
        }
        try {
            vscode.window.showInformationMessage('Initializing resources...');
            await orcaCoreInstance.initialize();
            vscode.window.showInformationMessage('All resources initialized successfully!');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to initialize resources: ${error}`);
        }
    });

    // Command to run a workflow
    let runWorkflowCommand = vscode.commands.registerCommand('orca-ide.runWorkflow', async () => {
        const workflowName = await vscode.window.showInputBox({ placeHolder: 'Enter the workflow name' });
        if (workflowName && orcaCoreInstance) {
            try {
                vscode.window.showInformationMessage(`Starting workflow: ${workflowName}`);
                const workflowId = await orcaCoreInstance.run_workflow(workflowName);
                vscode.window.showInformationMessage(`Workflow ${workflowName} started with ID: ${workflowId}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to run workflow: ${error}`);
            }
        }
    });

    // Command to run a method
    let runMethodCommand = vscode.commands.registerCommand('orca-ide.runMethod', async () => {
        const methodName = await vscode.window.showInputBox({ placeHolder: 'Enter the method name' });
        if (methodName && orcaCoreInstance) {
            try {
                // For simplicity, we'll assume start_map and end_map are provided as empty dictionaries.
                const startMap = {};  // Ideally, you would get these from user input or configuration.
                const endMap = {};
                const methodId = await orcaCoreInstance.run_method(methodName, startMap, endMap);
                vscode.window.showInformationMessage(`Method ${methodName} started with ID: ${methodId}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to run method: ${error}`);
            }
        }
    });
	context.subscriptions.push(
		generateYamlCommand,
		loadYamlCommand, 
		initializeCommand, 
		runWorkflowCommand, 
		runMethodCommand);

}

// This method is called when your extension is deactivated
export function deactivate() {}
