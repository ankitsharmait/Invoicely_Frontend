import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';   // only here
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
    
  </BrowserRouter>
);

