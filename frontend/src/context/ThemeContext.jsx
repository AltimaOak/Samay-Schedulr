import { createContext } from 'react';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Hardcoded to true light mode only per user request
  const isDarkMode = false;
  const toggleTheme = () => {};

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

