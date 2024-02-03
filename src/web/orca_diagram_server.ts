import * as vscode from 'vscode';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as joint from 'jointjs';

class Diagram extends React.Component {
  componentDidMount() {
    const graph = new joint.dia.Graph();

    const paper = new joint.dia.Paper({
      el: this.refs.paper,
      model: graph,
      width: 600,
      height: 400,
      gridSize: 10
    });

    const rect = new joint.shapes.standard.Rectangle();
    rect.position(100, 30);
    rect.resize(100, 40);
    rect.attr({
      body: {
        fill: 'blue'
      },
      label: {
        text: 'My Rectangle',
        fill: 'white'
      }
    });

    graph.addCell(rect);
  }

  render() {
    return <div ref="paper"></div>;
  }
}

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('extension.openDiagram', () => {
      const panel = vscode.window.createWebviewPanel(
        'orcaDiagram', // Identifies the type of the webview. Used internally
        'Orca Diagram', // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        {
          // Enable scripts in the webview
          enableScripts: true
        }
      );
  
      ReactDOM.render(<Diagram />, panel.webview.html);
    }));
  }