import * as vscode from 'vscode';
import { OrcaApi } from './orcaApi';

export class WorkflowTreeViewProvider implements vscode.TreeDataProvider<WorkflowTreeItem> {
    private orcaApi: OrcaApi;
    private workflows: WorkflowTreeItem[] = [];
    private configLoaded: boolean = false;
    private _onDidChangeTreeData: vscode.EventEmitter<WorkflowTreeItem | undefined | null | void> = new vscode.EventEmitter<WorkflowTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<WorkflowTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(orcaApi: OrcaApi) {
        this.orcaApi = orcaApi;
        this.configLoaded = false;
        this.orcaApi.subscribeOnConfigLoaded(this.onConfigLoaded.bind(this));
    }

    getTreeItem(element: WorkflowTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: WorkflowTreeItem): vscode.ProviderResult<WorkflowTreeItem[]> {
        if (!element) {
            if (!this.configLoaded) { 
                return [new WorkflowTreeItem('Load a configuration file to see workflows')]; 
            }
            return this.workflows;
        }
        return [];
    }

    onConfigLoaded(configLoaded: boolean) {
        this.configLoaded = configLoaded;
        this.refreshTree();
    }

    async refreshTree(): Promise<void> {
        try {
            const isConnected = await this.orcaApi.isConnectable();
            if (isConnected) {
                await this.getWorkflows();
                this._onDidChangeTreeData.fire();
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error refreshing workflows: ${error}`);
        }
    }

    private async getWorkflows(): Promise<void> {
        try {
            this.workflows = [];
            const workflowNames = await this.orcaApi.getWorkflowNames();
            if (Array.isArray(workflowNames)) {
                this.workflows = workflowNames.map(name => new WorkflowTreeItem(name));
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error getting workflows: ${error}`);
        }
    }
}

export class MethodTreeViewProvider implements vscode.TreeDataProvider<MethodTreeItem> {
    private orcaApi: OrcaApi;
    private configLoaded: boolean = false;
    private methods: MethodTreeItem[] = [];
    private _onDidChangeTreeData: vscode.EventEmitter<MethodTreeItem | undefined | null | void> = new vscode.EventEmitter<MethodTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<MethodTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(orcaApi: OrcaApi) {
        this.orcaApi = orcaApi;
        this.configLoaded = false;
        this.orcaApi.subscribeOnConfigLoaded(this.onConfigLoaded.bind(this));
    }

    getTreeItem(element: MethodTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: MethodTreeItem): vscode.ProviderResult<MethodTreeItem[]> {
        if (!element) {
            if (!this.configLoaded) { 
                return [new WorkflowTreeItem('Load a configuration file to see methods')]; 
            }
            return this.methods;
        }
        return [];
    }

    onConfigLoaded(configLoaded: boolean) {
        this.configLoaded = configLoaded;
        this.refreshTree();
    }

    async refreshTree(): Promise<void> {
        try {
            const isConnected = await this.orcaApi.isConnectable();
            if (isConnected) {
                await this.getMethods();
                this._onDidChangeTreeData.fire();
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error refreshing methods: ${error}`);
        }
    }

    private async getMethods(): Promise<void> {
        try {
            this.methods = [];
            const methodNames = await this.orcaApi.getMethodNames();
            if (Array.isArray(methodNames)) {
                this.methods = methodNames.map(name => new MethodTreeItem(name));
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error getting methods: ${error}`);
        }
    }
}

export class WorkflowTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
        public readonly contextValue: string = 'workflow'
    ) {
        super(label, collapsibleState);
    }
}

export class MethodTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly contextValue: string = 'method'
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
    }
}