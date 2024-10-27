import * as vscode from 'vscode';
import { generateYamlTemplate } from './generateYamlTemplate';
import axios, { get } from 'axios'; 
import { exec, ChildProcess } from 'child_process';




const orcaProcessName = 'orca-server';
let orcaProcess: ChildProcess | null = null;
let url: string = 'http://127.0.0.1:5000';

const orcaOutputChannel = vscode.window.createOutputChannel("Orca Logs");
const extensionOutputChannel = vscode.window.createOutputChannel("Extension Logs");

async function startOrcaServer() {
    
    // TODO: fix paths
    const pythonPath = `C:\\Users\\miike\\source\\repos\\orca\\orca-core\\.venv\\Scripts\\python`;
    const scriptPath = `C:\\Users\\miike\\source\\repos\\orca\\orca-core\\src\\orca\\cli\\orca_rest_api.py`;
    

    
     
    orcaProcess = exec(`${pythonPath} ${scriptPath}`);

    orcaProcess.stdout?.on("data", (data: string) => {
        
        
        // TODO: this is taking output regarding the flask server, not output regarding the orca workflow




        orcaOutputChannel.appendLine(data);  // Send stdout data to Orca Logs
     });
 
    // orcaProcess.stderr?.on("data", (data: string) => {
    //     orcaOutputChannel.appendLine(`Error: ${data}`);  // Send stderr data to Orca Logs
    //     vscode.window.showErrorMessage(`Orca server error: ${data}`);
    // });
 
    orcaProcess.on("exit", (code, signal) => {
        const exitMessage = `Orca server exited with code ${code} and signal ${signal}`;
        orcaOutputChannel.appendLine(exitMessage);
        extensionOutputChannel.appendLine(exitMessage);
        vscode.window.showInformationMessage('Orca server stopped.');
        orcaProcess = null;
     });
    process.on('exit', () => stopOrcaServer());
    process.on('SIGINT', () => stopOrcaServer());
    process.on('SIGTERM', () => stopOrcaServer());
 
    vscode.window.showInformationMessage('Orca server started.');
    orcaOutputChannel.show();  // Optionally show the Orca output channel when the server starts
}

function stopOrcaServer() {
    if (orcaProcess) {
        orcaProcess.stdin?.end();
        orcaProcess.kill('SIGTERM');  // Send a terminate signal to stop the process
        orcaProcess = null;
        vscode.window.showInformationMessage('Orca server stopped.');
    } else {
        vscode.window.showWarningMessage('Orca server is not running.');
    }
}


export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "orca-ide" is now active!');


    	// Command to generate a YAML template
	let generateYamlCommand = vscode.commands.registerCommand('orca-ide.generateYamlTemplate', async () => {
		await generateYamlTemplate();
	});

    async function loadOrcaConfig(configFilePath: string) {
        vscode.window.showInformationMessage(`Loading YAML file: ${configFilePath}`);
        try {
			await axios.post(url + '/load', {
				config_file: configFilePath
			});
			vscode.window.showInformationMessage(`Orca loaded: ${configFilePath}`);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to load Orca: ${error}`);
		}
    }

    async function getWorkflowNames(): Promise<string[] | undefined> {
        try{
            const response = await axios.get(url + '/get_workflow_recipes');
            return response.data["workflow_recipes"];
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to get workflow names: ${error}`);
            return undefined;
        }
    }


    async function getMethodNames(): Promise<string[] | undefined> {
        try{
            const response = await axios.get(url + '/get_method_recipes');
            return response.data["method_recipes"];
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to get method names: ${error}`);
            return undefined;
        }
    }

    async function getMethodRecipeInputLabwares(methodName: string): Promise<string[] | undefined> {
        try{
            const response = await axios.get(`${url}/get_method_recipe_input_labwares`,{
                params: {
                    method_name: methodName
                }});
            return response.data["input_labwares"];
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to get input labwares for method recipe ${methodName}: ${error}`);
            return undefined;
        }
    }

    async function getMethodRecipeOutputLabwares(methodName: string): Promise<string[] | undefined> {
        try{
            const response = await axios.get(`${url}/get_method_recipe_output_labwares`, {
            params: {
                method_name: methodName
            }});
            return response.data["output_labwares"];
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to get output labwares for method recipe ${methodName}: ${error}`);
            return undefined;
        }
    }

    async function getLabwareNames(): Promise<string[] | undefined> {
        try{
            const response = await axios.get(url + '/get_labware_recipes');
            return response.data["labware_recipes"];
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to get labware names: ${error}`);
            return undefined;
        }
    }

    async function getLocationNames(): Promise<string[] | undefined> {
        try{
            const response = await axios.get(url + '/get_locations');
            return response.data["locations"];
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to get location names: ${error}`);
            return undefined;
        }
    }



	// Command to load a YAML file in Orca and initialize
	let loadYamlCommand = vscode.commands.registerCommand('orca-ide.loadYaml', async () => {
        const filePath = "C:\\Users\\miike\\source\\repos\\orca\\orca-core\\examples\\smc_assay\\smc_assay_example.orca.yml";
        await startOrcaServer();
    
        // const filePath = await vscode.window.showInputBox({ placeHolder: 'Enter the path to the YAML file' });
        if (filePath) {
            try {
                
                await loadOrcaConfig(filePath);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to initialize Orca: ${error}`);
            }
        }
    });

    // Command to initialize resources
    let initializeCommand = vscode.commands.registerCommand('orca-ide.initialize', async () => {
        try {
			await axios.post(url + '/init');
			vscode.window.showInformationMessage('All resources initialized successfully!');
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to initialize resources: ${error}`);
		}
    });

    // Command to run a workflow
    let runWorkflowCommand = vscode.commands.registerCommand('orca-ide.runWorkflow', async () => {
        const workflowNames = await getWorkflowNames();
        if (!workflowNames) {
            vscode.window.showErrorMessage('No workflow recipes found.');
            return;
        }
        const workflowName = await vscode.window.showQuickPick(workflowNames, {placeHolder: 'Select the workflow to run'});
        try{
            const workflowId =  await axios.post(url + '/run_workflow',
                {
                    workflow_name: workflowName
                }
            );
            vscode.window.showInformationMessage(`Workflow ${workflowName} started with ID: ${workflowId}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to run workflow: ${error}`);
        }
    });

    // Command to run a method
    let runMethodCommand = vscode.commands.registerCommand('orca-ide.runMethod', async () => {
        const methodNames = await getMethodNames();
        if (!methodNames) {
            vscode.window.showErrorMessage('No method recipes found.');
            return;
        }
        const methodName = await vscode.window.showQuickPick(methodNames, {placeHolder: 'Select the method to run'});
        if (!methodName) {
            vscode.window.showInformationMessage(`Method not selected.`);
            return;
        }
        const inputLabwares = await getMethodRecipeInputLabwares(methodName);
        if (!inputLabwares) {
            vscode.window.showErrorMessage('Failed to get input labwares.');
            return;
        }
        const outputLabwares = await getMethodRecipeOutputLabwares(methodName);
        if (!outputLabwares) {
            vscode.window.showErrorMessage('Failed to get output labwares.');
            return;
        }
        const locations = await getLocationNames();
        if (!locations) {
            vscode.window.showErrorMessage('Failed to get locations.');
            return;
        }
        let startMap: Record<string, string> = {};
        let endMap: Record<string, string> = {};
            
        for (const labware of inputLabwares) {
            let startLocation = await vscode.window.showQuickPick(locations, { placeHolder: `Select the START location for ${labware}` });
            if (!startLocation) {
                vscode.window.showInformationMessage(`Start location not selected.`);
                return;
            }
            startMap[labware] = startLocation;
        }
        
        for (const labware of outputLabwares) {
            let endLocation = await vscode.window.showQuickPick(locations, { placeHolder: `Select the END location for ${labware}` });
            if (!endLocation) {
                vscode.window.showInformationMessage(`End location not selected.`);
                return;
            }
            endMap[labware] = endLocation;
        }
        
        try{
            
            const methodId =  await axios.post(url + '/run_method',
                {
                    method_name: methodName,
                    start_map: JSON.stringify(startMap),
					end_map: JSON.stringify(endMap)
                }
            );
            vscode.window.showInformationMessage(`Method ${methodName} started with ID: ${methodId}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to run method: ${error}`);
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
export function deactivate() {

    if (orcaProcess) {
        orcaProcess.stdin?.end();
        orcaProcess.kill('SIGTERM');
        orcaProcess = null;
    }
}
