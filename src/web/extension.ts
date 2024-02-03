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
				console.log('viewProvider ran');
				// view.webview.html = '<html><body><h1>Hello World</h1></body></html>';
				view.webview.options = {
					// Enable scripts in the webview
					enableScripts: true,
				
					// And restrict the webview to only loading content from our extension's `media` directory.
					localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'react-app', 'build')]
				};
				
				const { scriptUri, styleUri, mediaUri } = await getAssetFileUris(context);

				// const scriptUri = view.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri,'react-app', 'build', 'static', 'js', 'main.017109ac.js'));
				// const cssUri = view.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'react-app', 'build', 'static', 'css', 'main.f855e6bc.css'));
				
				view.webview.html = `
				<!doctype html>
				<html lang="en">
				  <head>
					<!-- ... -->
					<script defer src="${scriptUri}"></script>
					<link href="${styleUri}" rel="stylesheet">
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


}

async function getAssetFileUris(context: vscode.ExtensionContext) {
	// Get the URI of the asset manifest file
	const assetManifestUri = vscode.Uri.joinPath(context.extensionUri, 'react-app', 'build', 'asset-manifest.json');
  
	// Read the asset manifest file
	const assetManifestData = await vscode.workspace.fs.readFile(assetManifestUri);

	const textDecoder = new TextDecoder('utf-8'); // Specify the encoding if it's not utf-8

	// Convert the Uint8Array to a string
	const assetManifestDataString = textDecoder.decode(assetManifestData);
	console.log('assetManifestData', assetManifestDataString);
	const assetManifest = JSON.parse(assetManifestDataString);
  
	// Get the filename of the main JavaScript file
	const mainJsFilename = assetManifest['files']['main.js'].split('/').pop();
  
	// Get the filename of the main CSS file
	const mainCssFilename = assetManifest['files']['main.css'].split('/').pop();
  
	// Get the filename of the main media file (replace 'main-media' with the actual key)
	const mainMediaFilename = assetManifest['files']['main-media'].split('/').pop();
  
	// Get the URI of the main JavaScript file
	const scriptUri = vscode.Uri.joinPath(context.extensionUri, 'react-app', 'build', 'static', 'js', mainJsFilename);
  
	// Get the URI of the main CSS file
	const styleUri = vscode.Uri.joinPath(context.extensionUri, 'react-app', 'build', 'static', 'css', mainCssFilename);
  
	// Get the URI of the main media file
	const mediaUri = vscode.Uri.joinPath(context.extensionUri, 'react-app', 'build', 'static', 'media', mainMediaFilename);
  
	return { scriptUri, styleUri, mediaUri };
  }

// This method is called when your extension is deactivated
export function deactivate() {}
