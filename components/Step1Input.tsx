


import React, { useRef, useState } from 'react';
import { Upload, ArrowRight, BookOpen, BrainCircuit, AlignLeft, Sparkles, Loader2, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { SegmentationMethod } from '../types';
import { segmentStory, validateGeminiApiKey } from '../services/gemini';
import { segmentStoryWithOpenAI, validateOpenAIApiKey } from '../services/openai';

interface Props {
  value: string;
  onChange: (val: string) => void;
  onNext: (paragraphs: string[]) => void;
}

export const Step1Input: React.FC<Props> = ({ value, onChange, onNext }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [method, setMethod] = useState<SegmentationMethod>('simple');
  const [isProcessing, setIsProcessing] = useState(false);

  // API Keys
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('custom_gemini_key') || '');
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem('custom_openai_key') || '');

  // Validation States for Step 1
  const [validatingGemini, setValidatingGemini] = useState(false);
  const [geminiValid, setGeminiValid] = useState<boolean | null>(null);
  const [validatingOpenAI, setValidatingOpenAI] = useState(false);
  const [openAIValid, setOpenAIValid] = useState<boolean | null>(null);

  // Save keys to local storage
  const handleKeyChange = (service: 'gemini' | 'openai', val: string) => {
    if (service === 'gemini') {
        setGeminiKey(val);
        localStorage.setItem('custom_gemini_key', val);
        setGeminiValid(null); // Reset validation on change
    } else {
        setOpenaiKey(val);
        localStorage.setItem('custom_openai_key', val);
        setOpenAIValid(null); // Reset validation on change
    }
  };

  const handleValidateGemini = async () => {
     if(!geminiKey) return;
     setValidatingGemini(true);
     const isValid = await validateGeminiApiKey(geminiKey);
     setGeminiValid(isValid);
     setValidatingGemini(false);
  };

  const handleValidateOpenAI = async () => {
     if(!openaiKey) return;
     setValidatingOpenAI(true);
     const isValid = await validateOpenAIApiKey(openaiKey);
     setOpenAIValid(isValid);
     setValidatingOpenAI(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result;
        if (typeof text === 'string') {
          onChange(text);
          // Auto-switch to smart if text is very long and has few breaks
          if (text.length > 500 && text.split('\n').length < 3) {
            setMethod('gemini');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleNextClick = async () => {
    if (!value.trim()) return;

    if (method === 'simple') {
        const paragraphs = value.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
        onNext(paragraphs);
    } else if (method === 'gemini') {
        // Validate Gemini API Key is provided and valid
        if (!geminiKey) {
            alert("Please enter your Gemini API Key to use Gemini Smart AI.");
            return;
        }
        if (geminiValid !== true) {
            alert("Please validate your Gemini API Key before proceeding. Click the verify button.");
            return;
        }
        setIsProcessing(true);
        try {
            const paragraphs = await segmentStory(value, geminiKey);
            onNext(paragraphs);
        } catch (e) {
            console.error(e);
            alert("Gemini Segmentation failed. Please check your API key and try again.");
            setIsProcessing(false);
        } finally {
            setIsProcessing(false);
        }
    } else {
        // GPT-4 Path
        if (!openaiKey) {
            alert("Please enter your OpenAI API Key to use ChatGPT 4o.");
            return;
        }
        if (openAIValid !== true) {
            alert("Please validate your OpenAI API Key before proceeding. Click the verify button.");
            return;
        }
        setIsProcessing(true);
        try {
            const paragraphs = await segmentStoryWithOpenAI(value, openaiKey, 'gpt-4o');
            onNext(paragraphs);
        } catch (e: any) {
             console.error(e);
             alert(`OpenAI Error: ${e.message}. Please check your API key.`);
             setIsProcessing(false);
        }
    }
  };


  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 mb-4">
          <BookOpen size={24} />
        </div>
        <h2 className="text-2xl font-bold text-white">Input Your Story</h2>
        <p className="text-slate-400">Paste your story below or upload a text file.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Input Area */}
          <div className={`lg:col-span-3 bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl space-y-4`}>
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-300">Story Text</label>
              <div className="flex items-center space-x-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Upload size={14} />
                    <span>Upload .txt</span>
                  </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Once upon a time in a digital galaxy far, far away..."
              className="w-full h-80 bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none leading-relaxed"
            />

            <div className="pt-2 border-t border-slate-700">
                <label className="text-sm font-medium text-slate-400 mb-3 block">Scene Segmentation Method</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Standard Split */}
                    <div 
                        onClick={() => setMethod('simple')}
                        className={`cursor-pointer p-3 rounded-lg border flex flex-col gap-2 transition-colors relative ${method === 'simple' ? 'bg-blue-600/10 border-blue-500' : 'bg-slate-900 border-slate-700 hover:border-slate-600'}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-1"><AlignLeft size={16} className={method === 'simple' ? 'text-blue-400' : 'text-slate-500'} /></div>
                            <div>
                                <div className={`text-sm font-medium ${method === 'simple' ? 'text-blue-100' : 'text-slate-300'}`}>Standard Split</div>
                                <div className="text-xs text-slate-500">Splits by double newlines. Fast & Free.</div>
                            </div>
                        </div>
                    </div>

                    {/* Gemini Smart AI */}
                    <div 
                        onClick={() => setMethod('gemini')}
                        className={`cursor-pointer p-3 rounded-lg border flex flex-col gap-2 transition-colors relative ${method === 'gemini' ? 'bg-purple-600/10 border-purple-500' : 'bg-slate-900 border-slate-700 hover:border-slate-600'}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-1"><BrainCircuit size={16} className={method === 'gemini' ? 'text-purple-400' : 'text-slate-500'} /></div>
                            <div>
                                <div className={`text-sm font-medium ${method === 'gemini' ? 'text-purple-100' : 'text-slate-300'}`}>Gemini Smart AI</div>
                                <div className="text-xs text-slate-500">Analyzes context to split scenes.</div>
                            </div>
                        </div>
                        {method === 'gemini' && (
                            <div onClick={(e) => e.stopPropagation()} className="mt-2 animate-fade-in space-y-1">
                                <label className="block text-[10px] text-purple-300 flex items-center gap-1">
                                    <Key size={10} /> Gemini API Key (Required)
                                </label>
                                <div className="flex gap-1">
                                    <input
                                        type="password"
                                        value={geminiKey}
                                        onChange={(e) => handleKeyChange('gemini', e.target.value)}
                                        placeholder="Enter your Gemini API Key..."
                                        className={`w-full bg-slate-950 border ${geminiValid === false ? 'border-red-500' : 'border-purple-500/30'} rounded px-2 py-1 text-xs text-purple-100 placeholder-purple-500/50 focus:outline-none focus:border-purple-500`}
                                    />
                                    {geminiKey && (
                                        <button
                                            onClick={handleValidateGemini}
                                            disabled={validatingGemini}
                                            className="px-2 py-1 bg-purple-900/50 rounded border border-purple-500/30 text-[10px] text-purple-200 hover:bg-purple-900"
                                            title="Verify Key"
                                        >
                                            {validatingGemini ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                        </button>
                                    )}
                                </div>
                                {geminiValid === true && <div className="text-[10px] text-green-400 flex items-center gap-1"><CheckCircle size={10} /> Key Verified</div>}
                                {geminiValid === false && <div className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle size={10} /> Invalid Key</div>}
                                {!geminiKey && <div className="text-[10px] text-orange-400">API key is required to use Gemini Smart AI</div>}
                            </div>
                        )}
                    </div>

                    {/* ChatGPT 4o */}
                    <div
                        onClick={() => setMethod('gpt4')}
                        className={`cursor-pointer p-3 rounded-lg border flex flex-col gap-2 transition-colors relative ${method === 'gpt4' ? 'bg-green-600/10 border-green-500' : 'bg-slate-900 border-slate-700 hover:border-slate-600'}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-1"><Sparkles size={16} className={method === 'gpt4' ? 'text-green-400' : 'text-slate-500'} /></div>
                            <div>
                                <div className={`text-sm font-medium ${method === 'gpt4' ? 'text-green-100' : 'text-slate-300'}`}>ChatGPT 4o</div>
                                <div className="text-xs text-slate-500">High precision segmentation.</div>
                            </div>
                        </div>

                        {method === 'gpt4' && (
                            <div onClick={(e) => e.stopPropagation()} className="mt-2 animate-fade-in space-y-1">
                                <label className="block text-[10px] text-green-300 flex items-center gap-1">
                                    <Key size={10} /> OpenAI API Key (Required)
                                </label>
                                <div className="flex gap-1">
                                    <input
                                        type="password"
                                        value={openaiKey}
                                        onChange={(e) => handleKeyChange('openai', e.target.value)}
                                        placeholder="sk-..."
                                        className={`w-full bg-slate-950 border ${openAIValid === false ? 'border-red-500' : 'border-green-500/30'} rounded px-2 py-1 text-xs text-green-100 placeholder-green-500/50 focus:outline-none focus:border-green-500`}
                                    />
                                     {openaiKey && (
                                        <button
                                            onClick={handleValidateOpenAI}
                                            disabled={validatingOpenAI}
                                            className="px-2 py-1 bg-green-900/50 rounded border border-green-500/30 text-[10px] text-green-200 hover:bg-green-900"
                                            title="Verify Key"
                                        >
                                            {validatingOpenAI ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                        </button>
                                    )}
                                </div>
                                {openAIValid === true && <div className="text-[10px] text-green-400 flex items-center gap-1"><CheckCircle size={10} /> Key Verified</div>}
                                {openAIValid === false && <div className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle size={10} /> Invalid Key</div>}
                                {!openaiKey && <div className="text-[10px] text-orange-400">API key is required to use ChatGPT 4o</div>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleNextClick}
                disabled={!value.trim() || isProcessing}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 min-w-[140px] justify-center"
              >
                {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Analyzing...</span>
                    </>
                ) : (
                    <>
                      <span>Next Step</span>
                      <ArrowRight size={18} />
                    </>
                )}
              </button>
            </div>
          </div>
      </div>
    </div>
  );
};
