import * as vscode from 'vscode';
import { generateYamlTemplate } from './generateYamlTemplate';
import axios, { get } from 'axios'; 
import { loggingChannels } from './loggingChannels';
import { OrcaServer } from './orcaServer';
import { OrcaApi } from './orcaApi';
import { OrcaSideViewProvider } from './sideview';


let url: string = 'http://127.0.0.1:5000';
let vscodeLogs: loggingChannels = new loggingChannels();
let orcaServer = new OrcaServer(url, vscodeLogs);
let orcaApi: OrcaApi = new OrcaApi(url, vscodeLogs);


export function activate(context: vscode.ExtensionContext) {

    

    	// Command to generate a YAML template
	let generateYamlCommand = vscode.commands.registerCommand('orca-ide.generateYamlTemplate', async () => {
		await generateYamlTemplate();
	});

    let startServerCommand = vscode.commands.registerCommand('orca-ide.startServer', async () => {
        await orcaServer.startOrcaServer();
    });

    let stopServerCommand = vscode.commands.registerCommand('orca-ide.stopServer', async () => {
        await orcaServer.stopOrcaServer();
    });

	// Command to load a YAML file in Orca and initialize
	let loadYamlCommand = vscode.commands.registerCommand('orca-ide.loadYaml', async () => {
        const filePath = "C:\\Users\\miike\\source\\repos\\orca\\orca-core\\examples\\smc_assay\\smc_assay_example.orca.yml";
        await orcaServer.startOrcaServer();
        // await waitforhost(url);
        // const filePath = await vscode.window.showInputBox({ placeHolder: 'Enter the path to the YAML file' });
        if (filePath) {
            await orcaApi.loadOrcaConfig(filePath);
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
        const workflowNames = await orcaApi.getWorkflowNames();
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
        const methodNames = await orcaApi.getMethodNames();
        if (!methodNames) {
            vscode.window.showErrorMessage('No method recipes found.');
            return;
        }
        const methodName = await vscode.window.showQuickPick(methodNames, {placeHolder: 'Select the method to run'});
        if (!methodName) {
            vscode.window.showInformationMessage(`Method not selected.`);
            return;
        }
        const inputLabwares = await orcaApi.getMethodRecipeInputLabwares(methodName);
        if (!inputLabwares) {
            vscode.window.showErrorMessage('Failed to get input labwares.');
            return;
        }
        const outputLabwares = await orcaApi.getMethodRecipeOutputLabwares(methodName);
        if (!outputLabwares) {
            vscode.window.showErrorMessage('Failed to get output labwares.');
            return;
        }
        const locations = await orcaApi.getLocationNames();
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

    try{
        vscode.window.registerTreeDataProvider("orca-ide.workflows-view", new OrcaSideViewProvider(orcaApi));
        vscode.window.registerTreeDataProvider("orca-ide.methods-view", new OrcaSideViewProvider(orcaApi));
    }catch (error) {
        vscode.window.showErrorMessage(`Failed to start Orca server: ${error}`);        
    }

	context.subscriptions.push(
        startServerCommand,
        stopServerCommand,
		generateYamlCommand,
		loadYamlCommand, 
		initializeCommand, 
		runWorkflowCommand, 
		runMethodCommand);
    
    console.log('Extension "orca-ide" is now active!');

}


export function deactivate() {
    orcaServer.stopOrcaServer();    
}



