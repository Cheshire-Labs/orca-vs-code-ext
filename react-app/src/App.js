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
        fill: 'blue',
      },
      label: {
        text: 'Hello JointJS',
        fill: 'white',
      },
    });
    graph.addCell(rect);
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
