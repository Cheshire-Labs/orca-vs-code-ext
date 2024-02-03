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

	const indexPath = path.join(context.extensionPath, 'react-app', 'build', 'index.html');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('orca-gui.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from orca-gui in a web extension host!');
	});
	context.subscriptions.push(disposable);
		// Register a view in the "Orca GUI" category
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('orca-gui.Webview', {
			resolveWebviewView(view, ctx: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken) {
				console.log('viewProvider ran');
				// view.webview.html = '<html><body><h1>Hello World</h1></body></html>';
				view.webview.options = {
					// Enable scripts in the webview
					enableScripts: true,
				
					// And restrict the webview to only loading content from our extension's `media` directory.
					localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'react-app', 'build')]
				};
				// Read and display the HTML content at startup
				// const indexPath = path.join(context.extensionPath, 'react-app/public', 'index.html');
		
				const indexUri = vscode.Uri.file(indexPath);
				
				// vscode.workspace.openTextDocument(indexUri).then(document => {
				//  	view.webview.html = document.getText();
				// 	console.log('html', view.webview.html);
				// }, error => {
				//  	console.error('Failed to open index.html:', error);
				// });
				const scriptUri = view.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri,'react-app', 'build', 'static', 'js', 'main.017109ac.js'));
				const cssUri = view.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'react-app', 'build', 'static', 'css', 'main.f855e6bc.css'));
				
				view.webview.html = `
				<!doctype html>
				<html lang="en">
				  <head>
					<!-- ... -->
					<script defer src="${scriptUri}"></script>
					<link href="${cssUri}" rel="stylesheet">
				  </head>
				  <body>
					<div id="root"></div>
				  </body>
				</html>
				`;
				console.log('html', view.webview.html);
				// view.webview.onDidReceiveMessage(message => {
				// 	// Handle messages from the webview if needed
				// });
			}
		}));


  // Register the webview panel
	// const panel = vscode.window.createWebviewPanel(
	// 	'reactWebview', // Identifies the type of the webview. Used internally
	// 	'React Webview', // Title of the panel displayed to the user
	// 	vscode.ViewColumn.One, // Editor column to show the new webview panel in.
	// 	{
	// 		// Enable scripts in the webview
	// 		enableScripts: true,

	// 		// Restrict the webview to only loading content from our extension's `public` directory.
	// 		localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'react-app/public'))]
	// 	}
	// );

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

	// const indexUri = vscode.Uri.file(indexPath);
	// vscode.workspace.openTextDocument(indexUri).then(document => {
		
	// 	panel.webview.html = document.getText();
	// 	console.log('indexPath2', panel.webview.html);
	// });
	
}

// This method is called when your extension is deactivated
export function deactivate() {}
