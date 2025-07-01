
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Main.tsx loaded');

const root = document.getElementById("root");
if (!root) {
  console.error('Root element not found');
  throw new Error('Root element not found');
}

console.log('Creating React root...');
createRoot(root).render(<App />);
console.log('React app rendered');
