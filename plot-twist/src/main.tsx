import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './fonts.ts';
import './styles/index.css';
import { App } from './ui/App.tsx';
import { installSheetHistoryGuard } from './ui/hooks.ts';
import { installHistoryIndex } from './ui/router.ts';

// Before the first render, in this order: entries are numbered (so every later popstate listener
// knows Back from Forward), then a sheet's entry left over from before a reload is stepped over.
installHistoryIndex();
installSheetHistoryGuard();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
