import React from 'react';

import { HashRouter as Router } from 'react-router-dom';

import { NavigationProvider } from './contexts/navigation';
import { useScreenSizeClass } from './utils/media-query';
import { Content } from './Content';

import 'devexpress-gantt/dist/dx-gantt.css';
import './styles.scss';
import './theme/theme';
import { useThemeContext, ThemeContext } from './theme/theme';

export const App = () => {
  const screenSizeClass = useScreenSizeClass();
  const themeContext = useThemeContext();

  return (
    <Router>
      <ThemeContext.Provider value={themeContext}>
        <NavigationProvider>
          <div className={`app ${screenSizeClass}`}>
            <Content />
          </div>
        </NavigationProvider>
      </ThemeContext.Provider>
    </Router>
  );
};
