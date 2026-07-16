import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { ThemeWrapper } from '@/theme/ThemeWrapper';

import { PopupPresetToggleList } from './PopupPresetToggleList';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Popup root element was not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeWrapper>
      <PopupPresetToggleList />
    </ThemeWrapper>
  </StrictMode>,
);
