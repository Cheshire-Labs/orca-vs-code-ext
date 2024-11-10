import * as vscode from 'vscode';
import { loggingChannels } from './loggingChannels';
import axios from 'axios';

export class OrcaApi {
    private logger: loggingChannels;
    private url: string;
    private _configLoaded: boolean = false;
    private onConfigLoaded = new vscode.EventEmitter<boolean>();
    set configLoaded(value: boolean) {
        this.onConfigLoaded.fire(value);
        this._configLoaded = value;
    }
    constructor(orcaUrl: string, logger: loggingChannels) {
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
                config_file: configFilePath
            });
            
        } catch (error) {
            this.configLoaded = false;
            this.logger.extensionLog(`Failed to load Orca: ${error}`);
            vscode.window.showErrorMessage(`Failed to load Orca: ${error}`);
            return;
        }
        this.configLoaded = true;
        vscode.window.showInformationMessage(`Loaded YAML file: ${configFilePath}`);
        this.logger.extensionLog(`Loaded YAML file: ${configFilePath}`);

    }

    async getWorkflowRecipes(): Promise<Record<string, any> | undefined> {
        try{
            const response = await axios.get(this.url + '/get_workflow_recipes');
            return response.data["workflow_recipes"];
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to get workflows: ${error}`);
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
            return response.data["method_recipes"];
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to get methods: ${error}`);
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
            const response = await axios.get(`${this.url}/get_method_recipe_input_labwares`,{
                params: {
                    method_name: methodName
                }});
            return response.data["input_labwares"];
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to get input labwares for method recipe ${methodName}: ${error}`);
            return undefined;
        }
    }

    async getMethodRecipeOutputLabwares(methodName: string): Promise<string[] | undefined> {
        try{
            const response = await axios.get(`${this.url}/get_method_recipe_output_labwares`, {
            params: {
                method_name: methodName
            }});
            return response.data["output_labwares"];
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to get output labwares for method recipe ${methodName}: ${error}`);
            return undefined;
        }
    }

    async getLabwareNames(): Promise<string[] | undefined> {
        try{
            const response = await axios.get(this.url + '/get_labware_recipes');
            return response.data["labware_recipes"];
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to get labware names: ${error}`);
            return undefined;
        }
    }

    async getLocationNames(): Promise<string[] | undefined> {
        try{
            const response = await axios.get(this.url + '/get_locations');
            return response.data["locations"];
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to get location names: ${error}`);
            return undefined;
        }
    }

    async shutdown(): Promise<string | undefined> {
        try{
            const response = await axios.get(this.url + '/shutdown');
            return response.data["message"];
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to shutdown Orca: ${error}`);
            return undefined;
        }
    }
}