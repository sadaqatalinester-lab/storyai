import React from 'react';
import { ArrowRight, ArrowLeft, Trash2 } from 'lucide-react';

interface Props {
  paragraphs: string[];
  setParagraphs: (p: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step2Paragraphs: React.FC<Props> = ({ paragraphs, setParagraphs, onNext, onBack }) => {
  const updateParagraph = (index: number, val: string) => {
    const newP = [...paragraphs];
    newP[index] = val;
    setParagraphs(newP);
  };

  const removeParagraph = (index: number) => {
    const newP = paragraphs.filter((_, i) => i !== index);
    setParagraphs(newP);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
         <h2 className="text-2xl font-bold text-white">Review Scenes</h2>
        <p className="text-slate-400">We've split your story into scenes. Edit or merge as needed.</p>
      </div>

      <div className="space-y-4">
        {paragraphs.map((text, idx) => (
          <div key={idx} className="bg-slate-800 p-4 rounded-lg border border-slate-700 group relative">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
               <button 
                onClick={() => removeParagraph(idx)}
                className="p-1.5 text-red-400 hover:bg-red-900/30 rounded"
                title="Remove scene"
               >
                 <Trash2 size={16} />
               </button>
            </div>
            <div className="flex space-x-3">
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 text-slate-300 font-mono text-sm">
                {idx + 1}
              </span>
              <textarea
                value={text}
                onChange={(e) => updateParagraph(idx, e.target.value)}
                className="w-full bg-transparent border-none text-slate-300 focus:ring-0 resize-y min-h-[80px]"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-400 hover:text-white px-6 py-3 rounded-lg font-semibold transition-all"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <button
          onClick={onNext}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
        >
          <span>Confirm Scenes</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};