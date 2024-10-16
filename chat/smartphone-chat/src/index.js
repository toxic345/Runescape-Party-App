import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import Main from './Main';

const root = ReactDOM.createRoot(document.getElementById('root')); // Create root
root.render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);