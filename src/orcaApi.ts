import { LoggingChannels } from './loggingChannels';
import axios from 'axios';
import * as vscode from 'vscode';


export class OrcaApi {
    private logger: LoggingChannels;
    private url: string;
    private _configLoaded: boolean = false;
    private onConfigLoaded = new vscode.EventEmitter<boolean>();
    set configLoaded(value: boolean) {
        this.onConfigLoaded.fire(value);
        this._configLoaded = value;
    }
    constructor(orcaUrl: string, logger: LoggingChannels) {
        this.url = orcaUrl;
        this.logger = logger;
    }

    public subscribeOnConfigLoaded(callback: (configLoaded: boolean) => any): vscode.Disposable {
        return this.onConfigLoaded.event(callback);
    }

    async isConnectable(): Promise<boolean> {
        try {
            await axios.get(this.url + '/test');
            return true;
        } catch (error) {
            return false;
        }
    }
    async loadOrcaConfig(configFilePath: string) {
        this.logger.extensionLog(`Loading YAML file: ${configFilePath}`);
        try {
            await axios.post(this.url + '/load', {
                configFile: configFilePath
            });
            
        } catch (error) {
            this.configLoaded = false;
            this.logger.extensionLog(`Failed to load Orca: ${error}`);
            return;
        }
        this.configLoaded = true;
        this.logger.extensionLog(`Loaded YAML file: ${configFilePath}`);

    }

    async initializeResources(): Promise<boolean> {
        try {
            await axios.post(this.url + '/init');
            return true;
        } catch (error) {
            this.logger.extensionLog(`Failed to initialize resources: ${error}`);
            return false;
        }
    }

    async getWorkflowRecipes(): Promise<Record<string, any> | undefined> {
        try{
            const response = await axios.get(this.url + '/get_workflow_recipes');
            return response.data["workflowRecipes"];
        } catch (error) {
            this.logger.extensionLog(`Failed to get workflows: ${error}`);
            return undefined;
        }
    }
    async getWorkflowNames(): Promise<string[] | undefined> {
        return this.getWorkflowRecipes().then((data) => {
            console.log(data);
            if (data) {
                return Object.keys(data);
            }
            return undefined;
        });
    }

    async getMethodRecipes(): Promise<Record<string, any> | undefined> {
        try{
            const response = await axios.get(this.url + '/get_method_recipes');
            return response.data["methodRecipes"];
        } catch (error) {
            this.logger.extensionLog(`Failed to get methods: ${error}`);
            return undefined;
        }
    }
    async getMethodNames(): Promise<string[] | undefined> {
        return this.getMethodRecipes().then((data) => {
            if (data) {
                return Object.keys(data);
            }
            return undefined;
        });
    }

    async getMethodRecipeInputLabwares(methodName: string): Promise<string[] | undefined> {
        try{
            const response = await axios.get(`${this.url}/get_method_recipe_input_labwares/${methodName}`);
            return response.data["inputLabwares"];
        } catch (error) {
            this.logger.extensionLog(`Failed to get input labwares for method recipe ${methodName}: ${error}`);
            return undefined;
        }
    }

    async getMethodRecipeOutputLabwares(methodName: string): Promise<string[] | undefined> {
        try{
            const response = await axios.get(`${this.url}/get_method_recipe_output_labwares/${methodName}`);
            return response.data["outputLabwares"];
        } catch (error) {
            this.logger.extensionLog(`Failed to get output labwares for method recipe ${methodName}: ${error}`);
            return undefined;
        }
    }

    async getLabwareNames(): Promise<string[] | undefined> {
        try{
            const response = await axios.get(this.url + '/get_labware_recipes');
            return response.data["labwareRecipes"];
        } catch (error) {
            this.logger.extensionLog(`Failed to get labware names: ${error}`);
            return undefined;
        }
    }

    async getLocationNames(): Promise<string[] | undefined> {
        try{
            const response = await axios.get(this.url + '/get_locations');
            return response.data["locations"];
        } catch (error) {
            this.logger.extensionLog(`Failed to get location names: ${error}`);
            return undefined;
        }
    }

    async runWorkflow(workflowName: string): Promise<string | undefined> {
        try{
            const response = await axios.post(this.url + '/run_workflow', {
                workflowName: workflowName
            });
            
            return response.data["workflowId"];
        } catch (error) {
            this.logger.extensionLog(`Failed to run workflow: ${error}`);
            return undefined;  
        }
    }

    async runMethod(methodName: string, startMap: Record<string, string>, endMap: Record<string, string>): Promise<string | undefined> {
        try{
            const response = await axios.post(this.url + '/run_method', {
                methodName: methodName,
                startMap: JSON.stringify(startMap),
                endMap: JSON.stringify(endMap),
            });
            this.logger.extensionLog(`${response.data["methodId"]}`);
            return response.data["methodId"];
        } catch (error) {
            this.logger.extensionLog(`Failed to run method: ${error}`);
            return undefined;
        }
    }

    async getAvailableDrivers(): Promise<string[] | undefined> {
        try{
            const response = await axios.get(this.url + '/get_available_drivers_info');
            const driver_infos: Record<string, any> = response.data["availableDriversInfo"];
            console.log(response);
            return Object.keys(driver_infos);
        } catch (error) {
            this.logger.extensionLog(`Failed to get available drivers: ${error}`);
            return undefined;
        }
    }

    async getInstalledDrivers(): Promise<string[] | undefined> {
        try{
            const response = await axios.get(this.url + '/get_installed_drivers_info');
            const driver_infos: Record<string, any> = response.data["installedDriversInfo"];
            return Object.keys(driver_infos);
        } catch (error) {
            this.logger.extensionLog(`Failed to get installed drivers: ${error}`);
            return undefined;
        }
    }

    async installDriver(driverName: string, driverRepoUrl?: string): Promise<string | undefined> {
        try{
            const response = await axios.post(this.url + '/install_driver', {
                driverName: driverName,
                driverRepoUrl: driverRepoUrl
            });
            return response.data["message"];
        } catch (error) {
            this.logger.extensionLog(`Failed to install driver: ${error}`);
            return undefined;
        }
    }

    async uninstallDriver(driverName: string): Promise<string | undefined> {
        try{
            const response = await axios.post(this.url + '/uninstall_driver', {
                driverName: driverName
            });
            return response.data["message"];
        } catch (error) {
            this.logger.extensionLog(`Failed to uninstall driver: ${error}`);
            return undefined;
        }
    }

    async stop(): Promise<string | undefined> {
        try{
            const response = await axios.get(this.url + '/stop');
            return response.data["message"];
        } catch (error) {
            this.logger.extensionLog(`Failed to stop Orca: ${error}`);
            return undefined;
        }
    }

    async shutdown(): Promise<string | undefined> {
        try{
            const response = await axios.get(this.url + '/shutdown');
            return response.data["message"];
        } catch (error) {
            this.logger.extensionLog(`Failed to shutdown Orca: ${error}`);
            return undefined;
        }
    }
}