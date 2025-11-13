import React, { useState, useEffect } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import { Session, AppSettings, InitialSettings } from './types';
import HistorySidebar from './components/HistorySidebar';
import InitialSetup from './components/InitialSetup';
import ChatView from './components/ChatView';
import { translations } from './constants';
import { getNewTitleForSession } from './services/geminiService';
import { MenuIcon } from './components/icons';

const App: React.FC = () => {
  const [sessions, setSessions] = useLocalStorage<Session[]>('sorafy-sessions', []);
  const [currentSessionId, setCurrentSessionId] = useLocalStorage<string | null>('sorafy-current-session-id', null);
  const [settings, setSettings] = useLocalStorage<AppSettings>('sorafy-settings', {
    theme: 'light',
    language: 'en',
    debugMode: false,
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(settings.theme);
    root.lang = settings.language;
  }, [settings.theme, settings.language]);
  
  useEffect(() => {
    if (window.matchMedia('(max-width: 768px)').matches) {
        setIsSidebarOpen(false);
    }
  }, []);

  const createNewSession = (initialSettings: InitialSettings) => {
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
    if (window.matchMedia('(max-width: 768px)').matches) {
        setIsSidebarOpen(false);
    }
  };
  
  const handleNewSession = () => {
    setCurrentSessionId(null);
    if (window.matchMedia('(max-width: 768px)').matches) {
        setIsSidebarOpen(false);
    }
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

  const handleAutoRenameSession = async (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (!session) return;
    try {
        const newTitle = await getNewTitleForSession(session.messages, settings.language);
        handleRenameSession(id, newTitle);
    } catch (error) {
        console.error("Failed to auto-rename session:", error);
    }
  };

  const t = (key: keyof typeof translations.en) => translations[settings.language][key] || key;

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <HistorySidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onAutoRenameSession={handleAutoRenameSession}
        settings={settings}
        onUpdateSettings={setSettings}
      />
      <main className="flex-1 relative">
        {!isSidebarOpen && (
            <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 m-2 rounded-md hover:bg-surface-light dark:hover:bg-surface-dark absolute top-0 left-0 z-10"
                aria-label={t('app.open_menu')}
                title={t('app.open_menu')}
            >
                <MenuIcon className="w-6 h-6 text-text-light dark:text-text-dark" />
            </button>
        )}
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
