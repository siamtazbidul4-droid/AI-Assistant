import React from 'react';
import { AuthProvider } from './store/AuthContext';
import { ThemeProvider } from './store/ThemeContext';
import { ChatPage } from './pages/ChatPage';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatPage />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
