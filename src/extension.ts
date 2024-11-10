import * as vscode from 'vscode';
import { generateYamlTemplate } from './generateYamlTemplate';
import axios, { get } from 'axios'; 
import { loggingChannels } from './loggingChannels';
import { OrcaServer } from './orcaServer';
import { OrcaApi } from './orcaApi';
import { WorkflowTreeViewProvider, MethodTreeViewProvider, WorkflowTreeItem, MethodTreeItem } from './sideview';


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
    const runWorkflowCommand = vscode.commands.registerCommand('orca-ide.runWorkflow', async (item?: WorkflowTreeItem) => {
        const workflowName = item?.label ?? await selectWorkflowName();
        if (!workflowName) {
            vscode.window.showInformationMessage('Workflow not selected.');
            return;
        }
    
        try {
            const response = await axios.post(`${url}/run_workflow`, { workflow_name: workflowName });
            const workflowId = response.data?.workflowId ?? 'Unknown ID';
    
            vscode.window.showInformationMessage(`Workflow "${workflowName}" started with ID: ${workflowId}`);
        } catch (error: any) {
            const errorMessage = error?.message ?? 'Unknown error';
            vscode.window.showErrorMessage(`Failed to run workflow: ${errorMessage}`);
        }
    });
    


    async function selectWorkflowName(): Promise<string | undefined> {
        const workflowNames = await orcaApi.getWorkflowNames();
        if (!workflowNames || workflowNames.length === 0) {
            vscode.window.showErrorMessage('No workflow recipes found.');
            return undefined;
        }
    
        return vscode.window.showQuickPick(workflowNames, { placeHolder: 'Select the workflow to run' });
    }

    

    const runMethodCommand = vscode.commands.registerCommand('orca-ide.runMethod', async (item?: MethodTreeItem) => {
        // Determine the method name from the TreeItem or prompt the user to select one
        const methodName = item?.label ?? await selectMethodName();
        if (!methodName) {
            vscode.window.showInformationMessage('Method not selected.');
            return;
        }
    
        // Get input labwares, output labwares, and locations
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
    
        // Prompt the user to select start and end locations for labwares
        const startMap: Record<string, string> | undefined = await getLocationMap(inputLabwares, locations, 'START');
        const endMap: Record<string, string> | undefined = await getLocationMap(outputLabwares, locations, 'END');
    
        if (!startMap || !endMap) {
            vscode.window.showInformationMessage('Location selection was cancelled.');
            return;
        }
    
        // Run the method
        try {
            const response = await axios.post(`${url}/run_method`, {
                method_name: methodName,
                start_map: JSON.stringify(startMap),
                end_map: JSON.stringify(endMap),
            });
    
            const methodId = response.data?.methodId ?? 'Unknown ID';
            vscode.window.showInformationMessage(`Method "${methodName}" started with ID: ${methodId}`);
        } catch (error: any) {
            const errorMessage = error?.message ?? 'Unknown error';
            vscode.window.showErrorMessage(`Failed to run method: ${errorMessage}`);
        }
    });
    
    async function selectMethodName(): Promise<string | undefined> {
        const methodNames = await orcaApi.getMethodNames();
        if (!methodNames || methodNames.length === 0) {
            vscode.window.showErrorMessage('No method recipes found.');
            return undefined;
        }
    
        return vscode.window.showQuickPick(methodNames, { placeHolder: 'Select the method to run' });
    }
    async function getLocationMap(labwares: string[], locations: string[], locationType: 'START' | 'END'): Promise<Record<string, string> | undefined> {
        const locationMap: Record<string, string> = {};
    
        for (const labware of labwares) {
            const location = await vscode.window.showQuickPick(locations, { placeHolder: `Select the ${locationType} location for ${labware}` });
            if (!location) {
                return undefined;
            }
            locationMap[labware] = location;
        }
    
        return locationMap;
    }
    

    try{
        vscode.window.registerTreeDataProvider("orca-ide.workflows-view", new WorkflowTreeViewProvider(orcaApi));
        vscode.window.registerTreeDataProvider("orca-ide.methods-view", new MethodTreeViewProvider(orcaApi));
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



