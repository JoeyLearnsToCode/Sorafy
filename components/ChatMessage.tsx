import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// FIX: The 'translations' object is exported from 'constants.ts', not 'types.ts'.
import { Message, Language } from '../types';
import { translations } from '../constants';
import { UserIcon, SparklesIcon, CopyIcon, CheckIcon, Edit2Icon, Trash2Icon, RefreshCwIcon } from './icons';

interface ChatMessageProps {
  message: Message;
  index: number;
  language: Language;
  isLastMessage: boolean;
  isStreaming: boolean;
  onDelete: (messageId: string) => void;
  onEdit: (messageId:string, newContent: string) => void;
  onRegenerate: () => void;
}

const InitialSettingsDisplay: React.FC<{ settings: any; t: (key: keyof typeof translations.en) => string }> = ({ settings, t }) => (
    <div className="mt-2 border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark not-prose">
        <div className="p-4">
            <h4 className="font-semibold text-base mb-3">{t('chat.initial_settings_title')}</h4>
            <div className="space-y-4">
                <div>
                    <strong className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">{t('chat.settings.idea')}</strong>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{settings.idea}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                        <strong className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">{t('chat.settings.language')}</strong>
                        <p className="mt-1">{settings.promptLanguage}</p>
                    </div>
                    <div>
                        <strong className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">{t('chat.settings.orientation')}</strong>
                        <p className="mt-1 capitalize">{settings.orientation}</p>
                    </div>
                    <div>
                        <strong className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">{t('chat.settings.duration')}</strong>
                        <p className="mt-1">{settings.duration}s</p>
                    </div>
                </div>
                {settings.images && settings.images.length > 0 && (
                    <div className="mt-2">
                        <strong className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">{t('chat.settings.images')}</strong>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {settings.images.map((img: { dataUrl: string }, i: number) => 
                                <img key={i} src={img.dataUrl} className="w-24 h-24 object-cover rounded-md border border-border-light dark:border-border-dark" alt={`Reference ${i+1}`} />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
);


const ChatMessage: React.FC<ChatMessageProps> = ({ message, index, language, isLastMessage, isStreaming, onDelete, onEdit, onRegenerate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const t = (key: keyof typeof translations.en) => translations[language][key] || key;

  const promptRegex = /```text([\s\S]*?)```/;
  const match = message.content.match(promptRegex);
  const promptText = match ? match[1].trim() : null;
  const otherText = promptText ? message.content.replace(promptRegex, '').trim() : message.content;

  let initialSettingsData: any = null;
  // Only parse the very first message from the user as the initial settings.
  if (message.role === 'user' && index === 0) {
      try {
        const parsed = JSON.parse(message.content);
        // A simple check to see if it's likely our settings object
        if (parsed.idea && parsed.orientation && parsed.promptLanguage) {
          initialSettingsData = parsed;
        }
      } catch (e) { 
        // Not a JSON message or malformed, will fall back to showing raw content.
      }
  }


  const handleCopy = () => {
    if (promptText) {
      navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveEdit = () => {
    onEdit(message.id, editedContent);
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  }

  useEffect(() => {
    if (isEditing && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        textareaRef.current.focus();
    }
  }, [isEditing, editedContent]);

  const Avatar = message.role === 'user'
    ? <UserIcon className="w-6 h-6 text-text-secondary-light dark:text-text-secondary-dark" />
    : <SparklesIcon className="w-6 h-6 text-primary-light dark:text-primary-dark" />;

  const canRegenerate = message.role === 'model' && isLastMessage && !isStreaming;
  
  return (
    <div className={`py-6 px-4 flex gap-4 group border-b border-border-light dark:border-border-dark`}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-light dark:bg-surface-dark flex-shrink-0 mt-1">
        {Avatar}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="font-bold capitalize text-text-light dark:text-text-dark">{message.role}</div>
        
        {isEditing ? (
            <div className='mt-2'>
                <textarea
                    ref={textareaRef}
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full bg-bkg-light dark:bg-bkg-dark border border-border-light dark:border-border-dark rounded-lg shadow-sm p-2 focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark sm:text-sm resize-none"
                />
                <div className="flex gap-2 mt-2">
                    <button onClick={handleSaveEdit} className="px-3 py-1 text-xs bg-primary-light dark:bg-primary-dark text-white rounded-md">{t('chat.save_button')}</button>
                    <button onClick={handleCancelEdit} className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded-md">{t('chat.cancel_button')}</button>
                </div>
            </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none mt-1 text-text-light dark:text-text-dark break-words">
            {message.role === 'model' ? (
                <>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{otherText}</ReactMarkdown>
                    {promptText && (
                        <div className="mt-4 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark">
                            <div className="flex justify-between items-center px-4 py-2 bg-bkg-light dark:bg-gray-800/20 rounded-t-lg border-b border-border-light dark:border-border-dark">
                                <span className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">Sora-2 Prompt</span>
                                <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs font-medium text-primary-light dark:text-primary-dark hover:opacity-80">
                                    {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                                    {copied ? t('chat.copied_message') : t('chat.copy_button')}
                                </button>
                            </div>
                            <pre className="p-4 text-sm whitespace-pre-wrap overflow-x-auto font-mono"><code>{promptText}</code></pre>
                        </div>
                    )}
                </>
            ) : initialSettingsData ? (
                <InitialSettingsDisplay settings={initialSettingsData} t={t} />
            ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            )}
          </div>
        )}
      </div>
       {!isEditing && (
            <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {canRegenerate && (
                    <button onClick={onRegenerate} className="p-2 rounded-lg hover:bg-surface-light dark:hover:bg-surface-dark text-text-secondary-light dark:text-text-secondary-dark" title={t('chat.regenerate_button')}>
                        <RefreshCwIcon className="w-4 h-4" />
                    </button>
                )}
                <button onClick={() => setIsEditing(true)} className="p-2 rounded-lg hover:bg-surface-light dark:hover:bg-surface-dark text-text-secondary-light dark:text-text-secondary-dark"><Edit2Icon className="w-4 h-4" /></button>
                <button onClick={() => onDelete(message.id)} className="p-2 rounded-lg hover:bg-surface-light dark:hover:bg-surface-dark text-text-secondary-light dark:text-text-secondary-dark"><Trash2Icon className="w-4 h-4" /></button>
            </div>
        )}
    </div>
  );
};

export default ChatMessage;