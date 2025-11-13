import React, { useState, useCallback, useEffect, useRef } from 'react';
// FIX: The 'translations' object is exported from 'constants.ts', not 'types.ts'.
import { InitialSettings, ImageFile, Language, Orientation } from '../types';
import { translations } from '../constants';
import { analyzeImage } from '../services/geminiService';
import { ScanIcon } from './icons';


interface InitialSetupProps {
  onGenerate: (settings: InitialSettings) => void;
  language: Language;
}

const InitialSetup: React.FC<InitialSetupProps> = ({ onGenerate, language }) => {
  const [promptLanguage, setPromptLanguage] = useState('English');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [duration, setDuration] = useState(10);
  const [referenceImages, setReferenceImages] = useState<ImageFile[]>([]);
  const [idea, setIdea] = useState('');
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const t = (key: keyof typeof translations.en) => translations[language][key] || key;
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

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
  
  const handleSubmit = useCallback(() => {
    if (!idea.trim()) {
      setError(t('initial.error.idea_required'));
      return;
    }
    setError('');
    onGenerate({ promptLanguage, orientation, duration, referenceImages, idea });
  }, [idea, onGenerate, promptLanguage, orientation, duration, referenceImages, t]);

  const handleAnalyzeImage = async () => {
    if (referenceImages.length === 0) return;
    setIsAnalyzing(true);
    setError('');
    try {
        const analysis = await analyzeImage(referenceImages[0]); // Analyze the first image
        setIdea(prev => prev ? `${prev}\n\n${analysis}`.trim() : analysis);
    } catch (e) {
        console.error("Error analyzing image:", e);
        setError("Failed to analyze image.");
    } finally {
        setIsAnalyzing(false);
    }
  };


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    }
  }, [idea]);

  return (
    <div className="flex items-center justify-center h-full bg-bkg-light dark:bg-bkg-dark text-text-light dark:text-text-dark">
      <div className="max-w-3xl w-full p-8 space-y-8">
        <h1 className="text-3xl font-bold text-center">{t('initial.title')}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Prompt Language */}
          <div>
            <label htmlFor="prompt-lang" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{t('initial.prompt_language.label')}</label>
            <select id="prompt-lang" value={promptLanguage} onChange={(e) => setPromptLanguage(e.target.value)} className="mt-1 block w-full bg-surface-light dark:bg-surface-dark border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-light focus:border-primary-light sm:text-sm">
              <option>{t('initial.prompt_language.en')}</option><option>{t('initial.prompt_language.zh')}</option><option>{t('initial.prompt_language.ja')}</option><option>{t('initial.prompt_language.ko')}</option>
            </select>
          </div>
          {/* Orientation */}
          <div>
            <label htmlFor="orientation" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{t('initial.orientation.label')}</label>
            <select id="orientation" value={orientation} onChange={(e) => setOrientation(e.target.value as Orientation)} className="mt-1 block w-full bg-surface-light dark:bg-surface-dark border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-light focus:border-primary-light sm:text-sm">
              <option value="portrait">{t('initial.orientation.portrait')}</option><option value="landscape">{t('initial.orientation.landscape')}</option>
            </select>
          </div>
          {/* Duration */}
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{t('initial.duration.label')}</label>
            <div className="flex items-center gap-2 mt-1">
              <input id="duration" type="range" min="4" max="20" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
              <span className="text-sm font-semibold w-8 text-center">{duration}s</span>
            </div>
          </div>
        </div>
        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{t('initial.images.label')}</label>
          <label onDragOver={handleDragOver} onDrop={handleDrop} className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md cursor-pointer">
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <div className="flex text-sm text-gray-600 dark:text-gray-400"><p className="pl-1">{t('initial.images.cta')}</p></div>
              <input id="file-upload" name="file-upload" type="file" multiple accept="image/*" className="sr-only" onChange={handleFileChange} />
            </div>
          </label>
          {referenceImages.length > 0 && (
            <div className="mt-2 space-y-2">
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {referenceImages.map((img, i) => (
                    <div key={i} className="relative group">
                    <img src={img.dataUrl} alt={img.name} className="w-full h-24 object-cover rounded-md" />
                    <button onClick={() => removeImage(i)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 m-1 opacity-0 group-hover:opacity-100">&times;</button>
                    </div>
                ))}
                </div>
                <button 
                    onClick={handleAnalyzeImage} 
                    disabled={isAnalyzing}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-primary-light dark:border-primary-dark text-primary-light dark:text-primary-dark hover:bg-primary-light/10 dark:hover:bg-primary-dark/10 transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                    <ScanIcon className="w-4 h-4" />
                    {isAnalyzing ? t('initial.images.analyzing_button') : t('initial.images.analyze_button')}
                </button>
            </div>
          )}
        </div>
        {/* Idea */}
        <div>
          <label htmlFor="idea" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{t('initial.idea.label')}</label>
          <textarea
            ref={textareaRef}
            id="idea"
            rows={3}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder={t('initial.idea.placeholder')}
            className="mt-1 block w-full bg-surface-light dark:bg-surface-dark border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-light focus:border-primary-light sm:text-sm resize-y min-h-[80px] max-h-[400px]"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
        {/* Button */}
        <div className="text-center">
          <button onClick={handleSubmit} className="w-full md:w-auto inline-flex justify-center py-3 px-12 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-light hover:bg-indigo-700 dark:bg-primary-dark dark:hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light dark:focus:ring-offset-bkg-dark">
            {t('initial.generate_button')}
          </button>
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-2">{t('initial.generate_button.hint')}</p>
        </div>
      </div>
    </div>
  );
};

export default InitialSetup;