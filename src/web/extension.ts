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
			async resolveWebviewView(view, ctx: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken) {

				view.webview.options = {
					// Enable scripts in the webview
					enableScripts: true,
				
					// And restrict the webview to only loading content from our extension's `media` directory.
					localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'react-app', 'build')]
				};
				
				const htmlContent = await vscode.workspace.fs.readFile(vscode.Uri.file(indexPath));
				const textDecoder = new TextDecoder('utf-8'); // Specify the encoding if it's not utf-8
				view.webview.html = textDecoder.decode(htmlContent);

			}
		}));

}

// This method is called when your extension is deactivated
export function deactivate() {}
