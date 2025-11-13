import React, { useState, useEffect, useRef } from 'react';
// FIX: The 'translations' object is exported from 'constants.ts', not 'types.ts'.
import { Message, Language } from '../types';
import { translations } from '../constants';
import { UserIcon, SparklesIcon, CopyIcon, CheckIcon, Edit2Icon, Trash2Icon } from './icons';

interface ChatMessageProps {
  message: Message;
  index: number;
  language: Language;
  onDelete: (messageId: string) => void;
  onEdit: (messageId:string, newContent: string) => void;
}

const InitialSettingsDisplay: React.FC<{ settings: any }> = ({ settings }) => (
    <div className="mt-2 border rounded-md bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark not-prose">
        <div className="p-4">
            <h4 className="font-semibold text-sm mb-3">Initial Prompt Settings</h4>
            <div className="space-y-3">
                <div>
                    <strong className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase">Idea</strong>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{settings.idea}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                        <strong className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase">Language</strong>
                        <p className="mt-1">{settings.promptLanguage}</p>
                    </div>
                    <div>
                        <strong className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase">Orientation</strong>
                        <p className="mt-1">{settings.orientation}</p>
                    </div>
                    <div>
                        <strong className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase">Duration</strong>
                        <p className="mt-1">{settings.duration}s</p>
                    </div>
                </div>
                {settings.images && settings.images.length > 0 && (
                    <div className="mt-2">
                        <strong className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase">Reference Images</strong>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {settings.images.map((img: { dataUrl: string }, i: number) => 
                                <img key={i} src={img.dataUrl} className="w-20 h-20 object-cover rounded-md border" alt={`Reference ${i+1}`} />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
);


const ChatMessage: React.FC<ChatMessageProps> = ({ message, index, language, onDelete, onEdit }) => {
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

  const bgColor = message.role === 'user' ? 'bg-surface-light dark:bg-surface-dark' : 'bg-bkg-light dark:bg-bkg-dark';
  
  return (
    <div className={`p-4 ${bgColor} flex gap-4 group`}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 flex-shrink-0 mt-1">
        {Avatar}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="font-bold capitalize text-text-light dark:text-text-dark">{message.role}</div>
        
        {isEditing ? (
            <div className='mt-1'>
                <textarea
                    ref={textareaRef}
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full bg-surface-light dark:bg-surface-dark border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 focus:outline-none focus:ring-primary-light focus:border-primary-light sm:text-sm resize-none"
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
                    <p className="whitespace-pre-wrap">{otherText}</p>
                    {promptText && (
                        <div className="mt-4 bg-surface-light dark:bg-surface-dark rounded-md">
                            <div className="flex justify-between items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-t-md">
                                <span className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">Sora-2 Prompt</span>
                                <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-primary-light dark:text-primary-dark hover:opacity-80">
                                    {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                                    {copied ? t('chat.copied_message') : t('chat.copy_button')}
                                </button>
                            </div>
                            <pre className="p-4 text-sm whitespace-pre-wrap overflow-x-auto"><code>{promptText}</code></pre>
                        </div>
                    )}
                </>
            ) : initialSettingsData ? (
                <InitialSettingsDisplay settings={initialSettingsData} />
            ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
        )}
      </div>
       {!isEditing && (
            <div className="flex items-start gap-1 transition-opacity">
                <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-text-secondary-light dark:text-text-secondary-dark"><Edit2Icon className="w-4 h-4" /></button>
                <button onClick={() => onDelete(message.id)} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-text-secondary-light dark:text-text-secondary-dark"><Trash2Icon className="w-4 h-4" /></button>
            </div>
        )}
    </div>
  );
};

export default ChatMessage;