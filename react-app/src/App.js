import logo from './logo.svg';
import './App.css';
import React, { useEffect, useRef } from 'react';
import { dia, shapes } from 'jointjs';

function App() {
  const graphContainerRef = useRef(null);

  useEffect(() => {
    const graph = new dia.Graph();
    const paper = new dia.Paper({
      el: graphContainerRef.current,
      model: graph,
      width: 600,
      height: 400,
      gridSize: 10,
    });

    const rect = new shapes.standard.Rectangle();

    rect.position(100, 30);
    rect.resize(100, 40);
    rect.attr({
      body: {
        rx:15,
        ry:15,
        fill: 'black',
        stroke: 'white',
        strokeWidth: 2
      },
      label: {
        text: 'Hello JointJS',
        fill: 'white',
      },
    });

    const rect2 = rect.clone();
    rect2.translate(0, 100);
    rect2.attr({
      label: {
        text: 'Hello again!',
      },
      body: {
        stroke: 'blue'
      }
    });
    
    paper.on('element:pointerdblclick', function(elementView, evt, x, y) {

      // Change the fill color to yellow if it's blue, or to blue if it's yellow
      if (elementView.model.attr("body/stroke") === 'blue') {
        elementView.model.attr('body/stroke', 'yellow');
      } else {
        elementView.model.attr('body/stroke', 'blue');
      }
    });

    graph.addCell(rect);
    graph.addCell(rect2);


    var link = new shapes.standard.Link();
    link.source(rect);
    link.target(rect2);
    link.attr({
      line: {
        stroke: 'white',
        strokeWidth: 2,
      },
    });
    link.addTo(graph);

  }, []);

  return (
    <div className="App">
      <header className="App-header">
      <div ref={graphContainerRef} style={{ width: '600px', height: '400px' }}></div>
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>

    </div>
  );
}

export default App;
