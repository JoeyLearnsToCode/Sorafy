import React, { useState, useCallback, useEffect, useRef } from 'react';
// FIX: The 'translations' object is exported from 'constants.ts', not 'types.ts'.
import { InitialSettings, ImageFile, Language, Orientation } from '../types';
import { translations } from '../constants';
import { analyzeImage } from '../services/geminiService';
import { ScanIcon, GithubIcon, UploadIcon } from './icons';


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
        const analysis = await analyzeImage(referenceImages[0], promptLanguage); // Analyze the first image
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
    <div className="flex items-center justify-center h-full text-text-primary-light dark:text-text-primary-dark">
      <div className="max-w-2xl w-full p-8 flex flex-col space-y-8 h-full overflow-y-auto">
        <h1 className="text-4xl font-bold text-center">Sorafy</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Prompt Language */}
          <div>
            <label htmlFor="prompt-lang" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">{t('initial.prompt_language.label')}</label>
            <select id="prompt-lang" value={promptLanguage} onChange={(e) => setPromptLanguage(e.target.value)} className="block w-full bg-surface-secondary-light dark:bg-surface-secondary-dark border border-border-light dark:border-border-dark rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary-dark/50 focus:border-primary dark:focus:border-primary-dark sm:text-sm">
              <option>{t('initial.prompt_language.en')}</option><option>{t('initial.prompt_language.zh')}</option><option>{t('initial.prompt_language.ja')}</option><option>{t('initial.prompt_language.ko')}</option>
            </select>
          </div>
          {/* Orientation */}
          <div>
            <label htmlFor="orientation" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">{t('initial.orientation.label')}</label>
            <select id="orientation" value={orientation} onChange={(e) => setOrientation(e.target.value as Orientation)} className="block w-full bg-surface-secondary-light dark:bg-surface-secondary-dark border border-border-light dark:border-border-dark rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary-dark/50 focus:border-primary dark:focus:border-primary-dark sm:text-sm">
              <option value="portrait">{t('initial.orientation.portrait')}</option>
              <option value="landscape">{t('initial.orientation.landscape')}</option>
            </select>
          </div>
          {/* Duration */}
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">{t('initial.duration.label')}</label>
            <div className="flex items-center gap-3">
              <input id="duration" type="range" min="4" max="20" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full h-2 bg-surface-secondary-light dark:bg-surface-secondary-dark rounded-lg appearance-none cursor-pointer" />
              <span className="text-sm font-semibold w-8 text-center">{duration}s</span>
            </div>
          </div>
        </div>
        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">{t('initial.images.label')}</label>
          <label onDragOver={handleDragOver} onDrop={handleDrop} className="mt-1 flex justify-center px-6 py-10 border-2 border-border-light dark:border-border-dark border-dashed rounded-xl cursor-pointer hover:border-primary dark:hover:border-primary-dark transition-colors bg-surface-secondary-light dark:bg-surface-secondary-dark">
            <div className="space-y-1 text-center">
              <UploadIcon className="mx-auto h-10 w-10 text-text-secondary-light dark:text-text-secondary-dark" />
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{t('initial.images.cta')}</p>
              <input id="file-upload" name="file-upload" type="file" multiple accept="image/*" className="sr-only" onChange={handleFileChange} />
            </div>
          </label>
          {referenceImages.length > 0 && (
            <div className="mt-4 space-y-4">
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {referenceImages.map((img, i) => (
                    <div key={i} className="relative group">
                    <img src={img.dataUrl} alt={img.name} className="w-full h-28 object-cover rounded-lg border border-border-light dark:border-border-dark" />
                    <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                    </div>
                ))}
                </div>
                <button 
                    onClick={handleAnalyzeImage} 
                    disabled={isAnalyzing}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark hover:bg-surface-secondary-light dark:hover:bg-surface-secondary-dark transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                    <ScanIcon className="w-4 h-4" />
                    {isAnalyzing ? t('initial.images.analyzing_button') : t('initial.images.analyze_button')}
                </button>
            </div>
          )}
        </div>
        {/* Idea */}
        <div>
          <label htmlFor="idea" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">{t('initial.idea.label')}</label>
          <textarea
            ref={textareaRef}
            id="idea"
            rows={3}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder={t('initial.idea.placeholder')}
            className="mt-1 block w-full bg-surface-secondary-light dark:bg-surface-secondary-dark border border-border-light dark:border-border-dark rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary-dark/50 focus:border-primary dark:focus:border-primary-dark sm:text-sm resize-y min-h-[80px] max-h-[400px]"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
        {/* Button */}
        <div className="text-center pt-4">
          <button onClick={handleSubmit} className="w-full md:w-auto inline-flex justify-center py-3 px-16 border border-transparent shadow-sm text-base font-medium rounded-lg text-white bg-primary hover:opacity-90 dark:bg-primary-dark dark:text-surface-dark dark:hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-bkg-dark transition-opacity">
            {t('initial.generate_button')}
          </button>
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-2">{t('initial.generate_button.hint')}</p>
        </div>
         {/* GitHub Link */}
        <div className="w-full text-center mt-auto pt-8">
            <a 
                href="https://github.com/JoeyLearnsToCode/Sorafy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-primary dark:hover:text-primary-dark transition-colors"
            >
                <GithubIcon className="w-5 h-5" />
                <span>{t('initial.github.star')}</span>
            </a>
        </div>
      </div>
    </div>
  );
};

export default InitialSetup;