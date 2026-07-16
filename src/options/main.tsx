import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { ThemeWrapper } from '@/theme/ThemeWrapper';

import { OptionsConfigPage } from './OptionsConfigPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Options root element was not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeWrapper>
      <OptionsConfigPage />
    </ThemeWrapper>
  </StrictMode>,
);
