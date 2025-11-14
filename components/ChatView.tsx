import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Session, Message, Language, AppSettings } from '../types';
import { translations } from '../constants';
import { getStreamingResponse } from '../services/geminiService';
import ChatMessage from './ChatMessage';
import { ArrowUpIcon, PaperclipIcon } from './icons';

interface ChatViewProps {
  session: Session;
  onUpdateSession: (session: Session) => void;
  settings: AppSettings;
}

const ChatView: React.FC<ChatViewProps> = ({ session, onUpdateSession, settings }) => {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sessionRef = useRef(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const t = (key: keyof typeof translations.en) => translations[settings.language][key] || key;
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollTo(0, messagesEndRef.current.scrollHeight);
  };

  useEffect(() => {
    // A small delay to allow the DOM to update before scrolling
    setTimeout(scrollToBottom, 100);
  }, [session.messages, isStreaming]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  }, [input]);

  const generateResponse = useCallback(async (messageHistory: Message[]) => {
    if (!messageHistory || messageHistory.length === 0) return;
    
    setIsStreaming(true);

    try {
      const stream = await getStreamingResponse(messageHistory, settings, sessionRef.current.initialSettings);
      
      const modelMessageId = (Date.now() + 1).toString();
      let modelResponse = '';
      
      const initialModelMessage: Message = {
        id: modelMessageId,
        role: 'model',
        content: '',
        timestamp: Date.now()
      };
      onUpdateSession({ ...sessionRef.current, messages: [...messageHistory, initialModelMessage] });

      for await (const chunk of stream) {
        modelResponse += chunk.text;
        
        const currentMessages = [...sessionRef.current.messages];
        const msgIndex = currentMessages.findIndex(m => m.id === modelMessageId);
        if (msgIndex !== -1) {
            currentMessages[msgIndex] = { ...currentMessages[msgIndex], content: modelResponse };
            onUpdateSession({ ...sessionRef.current, messages: currentMessages });
        }
      }
      
    } catch (error) {
      console.error("Error streaming response:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: 'Sorry, an error occurred while fetching the response.',
        timestamp: Date.now()
      };
      onUpdateSession({ ...sessionRef.current, messages: [...messageHistory, errorMessage] });
    } finally {
      setIsStreaming(false);
    }
  }, [onUpdateSession, settings]);


  const handleSendMessage = useCallback(async () => {
    if (isStreaming || !input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };
    const newMessages = [...session.messages, userMessage];
    onUpdateSession({ ...session, messages: newMessages });
    setInput('');

    await generateResponse(newMessages);
  }, [input, isStreaming, session, onUpdateSession, generateResponse]);

  useEffect(() => {
     if (session.messages.length === 1 && session.messages[0].role === 'user') {
      generateResponse(session.messages);
    }
  // eslint-disable-next-line react-hooks-exhaustive-deps
  }, [session.id]); // Only runs when session ID changes (i.e., new session is created)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !isStreaming) {
        e.preventDefault();
        handleSendMessage();
      }
    };
    const textarea = textareaRef.current;
    textarea?.addEventListener('keydown', handleKeyDown);
    return () => textarea?.removeEventListener('keydown', handleKeyDown);
  }, [handleSendMessage, isStreaming]);

  const handleDeleteMessage = (messageId: string) => {
    const messageIndex = session.messages.findIndex(m => m.id === messageId);
    if (messageIndex > -1) {
      const newMessages = session.messages.slice(0, messageIndex);
      onUpdateSession({ ...session, messages: newMessages });
    }
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    const messageIndex = session.messages.findIndex(m => m.id === messageId);
    if (messageIndex > -1) {
      const newMessages = [...session.messages];
      newMessages[messageIndex].content = newContent;
      const finalMessages = newMessages.slice(0, messageIndex + 1);
      onUpdateSession({...session, messages: finalMessages });
      if (newMessages[messageIndex].role === 'user') {
        generateResponse(finalMessages);
      }
    }
  };

  const handleRegenerate = async () => {
    if (isStreaming) return;
    const lastMessage = session.messages[session.messages.length - 1];
    if (lastMessage?.role === 'model') {
      const historyToResend = session.messages.slice(0, -1);
      onUpdateSession({ ...session, messages: historyToResend });
      await generateResponse(historyToResend);
    }
  };

  const canSendMessage = !isStreaming && !!input.trim();

  return (
    <div className="flex flex-col h-full text-text-primary-light dark:text-text-primary-dark">
      <div className="flex-shrink-0 flex items-center justify-center p-4 border-b border-border-light dark:border-border-dark">
        <h2 className="font-semibold text-lg">Sorafy</h2>
      </div>
      <div ref={messagesEndRef} className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4">
          {session.messages.map((msg, index) => (
            <ChatMessage 
              key={msg.id} 
              message={msg} 
              index={index} 
              language={settings.language} 
              isLastMessage={index === session.messages.length - 1}
              isStreaming={isStreaming && index === session.messages.length - 1}
              onDelete={handleDeleteMessage} 
              onEdit={handleEditMessage}
              onRegenerate={handleRegenerate}
              />
          ))}
           {isStreaming && session.messages[session.messages.length - 1]?.role === 'user' && (
              <div className="flex justify-end p-4">
                  <div className="bg-surface-light dark:bg-surface-dark rounded-xl rounded-br-none p-4 shadow-soft">
                      <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-text-secondary-light rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-text-secondary-light rounded-full animate-pulse [animation-delay:0.2s]"></div>
                          <div className="w-2 h-2 bg-text-secondary-light rounded-full animate-pulse [animation-delay:0.4s]"></div>
                      </div>
                  </div>
              </div>
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-center bg-surface-light dark:bg-surface-secondary-dark rounded-xl shadow-soft border border-border-light dark:border-border-dark p-2">
            <button className="p-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary dark:hover:text-primary-dark">
                <PaperclipIcon className="w-5 h-5" />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t('chat.input.placeholder')}
              rows={1}
              className="flex-1 bg-transparent text-text-primary-light dark:text-text-primary-dark p-2 resize-none focus:outline-none"
              disabled={isStreaming}
            />
            <button
              onClick={handleSendMessage}
              disabled={!canSendMessage}
              className="bg-text-primary-light dark:bg-text-primary-dark text-surface-light dark:text-surface-dark rounded-lg w-9 h-9 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-opacity flex-shrink-0"
            >
                <ArrowUpIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;