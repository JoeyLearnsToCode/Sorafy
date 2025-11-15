import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, Language, Orientation, ImageFile } from '../types';
import { translations } from '../constants';
import { UserIcon, GeminiIcon, CopyIcon, CheckIcon, Edit2Icon, Trash2Icon, RefreshCwIcon, UploadIcon } from './icons';

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

const PromptCodeBlock: React.FC<{ promptText: string, t: (key: keyof typeof translations.en) => string; }> = ({ promptText, t }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(promptText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div>
            <div className="flex justify-between items-center px-4 py-2 bg-surface-light dark:bg-surface-dark">
                <span className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">Sora-2 Prompt</span>
                <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs font-medium text-primary dark:text-primary-dark hover:opacity-80">
                    {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                    {copied ? t('chat.copied_message') : t('chat.copy_button')}
                </button>
            </div>
            <pre className="p-4 text-sm whitespace-pre-wrap overflow-x-auto font-mono text-left bg-surface-secondary-light dark:bg-surface-secondary-dark"><code>{promptText}</code></pre>
        </div>
    );
};

const InitialSettingsEditor: React.FC<{
  initialData: any;
  onSave: (newData: any) => void;
  onCancel: () => void;
  language: Language;
}> = ({ initialData, onSave, onCancel, language }) => {
  const [promptLanguage, setPromptLanguage] = useState(initialData.promptLanguage || 'English');
  const [orientation, setOrientation] = useState<Orientation>(initialData.orientation || 'portrait');
  const [duration, setDuration] = useState(initialData.duration || 10);
  const [referenceImages, setReferenceImages] = useState<ImageFile[]>(
    (initialData.images || []).map((img: any, i: number) => ({ name: `image-${i + 1}`, ...img }))
  );
  const [idea, setIdea] = useState(initialData.idea || '');
  const ideaTextareaRef = useRef<HTMLTextAreaElement>(null);

  const t = (key: keyof typeof translations.en) => translations[language][key] || key;

  const handleFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setReferenceImages(prev => [...prev, { name: file.name, type: file.type, dataUrl: e.target?.result as string }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => e.preventDefault();

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const el = ideaTextareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [idea]);

  const handleSaveClick = () => {
    const saveData = {
        promptLanguage,
        orientation,
        duration,
        idea,
        referenceImages: referenceImages,
        images: referenceImages.map(img => ({ type: img.type, dataUrl: img.dataUrl })),
    };
    onSave(saveData);
  };

  return (
    <div className="p-4 space-y-6 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl my-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="edit-prompt-lang" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">{t('initial.prompt_language.label')}</label>
            <select id="edit-prompt-lang" value={promptLanguage} onChange={(e) => setPromptLanguage(e.target.value)} className="block w-full bg-surface-secondary-light dark:bg-surface-secondary-dark border border-border-light dark:border-border-dark rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary-dark/50 focus:border-primary dark:focus:border-primary-dark sm:text-sm">
              <option>English</option><option>Chinese</option><option>Japanese</option><option>Korean</option>
            </select>
          </div>
          <div>
            <label htmlFor="edit-orientation" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">{t('initial.orientation.label')}</label>
            <select id="edit-orientation" value={orientation} onChange={(e) => setOrientation(e.target.value as Orientation)} className="block w-full bg-surface-secondary-light dark:bg-surface-secondary-dark border border-border-light dark:border-border-dark rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary-dark/50 focus:border-primary dark:focus:border-primary-dark sm:text-sm">
              <option value="portrait">{t('initial.orientation.portrait')}</option>
              <option value="landscape">{t('initial.orientation.landscape')}</option>
            </select>
          </div>
          <div>
            <label htmlFor="edit-duration" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">{t('initial.duration.label')}</label>
            <div className="flex items-center gap-3">
              <input id="edit-duration" type="range" min="4" max="20" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full h-2 bg-surface-secondary-light dark:bg-surface-secondary-dark rounded-lg appearance-none cursor-pointer" />
              <span className="text-sm font-semibold w-8 text-center">{duration}s</span>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">{t('initial.images.label')}</label>
          <label onDragOver={handleDragOver} onDrop={handleDrop} className="mt-1 flex justify-center px-6 py-10 border-2 border-border-light dark:border-border-dark border-dashed rounded-xl cursor-pointer hover:border-primary dark:hover:border-primary-dark transition-colors bg-surface-secondary-light dark:bg-surface-secondary-dark">
            <div className="space-y-1 text-center">
              <UploadIcon className="mx-auto h-10 w-10 text-text-secondary-light dark:text-text-secondary-dark" />
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{t('initial.images.cta')}</p>
              <input id="edit-file-upload" name="edit-file-upload" type="file" multiple accept="image/*" className="sr-only" onChange={handleFileChange} />
            </div>
          </label>
          {referenceImages.length > 0 && (
            <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-4">
            {referenceImages.map((img, i) => (
                <div key={i} className="relative group">
                <img src={img.dataUrl} alt={img.name} className="w-full h-28 object-cover rounded-lg border border-border-light dark:border-border-dark" />
                <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                </div>
            ))}
            </div>
          )}
        </div>
        <div>
          <label htmlFor="edit-idea" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">{t('initial.idea.label')}</label>
          <textarea
            ref={ideaTextareaRef}
            id="edit-idea"
            rows={3}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder={t('initial.idea.placeholder')}
            className="mt-1 block w-full bg-surface-secondary-light dark:bg-surface-secondary-dark border border-border-light dark:border-border-dark rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary-dark/50 focus:border-primary dark:focus:border-primary-dark sm:text-sm resize-y min-h-[80px] max-h-[400px]"
          />
        </div>
        <div className="flex gap-2">
            <button onClick={handleSaveClick} className="px-4 py-2 text-sm bg-primary dark:bg-primary-dark text-white rounded-lg hover:opacity-90">{t('chat.save_button')}</button>
            <button onClick={onCancel} className="px-4 py-2 text-sm bg-border-light dark:bg-border-dark rounded-lg hover:bg-border-light/80 dark:hover:bg-border-dark/80">{t('chat.cancel_button')}</button>
        </div>
    </div>
  );
};


const ChatMessage: React.FC<ChatMessageProps> = ({ message, index, language, isLastMessage, isStreaming, onDelete, onEdit, onRegenerate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [editedSettings, setEditedSettings] = useState<any | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const t = (key: keyof typeof translations.en) => translations[language][key] || key;
  
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

  const handleSaveEdit = () => {
    onEdit(message.id, editedContent);
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  }

  const handleSaveSettingsEdit = (newSettings: any) => {
    onEdit(message.id, JSON.stringify(newSettings, null, 2));
    setIsEditing(false);
  };

  useEffect(() => {
    if (isEditing) {
      if (message.role === 'user' && index === 0) {
        try {
          const parsed = JSON.parse(message.content);
          if (parsed.idea && parsed.orientation && parsed.promptLanguage) {
            setEditedSettings(parsed);
            return;
          }
        } catch (e) { /* fall through */ }
      }
      setEditedSettings(null);
    } else {
      setEditedSettings(null);
    }
  }, [isEditing, message.content, message.role, index]);

  useEffect(() => {
    if (isEditing && !editedSettings && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        textareaRef.current.focus();
    }
  }, [isEditing, editedSettings, editedContent]);
  
  const canRegenerate = message.role === 'model' && isLastMessage && !isStreaming;

  const renderModelContent = () => {
    const content = message.content;
    const codeBlockSplitRegex = /(```text[\s\S]*?```)/;
    const parts = content.split(codeBlockSplitRegex);

    return (
      <>
        {parts.map((part, i) => {
          if (!part || !part.trim()) return null;
          const codeBlockMatchRegex = /```text([\s\S]*?)```/;
          const match = part.match(codeBlockMatchRegex);

          if (match) {
            const promptText = match[1].trim();
            return <PromptCodeBlock key={`prompt-${i}`} promptText={promptText} t={t} />;
          } else {
            return (
              <div key={`text-${i}`} className="prose prose-sm dark:prose-invert max-w-none text-text-primary-light dark:text-text-primary-dark break-words text-left p-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{part}</ReactMarkdown>
              </div>
            );
          }
        })}
      </>
    );
  };
  
  return (
    <div className="px-4 group">
      {isEditing ? (
          editedSettings ? (
            <InitialSettingsEditor
              initialData={editedSettings}
              onSave={handleSaveSettingsEdit}
              onCancel={handleCancelEdit}
              language={language}
            />
          ) : (
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
          )
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
                        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl rounded-tl-none shadow-soft overflow-hidden divide-y divide-border-light dark:divide-border-dark">
                           {renderModelContent()}
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