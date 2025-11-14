import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, Language } from '../types';
import { translations } from '../constants';
import { UserIcon, GeminiIcon, CopyIcon, CheckIcon, Edit2Icon, Trash2Icon, RefreshCwIcon } from './icons';

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

const ImageStack: React.FC<{ images: { dataUrl: string }[] }> = ({ images }) => {
    if (!images || images.length === 0) return null;

    if (images.length === 1) {
        return (
            <div className="mt-4 flex justify-center">
                <img src={images[0].dataUrl} alt="Reference" className="max-w-sm w-full rounded-xl shadow-lifted border border-border-light/50 dark:border-border-dark/50" />
            </div>
        );
    }

    if (images.length === 2) {
        return (
            <div className="relative mt-6 h-56 flex justify-center items-center">
                <img src={images[0].dataUrl} alt="Reference 1" className="absolute w-2/3 max-w-xs h-auto object-cover rounded-xl shadow-lifted border border-border-light/50 dark:border-border-dark/50 transform -rotate-6" />
                <img src={images[1].dataUrl} alt="Reference 2" className="absolute w-2/3 max-w-xs h-auto object-cover rounded-xl shadow-lifted border border-border-light/50 dark:border-border-dark/50 transform rotate-6" />
            </div>
        );
    }

    return (
        <div className="relative mt-8 h-64 flex justify-center items-center" style={{ perspective: '1000px' }}>
            <img src={images[0].dataUrl} alt="Reference 1" className="absolute w-2/3 max-w-xs h-auto object-cover rounded-xl shadow-lifted border border-border-light/50 dark:border-border-dark/50 transform -translate-x-16 -rotate-y-20" style={{ transform: 'translateX(-4rem) rotateY(-20deg)' }} />
            <img src={images[1].dataUrl} alt="Reference 2" className="absolute w-2/3 max-w-xs h-auto object-cover rounded-xl shadow-lifted border border-border-light/50 dark:border-border-dark/50 z-10" />
            <img src={images[2].dataUrl} alt="Reference 3" className="absolute w-2/3 max-w-xs h-auto object-cover rounded-xl shadow-lifted border border-border-light/50 dark:border-border-dark/50 transform translate-x-16 rotate-y-20" style={{ transform: 'translateX(4rem) rotateY(20deg)' }} />
        </div>
    );
};

const InitialSettingsDetails: React.FC<{ data: any; t: (key: keyof typeof translations.en) => string; }> = ({ data, t }) => {
    return (
      <div className="mb-3 p-3 bg-black/5 dark:bg-white/5 rounded-lg border border-black/10 dark:border-white/10 text-text-primary-light dark:text-text-primary-dark">
        <h3 className="font-semibold text-sm mb-2">{t('chat.initial_settings_title')}</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="font-medium text-text-secondary-light dark:text-text-secondary-dark">{t('chat.settings.language')}:</div>
          <div>{data.promptLanguage}</div>
          <div className="font-medium text-text-secondary-light dark:text-text-secondary-dark">{t('chat.settings.orientation')}:</div>
          <div>{t(`initial.orientation.${data.orientation}` as keyof typeof translations.en)}</div>
          <div className="font-medium text-text-secondary-light dark:text-text-secondary-dark">{t('chat.settings.duration')}:</div>
          <div>{data.duration}s</div>
        </div>
      </div>
    );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, index, language, isLastMessage, isStreaming, onDelete, onEdit, onRegenerate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const t = (key: keyof typeof translations.en) => translations[language][key] || key;

  const promptRegex = /```text([\s\S]*?)```/;
  const match = message.content.match(promptRegex);
  const promptText = match ? match[1].trim() : null;
  
  let textBeforePrompt = '';
  let textAfterPrompt = '';

  if (match && match.index !== undefined) {
    textBeforePrompt = message.content.substring(0, match.index).trim();
    textAfterPrompt = message.content.substring(match.index + match[0].length).trim();
  } else {
    textBeforePrompt = message.content.trim();
  }

  let initialSettingsData: any = null;
  if (message.role === 'user' && index === 0) {
      try {
        const parsed = JSON.parse(message.content);
        if (parsed.idea && parsed.orientation && parsed.promptLanguage) {
          initialSettingsData = parsed;
        }
      } catch (e) { 
        // Not a JSON message, will show raw content.
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
  
  const canRegenerate = message.role === 'model' && isLastMessage && !isStreaming;
  
  return (
    <div className="px-4 group">
      {isEditing ? (
          <div className='py-6'>
              <textarea
                  ref={textareaRef}
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-sm p-2 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark sm:text-sm resize-none"
              />
              <div className="flex gap-2 mt-2">
                  <button onClick={handleSaveEdit} className="px-3 py-1 text-xs bg-primary dark:bg-primary-dark text-white rounded-md">{t('chat.save_button')}</button>
                  <button onClick={handleCancelEdit} className="px-3 py-1 text-xs bg-border-light dark:bg-border-dark rounded-md">{t('chat.cancel_button')}</button>
              </div>
          </div>
      ) : (
        <div className={`py-6 flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-slate-100 dark:bg-slate-800'}`}>
                {message.role === 'user' ? <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-300"/> : <GeminiIcon className="w-5 h-5 text-slate-600 dark:text-slate-300"/>}
            </div>

            {/* Message and Actions */}
            <div className="flex flex-col gap-1 w-full max-w-[85%]">
                <div className={`flex flex-col gap-2 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {/* User Bubble */}
                    {message.role === 'user' && (
                        <div className="bg-blue-100/70 dark:bg-sky-900/40 border border-blue-200/80 dark:border-sky-800/60 rounded-2xl rounded-tr-none p-4 shadow-soft">
                             <div className="prose prose-sm dark:prose-invert max-w-none text-text-primary-light dark:text-text-primary-dark break-words">
                                {initialSettingsData ? (
                                    <>
                                        <InitialSettingsDetails data={initialSettingsData} t={t} />
                                        <p>{initialSettingsData.idea}</p>
                                        {initialSettingsData.images && initialSettingsData.images.length > 0 && 
                                          <div className="not-prose my-4 -mx-4"><ImageStack images={initialSettingsData.images} /></div>
                                        }
                                    </>
                                ) : (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                                )}
                            </div>
                        </div>
                    )}

                    {/* AI Bubble */}
                    {message.role === 'model' && (
                        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl rounded-tl-none shadow-soft overflow-hidden">
                            {textBeforePrompt && (
                                <div className="prose prose-sm dark:prose-invert max-w-none text-text-primary-light dark:text-text-primary-dark break-words text-left p-4">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{textBeforePrompt}</ReactMarkdown>
                                </div>
                            )}
                            {promptText && (
                                <div className={`${textBeforePrompt ? 'border-t border-border-light dark:border-border-dark' : ''}`}>
                                    <div className="flex justify-between items-center px-4 py-2 bg-surface-light dark:bg-surface-dark">
                                        <span className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">Sora-2 Prompt</span>
                                        <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs font-medium text-primary dark:text-primary-dark hover:opacity-80">
                                            {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                                            {copied ? t('chat.copied_message') : t('chat.copy_button')}
                                        </button>
                                    </div>
                                    <pre className="p-4 text-sm whitespace-pre-wrap overflow-x-auto font-mono text-left bg-surface-secondary-light dark:bg-surface-secondary-dark"><code>{promptText}</code></pre>
                                </div>
                            )}
                            {textAfterPrompt && (
                                <div className={`prose prose-sm dark:prose-invert max-w-none text-text-primary-light dark:text-text-primary-dark break-words text-left p-4 ${(textBeforePrompt || promptText) ? 'border-t border-border-light dark:border-border-dark' : ''}`}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{textAfterPrompt}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${message.role === 'user' ? 'justify-end' : ''}`}>
                    <div className="flex items-center bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-full shadow-soft">
                        {canRegenerate && (
                            <button onClick={onRegenerate} className="p-2 rounded-full hover:bg-surface-secondary-light dark:hover:bg-surface-secondary-dark text-text-secondary-light dark:text-text-secondary-dark" title={t('chat.regenerate_button')}>
                                <RefreshCwIcon className="w-4 h-4" />
                            </button>
                        )}
                        <button onClick={() => setIsEditing(true)} className="p-2 rounded-full hover:bg-surface-secondary-light dark:hover:bg-surface-secondary-dark text-text-secondary-light dark:text-text-secondary-dark" title={t('chat.edit_button')}><Edit2Icon className="w-4 h-4" /></button>
                        <button onClick={() => onDelete(message.id)} className="p-2 rounded-full hover:bg-surface-secondary-light dark:hover:bg-surface-secondary-dark text-text-secondary-light dark:text-text-secondary-dark" title={t('chat.delete_button')}><Trash2Icon className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;