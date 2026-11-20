import React from 'react';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppRoutes from './routes/AppRoutes';

// HashRouter allows seamless routing on GitHub Pages static deployment without server rewrites!
const Router = import.meta.env.BASE_URL && import.meta.env.BASE_URL.startsWith('./') ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}
