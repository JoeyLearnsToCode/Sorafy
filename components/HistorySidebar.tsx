import React, { useState, useRef, useEffect } from 'react';
import { Session, AppSettings, Language, Theme } from '../types';
import { PlusIcon, MessageSquareIcon, Trash2Icon, SunIcon, MoonIcon, MoreHorizontalIcon, Edit2Icon } from './icons';
import { translations } from '../constants';

interface HistorySidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id:string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  settings: AppSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  settings,
  onUpdateSettings
}) => {
  const t = (key: keyof typeof translations.en) => translations[settings.language][key] || key;
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);
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

  return (
    <div className="w-64 bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark flex flex-col h-screen p-2">
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
                  <button onClick={() => setMenuId(menuId === session.id ? null : session.id)} className="p-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 mr-1">
                    <MoreHorizontalIcon className="w-4 h-4" />
                  </button>
                  {menuId === session.id && (
                    <div ref={menuRef} className="absolute z-10 right-0 bottom-full mb-1 w-32 bg-bkg-light dark:bg-bkg-dark border border-gray-300 dark:border-gray-600 rounded-md shadow-lg text-sm">
                      <button onClick={() => startRename(session)} className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700">{t('chat.edit_button')}</button>
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
  );
};

export default HistorySidebar;