import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

export function generateYamlTemplate() {
   
    const configTemplate: any = {
        system: {
            name: 'your-assay-name',
            version: '1.0.0', 
            description: 'Brief description of your assay',
        },
        labwares: {
            'labware-name-1': { type: 'Your Plate Type' }, 
            'labware-name-2': { type: 'Your Plate Type' }, 
        },
        resources: {
            'resource-name-1': { type: 'Your Resource Type', com: 'Your COM Port', 'plate-pad': 'Plate Pad name for Resource' },
            'resource-name-2': { type: 'Your Resource Type', ip: 'Your IP Port', 'plate-pad': 'Plate Pad name for Resource' },
            'robot-name-1': { type: 'Your Robot Type', ip: 'Your IP Address', positions: 'Your Positions File (Optional)' },
            'resource-pool-name-1': {
                type: 'pool',
                resources: ['resource-name-1', 'resource-name-2'],
            },
            'networking-device-1': { type: 'Your Networking Type', ip: 'Your IP Address' }
        },
        config: {
            prod: {
                'variable-1': 'prod-value',
                'variable-2': 'prod-value',
            },
            test: {
                'variable-1': 'test-value',
                'variable-2': 'test-value',
            },
        },
        // METHODS Section
        methods: {
            'method-name-1': {
                actions: [
                    {
                        'resource-name-1': {
                            command: 'Your Command',
                            inputs: ['labware-name-1', 'labware-name-2'],
                            'command-option-key-1': 'command-option-value-1',
                        },
                    },
                ],
            },
            'method-name-2': {
                actions: [
                    {
                        'resource-name-2': {
                            command: 'Your Command',
                            inputs: ['labware-name-1', 'labware-name-2'],
                            'command-option-key-1': 'command-option-value-1',
                        },
                    },
                ],
            },
        },
        // WORKFLOWS Section
        workflows: {
            'workflow-name-1': {
                threads: {
                    'thread-name-1': {
                        labware: 'labware-name-1',
                        type: 'start',
                        start: 'Your Starting Resource', 
                        end: 'Your Ending Resource', 
                        steps: [
                            'method-name-1',
                            { method: 'method-name-2', spawn: 'script-name-1'},
                        ],
                    },
                },
            },
        },
        // SCRIPTING Section
        scripting: {
            'base-dir': 'path/to/your/scripts',
            scripts: {
                'script-name-1': { source: 'script-filename:ScriptClassName' }, // Example: "spawn_384_tips.py:Spawn384TipsScript"
                // Add more scripts as needed
            },
        },
    };
    

    // Convert the configuration object to YAML
    const yamlConfig = yaml.dump(configTemplate);

    // Get the path to the VS Code workspace directory
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder open.');
        return;
    }

    const workspaceDir = workspaceFolders[0].uri.fsPath; // Use the first workspace folder
    const filePath = path.join(workspaceDir, 'config-template.yaml');

    // Save the YAML file to the VS Code workspace directory
    fs.writeFileSync(filePath, yamlConfig, 'utf8');

    // Inform the user where the file was saved
    vscode.window.showInformationMessage(`YAML configuration template saved to ${filePath}`);
}
