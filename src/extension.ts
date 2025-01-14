import * as vscode from 'vscode';
import { generateYamlTemplate } from './generateYamlTemplate';
import { LoggingChannels } from './loggingChannels';
import { OrcaServer } from './orcaServer';
import { OrcaApi } from './orcaApi';
import { WorkflowTreeViewProvider, MethodTreeViewProvider, WorkflowTreeItem, MethodTreeItem } from './sideview';


let url: string = 'http://127.0.0.1:5000';
let vscodeLogs: LoggingChannels = new LoggingChannels();
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
        await orcaServer.startOrcaServer();
        const dialogUri = await vscode.window.showOpenDialog({ title: 'Enter the path to the YAML file', canSelectFiles: true, canSelectFolders: false, canSelectMany: false, filters: {  'YAML Files': ['orca.yml', 'orca.yaml', 'yml', 'yaml'] }});
        if (dialogUri && dialogUri.length === 1) {
            const filepath = dialogUri[0].fsPath;
            await orcaApi.loadOrcaConfig(filepath);
        }
    });

    // Command to initialize resources
    let initializeCommand = vscode.commands.registerCommand('orca-ide.initialize', async () => {
        const initialized: boolean = await orcaApi.initializeResources();
        if (initialized) {
            vscode.window.showInformationMessage('Finished Running initialization');
        } else {
            vscode.window.showErrorMessage('Failed to initialize resources');
        }
    });

    // Command to run a workflow
    const runWorkflowCommand = vscode.commands.registerCommand('orca-ide.runWorkflow', async (item?: WorkflowTreeItem) => {
        const workflowName = item?.label ?? await selectWorkflowName();
        if (!workflowName) {
            vscode.window.showInformationMessage('Workflow not selected.');
            return;
        }
    
        const workflowId = await orcaApi.runWorkflow(workflowName);
        if (!workflowId) {
            vscode.window.showErrorMessage('Failed to run workflow');
            return;
        }    
        vscode.window.showInformationMessage(`Workflow "${workflowName}" started with ID: ${workflowId}`);
        vscodeLogs.showOrcaLogs();
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
        const methodId = await orcaApi.runMethod(methodName, startMap, endMap);
        if (!methodId) {
            vscode.window.showErrorMessage('Failed to run method');
            return;
        }
        vscode.window.showInformationMessage(`Method "${methodName}" started with ID: ${methodId}`);
        vscodeLogs.showOrcaLogs();
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
    const stopCommand = vscode.commands.registerCommand('orca-ide.stop', async () => {
        const stop_message = await orcaApi.stop();
        if (!stop_message) {
            vscode.window.showErrorMessage('Failed to stop Orca server');
            return;
        }
        vscode.window.showInformationMessage('Orca server stopped successfully!');
    });
    
    const installDriverCommand = vscode.commands.registerCommand('orca-ide.installDriver', async (driverName?: string) => {
        if (!driverName) {
            const availableDrivers = await orcaApi.getAvailableDrivers();
            if (!availableDrivers || availableDrivers.length === 0) {
                vscode.window.showErrorMessage('No drivers available for installation.');
                return;
            }
            driverName = await vscode.window.showQuickPick(availableDrivers, { placeHolder: 'Select the driver to install' });
            if (!driverName) {
                return;
            }
        }
        await orcaApi.installDriver(driverName);
        vscode.window.showInformationMessage(`Driver '${driverName}' installed successfully.`);
    });

    const installDriverFromRepoCommand = vscode.commands.registerCommand('orca-ide.installDriverFromRepo', async () => {
        const driverName = await vscode.window.showInputBox({ placeHolder: 'Enter the name of the driver to install' });
        if (!driverName) {
            return;
        }
        const driverRepoUrl = await vscode.window.showInputBox({ placeHolder: 'Enter the repository URL of the driver' });
        if (!driverRepoUrl) {
            return;
        }
        await orcaApi.installDriver(driverName, driverRepoUrl);
        vscode.window.showInformationMessage(`Driver '${driverName}' installed successfully.`);
    });

    const uninstallDriverCommand = vscode.commands.registerCommand('orca-ide.uninstallDriver', async (driverName?: string) => {
        if (!driverName) {
            const installedDrivers = await orcaApi.getInstalledDrivers();
            if (!installedDrivers || installedDrivers.length === 0) {
                vscode.window.showErrorMessage('No drivers installed.');
                return;
            }
            driverName = await vscode.window.showQuickPick(installedDrivers, { placeHolder: 'Select the driver to uninstall' });
            if (!driverName) {
                return;
            }
        }
        await orcaApi.uninstallDriver(driverName);
        vscode.window.showInformationMessage(`Driver '${driverName}' uninstalled successfully.`);
    });

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
		runMethodCommand,
        stopCommand,
        installDriverCommand,
        installDriverFromRepoCommand,
        uninstallDriverCommand);
    
    console.log('Extension "orca-ide" is now active!');

}


export function deactivate() {
    orcaServer.stopOrcaServer();    
}



