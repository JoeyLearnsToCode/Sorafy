import React, { useState, useRef, useEffect } from 'react';
import { Session, AppSettings, Language, Theme } from '../types';
import { PlusIcon, MessageSquareIcon, SunIcon, MoonIcon, MoreHorizontalIcon, SparklesIcon, ChevronLeftIcon } from './icons';
import { translations } from '../constants';

interface HistorySidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id:string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onAutoRenameSession: (id: string) => Promise<void>;
  settings: AppSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  sessions,
  currentSessionId,
  isOpen,
  setIsOpen,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onAutoRenameSession,
  settings,
  onUpdateSettings
}) => {
  const t = (key: keyof typeof translations.en) => translations[settings.language][key] || key;
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<'up' | 'down'>('down');
  const [autoRenamingId, setAutoRenamingId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  useEffect(() => {
    renameInputRef.current?.focus();
    renameInputRef.current?.select();
  }, [renamingId]);

  const handleThemeChange = (theme: Theme) => {
    onUpdateSettings(s => ({ ...s, theme }));
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateSettings(s => ({ ...s, language: e.target.value as Language }));
  };

  const handleDebugModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSettings(s => ({ ...s, debugMode: e.target.checked }));
  };
  
  const startRename = (session: Session) => {
    setRenamingId(session.id);
    setRenameValue(session.title);
    setMenuId(null);
  };
  
  const submitRename = () => {
    if (renamingId && renameValue.trim()) {
      onRenameSession(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submitRename();
    if (e.key === 'Escape') setRenamingId(null);
  };
  
  const handleAutoRename = async (sessionId: string) => {
      setMenuId(null);
      setAutoRenamingId(sessionId);
      await onAutoRenameSession(sessionId);
      setAutoRenamingId(null);
  }

  const handleMenuToggle = (e: React.MouseEvent, sessionId: string) => {
    if (menuId === sessionId) {
        setMenuId(null);
        return;
    }

    const button = e.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const menuHeight = 110; // Estimated height of the menu in pixels

    // If there isn't enough space below the button for the menu, and there is enough space above
    if (window.innerHeight - rect.bottom < menuHeight && rect.top > menuHeight) {
        setMenuPosition('up');
    } else {
        setMenuPosition('down');
    }
    setMenuId(sessionId);
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />
      <div className={`
        fixed top-0 left-0 h-full z-30
        bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark
        transition-transform duration-300 ease-in-out 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0 md:transition-all overflow-hidden
        ${isOpen ? 'md:w-64' : 'md:w-0'}
      `}>
        <div className={`w-64 h-full flex flex-col p-2 overflow-hidden`}>
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-lg font-semibold px-2 truncate">{t('app.title')}</h1>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" title={t('sidebar.collapse_sidebar')}>
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <button
              onClick={onNewSession}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-4 text-sm font-medium rounded-md border border-primary-light dark:border-primary-dark text-primary-light dark:text-primary-dark hover:bg-primary-light/10 dark:hover:bg-primary-dark/10 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              {t('sidebar.new_creation')}
            </button>
            <h2 className="text-xs font-semibold uppercase text-text-secondary-light dark:text-text-secondary-dark px-2 mb-2">{t('sidebar.history')}</h2>
            <nav className="flex flex-col gap-1">
              {sessions.sort((a,b) => b.createdAt - a.createdAt).map(session => (
                <div key={session.id} className={`group flex items-center rounded-md text-sm transition-colors ${currentSessionId === session.id ? 'bg-primary-light/20 dark:bg-primary-dark/20' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                  <button
                    onClick={() => onSelectSession(session.id)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left px-2 py-1.5"
                    disabled={renamingId === session.id}
                  >
                    <MessageSquareIcon className="w-4 h-4 flex-shrink-0" />
                    {renamingId === session.id ? (
                        <input 
                          ref={renameInputRef}
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={submitRename}
                          onKeyDown={handleRenameKeyDown}
                          className="bg-transparent focus:bg-white dark:focus:bg-black w-full outline-none ring-1 ring-primary-light rounded-sm px-1 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className="truncate flex-1">{session.title}</span>
                    )}
                  </button>
                  {renamingId !== session.id && (
                    <div className="relative">
                      <button onClick={(e) => handleMenuToggle(e, session.id)} className="p-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 mr-1" disabled={!!autoRenamingId}>
                        <MoreHorizontalIcon className="w-4 h-4" />
                      </button>
                      {menuId === session.id && (
                        <div ref={menuRef} className={`absolute z-10 right-0 w-36 bg-bkg-light dark:bg-bkg-dark border border-gray-300 dark:border-gray-600 rounded-md shadow-lg text-sm ${menuPosition === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                          <button onClick={() => startRename(session)} className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700">{t('chat.edit_button')}</button>
                          <button onClick={() => handleAutoRename(session.id)} disabled={autoRenamingId === session.id} className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
                            <SparklesIcon className="w-4 h-4"/>
                            {autoRenamingId === session.id ? t('sidebar.autorenaming') : t('sidebar.autorename')}
                          </button>
                          <button onClick={() => { onDeleteSession(session.id); setMenuId(null); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500">{t('chat.delete_button')}</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-2">
            {/* Language */}
            <div className="px-2 py-1 flex items-center justify-between text-sm">
              <label htmlFor="language-select">{t('sidebar.settings.language')}</label>
              <select id="language-select" value={settings.language} onChange={handleLanguageChange} className="bg-transparent rounded-md border border-gray-300 dark:border-gray-600 p-1 text-xs">
                <option value="en">English</option>
                <option value="zh">中文</option>
              </select>
            </div>
            {/* Theme */}
            <div className="px-2 py-1 flex items-center justify-between text-sm">
              <label>{t('sidebar.settings.theme')}</label>
              <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-md p-0.5">
                <button onClick={() => handleThemeChange('light')} className={`p-1 rounded ${settings.theme === 'light' ? 'bg-primary-light/20 dark:bg-primary-dark/20' : ''}`}><SunIcon className="w-4 h-4" /></button>
                <button onClick={() => handleThemeChange('dark')} className={`p-1 rounded ${settings.theme === 'dark' ? 'bg-primary-light/20 dark:bg-primary-dark/20' : ''}`}><MoonIcon className="w-4 h-4" /></button>
              </div>
            </div>
            {/* Debug Mode */}
            <div className="px-2 py-1 flex items-center justify-between text-sm">
              <label htmlFor="debug-toggle">{t('sidebar.settings.debug_mode')}</label>
              <input type="checkbox" id="debug-toggle" checked={settings.debugMode} onChange={handleDebugModeChange} className="toggle-checkbox" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HistorySidebar;