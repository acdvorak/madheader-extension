import { useEffect } from 'react';

import _ from 'lodash';

import AppTheme from './components/AppTheme';

/**
 * Theme providers are colocated here so extension UIs share a single MUI
 * theme boundary.
 */
export const ThemeWrapper: React.FC<React.PropsWithChildren> = ({
  children,
}): React.ReactElement => {
  useEffect(() => {
    window._ = _;
  }, []);

  return <AppTheme>{children}</AppTheme>;
};
