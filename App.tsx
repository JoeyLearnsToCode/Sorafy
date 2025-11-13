import React, { useState, useEffect } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import { Session, AppSettings, InitialSettings, Message } from './types';
import HistorySidebar from './components/HistorySidebar';
import InitialSetup from './components/InitialSetup';
import ChatView from './components/ChatView';
import { translations } from './constants';

const App: React.FC = () => {
  const [sessions, setSessions] = useLocalStorage<Session[]>('sorafy-sessions', []);
  const [currentSessionId, setCurrentSessionId] = useLocalStorage<string | null>('sorafy-current-session-id', null);
  const [settings, setSettings] = useLocalStorage<AppSettings>('sorafy-settings', {
    theme: 'light',
    language: 'en',
    debugMode: false,
  });

  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(settings.theme);
    root.lang = settings.language;
  }, [settings.theme, settings.language]);

  const createNewSession = (initialSettings: InitialSettings) => {
    const t = (key: keyof typeof translations.en) => translations[settings.language][key] || t;

    const firstUserMessageContent = JSON.stringify({
        ...initialSettings,
        images: initialSettings.referenceImages.map(img => ({ type: img.type, dataUrl: img.dataUrl })) // only send necessary data
    });

    const newSession: Session = {
      id: Date.now().toString(),
      title: initialSettings.idea.substring(0, 30) || "New Creation",
      messages: [{
        id: Date.now().toString(),
        role: 'user',
        content: firstUserMessageContent,
        timestamp: Date.now()
      }],
      initialSettings,
      createdAt: Date.now(),
    };

    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };
  
  const handleUpdateSession = (updatedSession: Session) => {
    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
  };
  
  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
  };
  
  const handleNewSession = () => {
    setCurrentSessionId(null);
  };

  const handleDeleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      const remainingSessions = sessions.filter(s => s.id !== id).sort((a,b) => b.createdAt - a.createdAt);
      setCurrentSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
    }
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <HistorySidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        settings={settings}
        onUpdateSettings={setSettings}
      />
      <main className="flex-1">
        {currentSession ? (
          <ChatView
            session={currentSession}
            onUpdateSession={handleUpdateSession}
            settings={settings}
          />
        ) : (
          <InitialSetup onGenerate={createNewSession} language={settings.language} />
        )}
      </main>
    </div>
  );
};

export default App;