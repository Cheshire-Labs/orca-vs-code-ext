import * as vscode from 'vscode';
import { OrcaApi } from './orcaApi';

export class OrcaSideViewProvider implements vscode.TreeDataProvider<vscode.TreeItem>{
    private orcaApi: OrcaApi;
    private configLoaded: boolean = false;
    private workflows: WorkflowTreeItem[] = [];
    private methods: MethodTreeItem[] = [];
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
    



    // TODO:  Need to implement this for a new view to hold the methods




    constructor(orcaApi: OrcaApi) {
        this.orcaApi = orcaApi;
        this.orcaApi.subscribeOnConfigLoaded(this.onConfigLoaded.bind(this));
    }
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
        
    }

    getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
        if (!element) {
            return this.workflows;
        } else if (element instanceof WorkflowTreeItem) {
            const workflowName = element.label ? String(element.label) : '';
            return [new MethodTreeItem(workflowName)];
        }
        return [];
    }

    onConfigLoaded(configLoaded: boolean) {
        if (this.configLoaded === configLoaded) {
            return;
        }
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
            vscode.window.showErrorMessage(`Error refreshing tree: ${error}`);
        }
    }

    private async getWorkflows(): Promise<void> {
        try {
            this.workflows = [];
            const workflowNames = await this.orcaApi.getWorkflowNames();
            if (workflowNames && Array.isArray(workflowNames)) {
                this.workflows = workflowNames.map((name: string) => new WorkflowTreeItem(name));
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error refreshing tree: ${error}`);
        }
    }

    private async getMethods(): Promise<void | undefined>  {
        this.methods = [];
        let methodNames = await this.orcaApi.getMethodNames();
        if (methodNames) {
            methodNames.forEach((methodName: string) => {
                this.methods.push(new MethodTreeItem(methodName));
            });
        }
    }
}


class WorkflowTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Expanded,
        public readonly contextValue: string = 'workflow'
    ) {
        super(label, collapsibleState);
    }
}

class MethodTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly contextValue: string = 'method'
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
    }
}