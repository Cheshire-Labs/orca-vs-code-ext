import * as vscode from 'vscode';
import { generateYamlTemplate } from './generateYamlTemplate';
import axios, { get } from 'axios'; 
import { exec, ChildProcess } from 'child_process';
import { io, Socket } from 'socket.io-client';



let url: string = 'http://127.0.0.1:5000';
let logging_url: string = 'http://127.0.0.1:5000/logging';
const orcaProcessName = 'orca-server';
let orcaProcess: ChildProcess | null = null;

let logging_socket: Socket | null = null;

const orcaOutputChannel = vscode.window.createOutputChannel("Orca Logs");
const orcaServerOutputChannel = vscode.window.createOutputChannel("Orca Server Logs");
const extensionOutputChannel = vscode.window.createOutputChannel("Orca Extension Logs");

function setupLoggingSocket() {
    extensionOutputChannel.appendLine('Setting up Socket.IO connection...');
    logging_socket = io(logging_url);
    
    logging_socket.on('connect', () => {
        extensionOutputChannel.appendLine('Connected to Orca server logs via Socket.IO');
        vscode.window.showInformationMessage('Connected to Orca server logs');
    });

    logging_socket.on('log_message', (message) => {
        if (message && message.data) {
            orcaOutputChannel.appendLine(message.data);
        }
    });

    logging_socket.on('disconnect', () => {
        vscode.window.showWarningMessage('Disconnected from Orca server logs.');
        extensionOutputChannel.appendLine('Socket.IO disconnected');
        logging_socket = null;
    });

    logging_socket.on('connect_error', (error) => {
        extensionOutputChannel.appendLine(`Socket.IO connection error: ${error}`);
        vscode.window.showErrorMessage('Error connecting to Orca server logs');
    });
    extensionOutputChannel.appendLine('Socket.IO setup complete');
}



async function startOrcaServer(): Promise<void> {
    if (orcaProcess) {
        return;
    }
    
    // TODO: fix paths
    const pythonPath = `C:\\Users\\miike\\source\\repos\\orca\\orca-core\\.venv\\Scripts\\python`;
    const scriptPath = `C:\\Users\\miike\\source\\repos\\orca\\orca-core\\src\\orca\\cli\\orca_rest_api.py`;
    
    extensionOutputChannel.appendLine(`Starting Orca server...`);
    orcaProcess = await exec(`${pythonPath} ${scriptPath}`);

    orcaProcess.stdout?.on("data", (data: string) => {
        orcaServerOutputChannel.appendLine(data);
     });
    orcaProcess.stderr?.on("data", (data: string) => {
        orcaServerOutputChannel.appendLine(data);
    });
    orcaProcess.on("exit", (code, signal) => {
        const exitMessage = `Orca server exited with code ${code} and signal ${signal}`;
        orcaServerOutputChannel.appendLine(exitMessage);
        extensionOutputChannel.appendLine(exitMessage);
        vscode.window.showInformationMessage('Orca server stopped.');
        orcaProcess = null;
     });
    process.on('exit', () => stopOrcaServer());
    process.on('SIGINT', () => stopOrcaServer());
    process.on('SIGTERM', () => stopOrcaServer());
    extensionOutputChannel.appendLine(`Orca server started.`);
    
    orcaServerOutputChannel.show();

    await waitforhost(url);
   

    
    
    setupLoggingSocket();
    logging_socket?.connect();
    orcaOutputChannel.show();
}

function waitforhost(_url: string , interval: number = 1000, attempts: number = 10): Promise<void> {
  
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    
    let count = 1;
  
    return new Promise(async (resolve, reject) => {
      while (count < attempts) {
  
        await sleep(interval);
  
        try {
          const response = await fetch(`${_url}/test`);
          if (response.ok) {
            if (response.status === 200) {
              resolve();
              break;
            }
          } else {
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

function stopOrcaServer() {
    if (orcaProcess) {
        orcaProcess.stdin?.end();
        orcaProcess.kill('SIGTERM');  // Send a terminate signal to stop the process
        orcaProcess = null;
        vscode.window.showInformationMessage('Orca server stopped.');
    } else {
        vscode.window.showWarningMessage('Orca server is not running.');
    }
    logging_socket?.disconnect();
}


export function activate(context: vscode.ExtensionContext) {


	console.log('Congratulations, your extension "orca-ide" is now active!');


    	// Command to generate a YAML template
	let generateYamlCommand = vscode.commands.registerCommand('orca-ide.generateYamlTemplate', async () => {
		await generateYamlTemplate();
	});

    async function loadOrcaConfig(configFilePath: string) {
        extensionOutputChannel.appendLine(`Loading YAML file: ${configFilePath}`);
        try {
			await axios.post(url + '/load', {
				config_file: configFilePath
			});
            
		} catch (error) {
            extensionOutputChannel.appendLine(`Failed to load Orca: ${error}`);
			vscode.window.showErrorMessage(`Failed to load Orca: ${error}`);
            return;
		}
        vscode.window.showInformationMessage(`Loaded YAML file: ${configFilePath}`);
        extensionOutputChannel.appendLine(`Loaded YAML file: ${configFilePath}`);

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
        // await waitforhost(url);
        // const filePath = await vscode.window.showInputBox({ placeHolder: 'Enter the path to the YAML file' });
        if (filePath) {
            await loadOrcaConfig(filePath);
        }
    });

    // Command to initialize resources
    let initializeCommand = vscode.commands.registerCommand('orca-ide.initialize', async () => {
        try {
			await axios.post(url + '/init');
			vscode.window.showInformationMessage('Resources initialized successfully!');
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
    logging_socket?.disconnect();
    if (orcaProcess) {
        orcaProcess.stdin?.end();
        orcaProcess.kill('SIGTERM');
        orcaProcess = null;
    }
    
}
