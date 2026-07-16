import React from 'react';
import type { CssVarsThemeOptions } from '@mui/material';
import { CssBaseline } from '@mui/material';
import type { Theme, ThemeOptions } from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { accordionCustomizations } from '../customizations/accordions';
import { buttonCustomizations } from '../customizations/buttons';
import { cardCustomizations } from '../customizations/cards';
import { checkboxCustomizations } from '../customizations/checkboxes';
import { containerCustomizations } from '../customizations/containers';
import { dialogCustomizations } from '../customizations/dialogs';
import { iconCustomizations } from '../customizations/icons';
import { inputCustomizations } from '../customizations/inputs';
import { linkCustomizations } from '../customizations/links';
import { listCustomizations } from '../customizations/lists';
import { selectCustomizations } from '../customizations/selects';
import { tabCustomizations } from '../customizations/tabs';
import { tooltipCustomizations } from '../customizations/tooltips';
import { colorSchemes, shadows, shape, typography } from '../themeConstants';

interface AppThemeProps {
  children: React.ReactNode;
  themeComponents?: ThemeOptions['components'];
}

export default function AppTheme(props: AppThemeProps): React.JSX.Element {
  const { children } = props;

  const theme = React.useMemo<Partial<Theme>>(() => {
    return createTheme({
      // For more details about CSS variables configuration, see
      // https://mui.com/material-ui/customization/css-theme-variables/configuration/
      cssVariables: {
        // 'media'
        // Generate CSS variables using `prefers-color-scheme`.
        //
        // '.mode-%s'
        // Generate CSS variables within a class:
        // `.mode-light`, `.mode-dark`.
        //
        // '[data-mode-%s]'
        // Generate CSS variables within a data attribute:
        // `[data-mode-light]`, `[data-mode-dark]`.
        colorSchemeSelector: 'media' satisfies
          'media' | '.mode-%s' | '[data-mode-%s]',
        cssVarPrefix: 'mui',
      },
      // Recently added in v6 for building light & dark mode app, see
      // https://mui.com/material-ui/customization/palette/#color-schemes
      colorSchemes,
      typography: typography as CssVarsThemeOptions['typography'],
      shadows: [...shadows],
      shape,
      components: {
        ...accordionCustomizations,
        ...buttonCustomizations,
        ...cardCustomizations,
        ...checkboxCustomizations,
        ...containerCustomizations,
        ...dialogCustomizations,
        ...iconCustomizations,
        ...inputCustomizations,
        ...linkCustomizations,
        ...listCustomizations,
        ...selectCustomizations,
        ...tabCustomizations,
        ...tooltipCustomizations,
      },
    });
  }, []);

  return (
    <ThemeProvider theme={theme} disableTransitionOnChange>
      <CssBaseline enableColorScheme />

      {children}
    </ThemeProvider>
  );
}
