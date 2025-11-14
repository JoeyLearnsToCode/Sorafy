import React, { useState, useRef, useEffect } from 'react';
import { Session, AppSettings, Language, Theme } from '../types';
import { PlusIcon, MessageSquareIcon, SunIcon, MoonIcon, MoreHorizontalIcon, GeminiIcon, ChevronLeftIcon, UploadIcon, DownloadIcon } from './icons';
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
  onExportAll: () => void;
  onExportSession: (id: string) => void;
  onImportSessions: (sessions: Session[]) => void;
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
  onUpdateSettings,
  onExportAll,
  onExportSession,
  onImportSessions,
}) => {
  const t = (key: keyof typeof translations.en) => translations[settings.language][key] || key;
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [autoRenamingId, setAutoRenamingId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      try {
        await onAutoRenameSession(sessionId);
      } catch (error) {
        console.error("Auto rename failed in sidebar", error);
      } finally {
        setAutoRenamingId(null);
      }
  }

  const handleMenuToggle = (e: React.MouseEvent, sessionId: string) => {
    if (menuId === sessionId) {
        setMenuId(null);
        return;
    }

    const button = e.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const menuHeight = 160; // Estimated height of the menu in pixels
    const menuWidth = 192; // w-48 from tailwind config (12rem = 192px)

    const style: React.CSSProperties = { zIndex: 50 };

    // Position horizontally: right-aligned with the button.
    style.left = `${rect.right - menuWidth}px`;

    // Position vertically: below or above the button.
    if (window.innerHeight - rect.bottom < menuHeight && rect.top > menuHeight) {
        // Not enough space below, show above
        style.top = `${rect.top - menuHeight}px`;
    } else {
        // Show below
        style.top = `${rect.bottom}px`;
    }

    setMenuStyle(style);
    setMenuId(sessionId);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const result = event.target?.result as string;
            const parsed = JSON.parse(result);
            
            if (typeof parsed !== 'object' || parsed === null || !Array.isArray(parsed.dialogHistory)) {
                throw new Error("Invalid file format: 'dialogHistory' array not found.");
            }
            const sessionsToImport: Session[] = parsed.dialogHistory;
            
            const isValid = sessionsToImport.every(s => 
                s.id && s.title && s.messages && Array.isArray(s.messages) && s.initialSettings && s.createdAt
            );

            if (isValid) {
                onImportSessions(sessionsToImport);
            } else {
                throw new Error("Invalid session data within the file.");
            }
        } catch (err) {
            console.error("Import failed:", err);
            alert(t('sidebar.import.error'));
        } finally {
            if (e.target) e.target.value = '';
        }
    };
    reader.readAsText(file);
  };
  
  const menuSession = menuId ? sessions.find(s => s.id === menuId) : null;

  return (
    <>
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-black/30 z-20 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />
      <div className={`
        fixed top-0 left-0 h-full z-30
        bg-surface-secondary-light/80 dark:bg-surface-dark/80 backdrop-blur-lg
        text-text-primary-light dark:text-text-primary-dark
        transition-transform duration-300 ease-in-out border-r border-border-light/80 dark:border-border-dark/80
        overflow-hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0 md:transition-all
        ${isOpen ? 'md:w-72' : 'md:w-0'}
      `}>
        <div className={`w-72 h-full flex flex-col p-3 overflow-hidden`}>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-light dark:border-border-dark">
                <h1 className="text-xl font-bold px-2 truncate">Sorafy</h1>
                <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-surface-light dark:hover:bg-surface-dark" title={t('sidebar.collapse_sidebar')}>
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 -mr-2">
                <button
                    onClick={onNewSession}
                    className="w-full flex items-center justify-start gap-2 px-3 py-2.5 mb-4 text-sm font-semibold rounded-lg bg-surface-light dark:bg-surface-dark shadow-sm hover:bg-border-light dark:hover:bg-border-dark transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                    {t('sidebar.new_creation')}
                </button>
                <h2 className="text-xs font-semibold uppercase text-text-secondary-light dark:text-text-secondary-dark px-2 mb-2">{t('sidebar.history')}</h2>
                <nav className="flex flex-col gap-1">
                {sessions.sort((a,b) => b.createdAt - a.createdAt).map(session => (
                    <div key={session.id} className="group flex items-center rounded-lg text-sm transition-colors relative">
                      {currentSessionId === session.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-primary rounded-r-full"></div>}
                      <button
                          onClick={() => onSelectSession(session.id)}
                          className={`flex items-center gap-3 flex-1 min-w-0 text-left px-3 py-2 rounded-lg ${currentSessionId === session.id ? 'bg-primary/10 text-primary dark:text-primary-dark font-semibold' : 'hover:bg-surface-light dark:hover:bg-surface-dark'}`}
                          disabled={renamingId === session.id}
                      >
                          {renamingId === session.id ? (
                              <input 
                              ref={renameInputRef}
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={submitRename}
                              onKeyDown={handleRenameKeyDown}
                              className="bg-surface-light dark:bg-surface-dark w-full outline-none ring-2 ring-primary rounded-md px-1.5 py-0.5 text-sm"
                              onClick={(e) => e.stopPropagation()}
                              />
                          ) : (
                              <span className="truncate flex-1">{session.title}</span>
                          )}
                      </button>
                      {renamingId !== session.id && (
                          <div className="absolute right-1 top-1/2 -translate-y-1/2">
                          <button onClick={(e) => handleMenuToggle(e, session.id)} className="p-2 rounded-md hover:bg-surface-light dark:hover:bg-surface-dark mr-1 opacity-0 group-hover:opacity-100 transition-opacity" disabled={autoRenamingId === session.id}>
                              <MoreHorizontalIcon className="w-4 h-4" />
                          </button>
                          </div>
                      )}
                    </div>
                ))}
                </nav>
            </div>
            <div className="flex-shrink-0 border-t border-border-light dark:border-border-dark pt-3 space-y-2">
                <div className="px-2 flex items-center justify-between text-sm gap-2">
                    <button onClick={handleImportClick} className="flex-1 flex items-center justify-center gap-2 px-2 py-2 text-sm rounded-lg hover:bg-surface-light dark:hover:bg-surface-dark">
                        <UploadIcon className="w-4 h-4" />
                        {t('sidebar.settings.import')}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".json" className="hidden" />
                    <button onClick={onExportAll} className="flex-1 flex items-center justify-center gap-2 px-2 py-2 text-sm rounded-lg hover:bg-surface-light dark:hover:bg-surface-dark">
                        <DownloadIcon className="w-4 h-4" />
                        {t('sidebar.settings.export_all')}
                    </button>
                </div>
                
                <div className="px-2 py-1 flex items-center justify-between text-sm">
                    <label htmlFor="language-select" className="text-text-secondary-light dark:text-text-secondary-dark">{t('sidebar.settings.language')}</label>
                    <select id="language-select" value={settings.language} onChange={handleLanguageChange} className="bg-surface-light dark:bg-surface-dark rounded-md border border-border-light dark:border-border-dark p-1.5 text-sm focus:ring-1 focus:ring-primary dark:focus:ring-primary-dark focus:outline-none">
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                    </select>
                </div>
                
                <div className="px-2 py-1 flex items-center justify-between text-sm">
                    <label className="text-text-secondary-light dark:text-text-secondary-dark">{t('sidebar.settings.theme')}</label>
                    <div className="flex items-center gap-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-1">
                        <button onClick={() => handleThemeChange('light')} className={`p-1.5 rounded-md ${settings.theme === 'light' ? 'bg-primary text-white' : 'hover:bg-bkg-light'}`}><SunIcon className="w-4 h-4" /></button>
                        <button onClick={() => handleThemeChange('dark')} className={`p-1.5 rounded-md ${settings.theme === 'dark' ? 'bg-primary-dark text-white' : 'hover:bg-bkg-dark'}`}><MoonIcon className="w-4 h-4" /></button>
                    </div>
                </div>

                <div className="px-2 py-1 flex items-center justify-between text-sm">
                    <label htmlFor="debug-toggle" className="text-text-secondary-light dark:text-text-secondary-dark">{t('sidebar.settings.debug_mode')}</label>
                    <input type="checkbox" id="debug-toggle" checked={settings.debugMode} onChange={handleDebugModeChange} className="toggle-checkbox" />
                </div>
            </div>
        </div>
      </div>
      {menuId && menuSession && (
        <div ref={menuRef} style={menuStyle} className="fixed w-48 bg-surface-secondary-light dark:bg-surface-secondary-dark border border-border-light dark:border-border-dark rounded-lg shadow-lifted text-sm py-1">
            <button onClick={() => startRename(menuSession)} disabled={autoRenamingId === menuSession.id} className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-border-light dark:hover:bg-border-dark disabled:opacity-50">{t('chat.edit_button')}</button>
            <button onClick={() => handleAutoRename(menuSession.id)} disabled={autoRenamingId === menuSession.id} className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-border-light dark:hover:bg-border-dark disabled:opacity-50">
                <GeminiIcon className="w-4 h-4"/>
                {autoRenamingId === menuSession.id ? t('sidebar.autorenaming') : t('sidebar.autorename')}
            </button>
            <button onClick={() => { onDeleteSession(menuSession.id); setMenuId(null); }} className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-border-light dark:hover:bg-border-dark text-red-500">{t('chat.delete_button')}</button>
            <div className="border-t border-border-light dark:border-border-dark my-1"></div>
            <button onClick={() => { onExportSession(menuSession.id); setMenuId(null); }} className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-border-light dark:hover:bg-border-dark">
                <DownloadIcon className="w-4 h-4" />
                {t('sidebar.export_session')}
            </button>
        </div>
      )}
    </>
  );
};

export default HistorySidebar;