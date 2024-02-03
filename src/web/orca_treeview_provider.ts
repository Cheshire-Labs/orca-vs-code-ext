
import * as vscode from 'vscode';

export class OrcaTreeDataProvider implements vscode.TreeDataProvider<OrcaTreeItem> {
    private _items: string[] = ['Item 1', 'Item 2', 'Item 3'];
    getTreeItem(element: OrcaTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: OrcaTreeItem | undefined): vscode.ProviderResult<OrcaTreeItem[]> {
        if (!element) {
            // return root elements based on your config file
            return this._items.map(item => new OrcaTreeItem(item, vscode.TreeItemCollapsibleState.None));
        } else {
            // return children of the element
            return [new OrcaTreeItem('Child 1', vscode.TreeItemCollapsibleState.None), new OrcaTreeItem('Child 2', vscode.TreeItemCollapsibleState.None)];
        }
    }
}

export class OrcaTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
    }
}