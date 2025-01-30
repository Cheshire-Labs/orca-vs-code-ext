import * as vscode from 'vscode';
import { LoggingChannels } from './loggingChannels';
import { OrcaServer } from './orcaServer';
import { OrcaApi } from './orcaApi';
import { WorkflowTreeViewProvider, MethodTreeViewProvider, InstalledDriversTreeViewProvider, WorkflowTreeItem, MethodTreeItem, AvailableDriversTreeViewProvider, DriverTreeItem } from './sideview';
import { copyExamplesToWorkspace } from './copyExamples';
import { get } from 'axios';


let url: string = 'http://127.0.0.1:5000';
let vscodeLogs: LoggingChannels = new LoggingChannels();
let orcaServer = new OrcaServer(url, vscodeLogs);
let orcaApi: OrcaApi = new OrcaApi(url, vscodeLogs);


export function activate(context: vscode.ExtensionContext) { 

    let copyExamplesCommand = vscode.commands.registerCommand('orca-ide.copyExamples', async () => {
        await copyExamplesToWorkspace();
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

        // Get available deployment stages
        const deploymentStages = await orcaApi.getDeploymentStages();
        if (!deploymentStages) {
            vscode.window.showErrorMessage('Failed to get deployment stages.');
            return;
        }
        const deploymentStage: string | undefined = await getDeploymentStage(deploymentStages);
        if (!deploymentStage) {
            vscode.window.showInformationMessage('Deployment stage not selected.');
            return;
        }
            
    
        const workflowId = await orcaApi.runWorkflow(workflowName, deploymentStage);
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

        // Get available deployment stages
        const deploymentStages = await orcaApi.getDeploymentStages();
        if (!deploymentStages) {
            vscode.window.showErrorMessage('Failed to get deployment stages.');
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
    
        // Prompt the user to select deployment stage, start locations, and end locations for labwares
        const deploymentStage: string | undefined = await getDeploymentStage(deploymentStages);
        if (!deploymentStage) {
            vscode.window.showInformationMessage('Deployment stage not selected.');
            return;
        }

        const startMap: Record<string, string> | undefined = await getLocationMap(inputLabwares, locations, 'START');
        const endMap: Record<string, string> | undefined = await getLocationMap(outputLabwares, locations, 'END');
    
        if (!startMap || !endMap) {
            vscode.window.showInformationMessage('Location selection was cancelled.');
            return;
        }
    
        // Run the method
        const methodId = await orcaApi.runMethod(methodName, startMap, endMap, deploymentStage);
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

    async function getDeploymentStage(deploymentStages: string[]): Promise<string | undefined> {
        const deploymentStage = await vscode.window.showQuickPick(deploymentStages, { placeHolder: 'Select the deployment stage' });
        return deploymentStage;
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
    
    // Create tree view providers since we need to refresh them when installing drivers
    const installedDriversProvider = new InstalledDriversTreeViewProvider(orcaServer, orcaApi);
    const availableDriversProvider = new AvailableDriversTreeViewProvider(orcaServer, orcaApi);

    const installDriverCommand = vscode.commands.registerCommand('orca-ide.installDriver', async (item?: DriverTreeItem | string) => {
        const driverName = typeof item === 'string' ? item : item?.label ?? await selectDriverName();
        if (!driverName) {
            vscode.window.showErrorMessage('No driver selected for installation.');
            return;
        }
        vscode.window.showInformationMessage(`Installing driver '${driverName}'...`);
        const result = await orcaApi.installDriver(driverName);
        if (result) {
            vscode.window.showInformationMessage(`Driver '${driverName}' installed successfully.`);
            // Refresh both tree views
            await installedDriversProvider.refreshTree();
            await availableDriversProvider.refreshTree();
        } else {
            vscode.window.showErrorMessage(`Error while installing driver '${driverName}'.`);
        }
    });

    async function selectDriverName(): Promise<string | undefined> {
        const driverNames = await orcaApi.getAvailableDrivers();
        if (!driverNames || driverNames.length === 0) {
            vscode.window.showErrorMessage('No drivers available for installation.');
            return undefined;
        }
    
        return vscode.window.showQuickPick(driverNames, { placeHolder: 'Select the driver to install' });
    }

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
        vscode.window.registerTreeDataProvider("orca-ide.installed-drivers-view", installedDriversProvider);
        vscode.window.registerTreeDataProvider("orca-ide.available-drivers-view", availableDriversProvider);
    }catch (error) {
        vscode.window.showErrorMessage(`Failed to start Orca server: ${error}`);        
    }

	context.subscriptions.push(
        startServerCommand,
        stopServerCommand,
        copyExamplesCommand,
		loadYamlCommand, 
		initializeCommand, 
		runWorkflowCommand, 
		runMethodCommand,
        stopCommand,
        installDriverCommand,
        installDriverFromRepoCommand,
        uninstallDriverCommand);
    
    console.log('Extension "orca-ide" is now active!');
    copyExamplesToWorkspace();

}


export async function deactivate() {
    await orcaServer.stopOrcaServer();    
}



