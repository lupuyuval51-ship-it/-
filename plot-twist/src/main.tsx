import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './fonts.ts';
import './styles/index.css';
import { App } from './ui/App.tsx';
import { prefetchPoster } from './ui/components/Poster.tsx';
import { installSheetHistoryGuard } from './ui/hooks.ts';

// Before the first render: a sheet's history entry left over from before a reload is stepped over.
installSheetHistoryGuard();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

prefetchPoster();
