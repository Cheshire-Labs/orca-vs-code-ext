// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "orca-gui" is now active in the web extension host!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('orca-gui.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from orca-gui in a web extension host!');
	});
	context.subscriptions.push(disposable);
	
	context.subscriptions.push(vscode.commands.registerCommand('orca-gui.Webview', () => {
		const indexPath = path.join(context.extensionPath, 'build', 'index.html');
		console.log('indexPath', indexPath);
		const panel = vscode.window.createWebviewPanel(
			'reactWebview', // Identifies the type of the webview. Used internally
			'React Webview', // Title of the panel displayed to the user
			vscode.ViewColumn.One, // Editor column to show the new webview panel in.
			{
				// Enable scripts in the webview
				enableScripts: true,

				// Restrict the webview to only loading content from our extension's `build` directory.
				localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'build'))]
			}
		);

		// panel.webview.onDidReceiveMessage(message => {
		// 	if (message.command === 'getHtml') {
		// 		const indexPath = path.join(context.extensionPath, 'build', 'index.html');
		// 		const indexUri = vscode.Uri.file(indexPath);
		// 		vscode.workspace.openTextDocument(indexUri).then(document => {
		// 			panel.webview.html = document.getText();
		// 		});
		// 	}
		// });

		// panel.webview.postMessage({ command: 'getHtml' });


		// Read and display the HTML content at startup
		console.log('indexPath', indexPath);
		const indexUri = vscode.Uri.file(indexPath);
		vscode.workspace.openTextDocument(indexUri).then(document => {
			panel.webview.html = document.getText();
		});
	}));
	
}

// This method is called when your extension is deactivated
export function deactivate() {}
