import React, { useState, useEffect, useRef, useCallback } from 'react';
// FIX: The 'translations' object is exported from 'constants.ts', not 'types.ts'.
import { Session, Message, Language, AppSettings, InitialSettings } from '../types';
import { translations } from '../constants';
import { getStreamingResponse } from '../services/geminiService';
import ChatMessage from './ChatMessage';

interface ChatViewProps {
  session: Session;
  onUpdateSession: (session: Session) => void;
  settings: AppSettings;
}

const ChatView: React.FC<ChatViewProps> = ({ session, onUpdateSession, settings }) => {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [dotCount, setDotCount] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sessionRef = useRef(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const t = (key: keyof typeof translations.en) => translations[settings.language][key] || key;
  
  useEffect(() => {
    let interval: number | undefined;
    if (isStreaming) {
        interval = window.setInterval(() => {
            setDotCount(prev => (prev % 3) + 1);
        }, 500);
    }
    return () => {
        if (interval) clearInterval(interval);
    };
  }, [isStreaming]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages.length]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    }
  }, [input]);

  const generateResponse = useCallback(async (messageHistory: Message[]) => {
    if (!messageHistory || messageHistory.length === 0) return;
    
    setIsStreaming(true);

    try {
      const stream = await getStreamingResponse(messageHistory, settings, sessionRef.current.initialSettings);
      
      const modelMessageId = (Date.now() + 1).toString();
      let modelResponse = '';
      
      // Add a placeholder for the model's response immediately.
      const initialModelMessage: Message = {
        id: modelMessageId,
        role: 'model',
        content: '...',
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
            scrollToBottom();
        }
      }
      
       if (settings.debugMode) {
        console.log("---GEMINI RESPONSE (COMPLETE)---");
        console.log(modelResponse);
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
    if (isStreaming) return;
    
    let currentMessages = session.messages;
    const lastMessageIsUser = session.messages.length > 0 && session.messages[session.messages.length - 1].role === 'user';

    if (input.trim()) {
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: input,
          timestamp: Date.now(),
        };
        currentMessages = [...session.messages, userMessage];
        onUpdateSession({ ...session, messages: currentMessages });
        setInput('');
    } else if (!lastMessageIsUser) {
        return;
    }

    await generateResponse(currentMessages);
  }, [input, isStreaming, session, onUpdateSession, generateResponse]);

  useEffect(() => {
     if (session.messages.length === 1 && session.messages[0].role === 'user') {
      generateResponse(session.messages);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]); // Only runs when session ID changes (i.e., new session is created)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey && !isStreaming) {
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
      // After editing, trigger a new response
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

  const lastMessageIsUser = session.messages.length > 0 && session.messages[session.messages.length - 1].role === 'user';
  const canSendMessage = !isStreaming && (!!input.trim() || lastMessageIsUser);

  return (
    <div className="flex flex-col h-screen bg-bkg-light dark:bg-bkg-dark text-text-light dark:text-text-dark">
      <div className="flex-1 overflow-y-auto">
        {session.messages.map((msg, index) => (
          <ChatMessage 
            key={msg.id} 
            message={msg} 
            index={index} 
            language={settings.language} 
            isLastMessage={index === session.messages.length - 1}
            isStreaming={isStreaming}
            onDelete={handleDeleteMessage} 
            onEdit={handleEditMessage}
            onRegenerate={handleRegenerate}
            />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t('chat.input.placeholder')}
              rows={1}
              className="w-full bg-bkg-light dark:bg-bkg-dark border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-3 px-4 pr-20 resize-none focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark"
              disabled={isStreaming}
            />
            <button
              onClick={handleSendMessage}
              disabled={!canSendMessage}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary-light dark:bg-primary-dark text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStreaming ? '.'.repeat(dotCount) : t('chat.send_button')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;