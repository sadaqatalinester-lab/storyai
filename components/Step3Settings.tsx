


import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Video, Mic, Image as ImageIcon, Key, Save, Check, Settings2, AlertCircle, Zap, Loader2, CheckCircle } from 'lucide-react';
import { AppSettings, ASPECT_RATIOS, STYLES, VOICES, UserProfile } from '../types';
import { validateGeminiApiKey } from '../services/gemini';
import { validateLeonardoApiKey } from '../services/leonardo';
import { validateElevenLabsApiKey, validateKlingApiKey, validateHailuoApiKey, validateSoraApiKey } from '../services/apiValidation';

interface Props {
  settings: AppSettings;
  onChange: (s: AppSettings) => void;
  onNext: () => void;
  onBack: () => void;
  user: UserProfile | null;
}

export const Step3Settings: React.FC<Props> = ({ settings, onChange, onNext, onBack, user }) => {

  // Validation states for image engines
  const [validatingGoogle, setValidatingGoogle] = useState(false);
  const [googleValid, setGoogleValid] = useState<boolean | null>(null);
  const [validatingLeonardo, setValidatingLeonardo] = useState(false);
  const [leonardoValid, setLeonardoValid] = useState<boolean | null>(null);

  // Validation states for audio engines
  const [validatingElevenLabs, setValidatingElevenLabs] = useState(false);
  const [elevenLabsValid, setElevenLabsValid] = useState<boolean | null>(null);

  // Validation states for video engines
  const [validatingKling, setValidatingKling] = useState(false);
  const [klingValid, setKlingValid] = useState<boolean | null>(null);
  const [validatingHailuo, setValidatingHailuo] = useState(false);
  const [hailuoValid, setHailuoValid] = useState<boolean | null>(null);
  const [validatingSora, setValidatingSora] = useState(false);
  const [soraValid, setSoraValid] = useState<boolean | null>(null);

  // Direct update helper
  const update = (key: keyof AppSettings, val: any) => {
    onChange({ ...settings, [key]: val });
  };

  const updateApiKey = (service: 'google' | 'leonardo' | 'elevenlabs' | 'kling' | 'hailuo' | 'sora', key: string | undefined) => {
    const newKeys = { ...settings.apiKeys, [service]: key };
    onChange({ ...settings, apiKeys: newKeys });

    // Reset validation when key changes
    if (service === 'google') setGoogleValid(null);
    if (service === 'leonardo') setLeonardoValid(null);
    if (service === 'elevenlabs') setElevenLabsValid(null);
    if (service === 'kling') setKlingValid(null);
    if (service === 'hailuo') setHailuoValid(null);
    if (service === 'sora') setSoraValid(null);
  };

  // Validation handlers
  const handleValidateGoogle = async () => {
    if (!settings.apiKeys.google) return;
    setValidatingGoogle(true);
    const isValid = await validateGeminiApiKey(settings.apiKeys.google);
    setGoogleValid(isValid);
    setValidatingGoogle(false);
  };

  const handleValidateLeonardo = async () => {
    if (!settings.apiKeys.leonardo) return;
    setValidatingLeonardo(true);
    const isValid = await validateLeonardoApiKey(settings.apiKeys.leonardo);
    setLeonardoValid(isValid);
    setValidatingLeonardo(false);
  };

  const handleValidateElevenLabs = async () => {
    if (!settings.apiKeys.elevenlabs) return;
    setValidatingElevenLabs(true);
    const isValid = await validateElevenLabsApiKey(settings.apiKeys.elevenlabs);
    setElevenLabsValid(isValid);
    setValidatingElevenLabs(false);
  };

  const handleValidateKling = async () => {
    if (!settings.apiKeys.kling) return;
    setValidatingKling(true);
    const isValid = await validateKlingApiKey(settings.apiKeys.kling);
    setKlingValid(isValid);
    setValidatingKling(false);
  };

  const handleValidateHailuo = async () => {
    if (!settings.apiKeys.hailuo) return;
    setValidatingHailuo(true);
    const isValid = await validateHailuoApiKey(settings.apiKeys.hailuo);
    setHailuoValid(isValid);
    setValidatingHailuo(false);
  };

  const handleValidateSora = async () => {
    if (!settings.apiKeys.sora) return;
    setValidatingSora(true);
    const isValid = await validateSoraApiKey(settings.apiKeys.sora);
    setSoraValid(isValid);
    setValidatingSora(false);
  };

  // Validation before proceeding to next step
  const handleNext = () => {
    // Check if image engine requires API key and if it's validated
    if (settings.imageEngine.includes('gemini') || settings.imageEngine.includes('imagen')) {
      if (!settings.apiKeys.google) {
        alert('Please enter your Google Gemini API Key to continue.');
        return;
      }
      if (googleValid !== true) {
        alert('Please validate your Google Gemini API Key before proceeding. Click the "Verify" button.');
        return;
      }
    }

    if (settings.imageEngine === 'leonardo-ai') {
      if (!settings.apiKeys.leonardo) {
        alert('Please enter your Leonardo AI API Key to continue.');
        return;
      }
      if (leonardoValid !== true) {
        alert('Please validate your Leonardo AI API Key before proceeding. Click the "Verify" button.');
        return;
      }
    }

    // Check audio engine validation if audio generation is enabled
    if (settings.generateAudio) {
      if (settings.audioEngine === 'gemini-tts') {
        if (!settings.apiKeys.google) {
          alert('Please enter your Google Gemini API Key for audio narration.');
          return;
        }
        if (googleValid !== true) {
          alert('Please validate your Google Gemini API Key before proceeding. Click the "Verify" button.');
          return;
        }
      }

      if (settings.audioEngine === 'elevenlabs') {
        if (!settings.apiKeys.elevenlabs) {
          alert('Please enter your ElevenLabs API Key for audio narration.');
          return;
        }
        if (elevenLabsValid !== true) {
          alert('Please validate your ElevenLabs API Key before proceeding. Click the "Verify" button.');
          return;
        }
      }
    }

    // Check video engine validation if video generation is enabled
    if (settings.generateVideo) {
      if (settings.videoEngine === 'veo') {
        if (!settings.apiKeys.google) {
          alert('Please enter your Google Gemini API Key for video generation.');
          return;
        }
        if (googleValid !== true) {
          alert('Please validate your Google Gemini API Key before proceeding. Click the "Verify" button.');
          return;
        }
      }

      if (settings.videoEngine === 'kling') {
        if (!settings.apiKeys.kling) {
          alert('Please enter your Kling AI API Key for video generation.');
          return;
        }
        if (klingValid !== true) {
          alert('Please validate your Kling AI API Key before proceeding. Click the "Verify" button.');
          return;
        }
      }

      if (settings.videoEngine === 'hailuo') {
        if (!settings.apiKeys.hailuo) {
          alert('Please enter your Hailuo AI API Key for video generation.');
          return;
        }
        if (hailuoValid !== true) {
          alert('Please validate your Hailuo AI API Key before proceeding. Click the "Verify" button.');
          return;
        }
      }

      if (settings.videoEngine === 'sora') {
        if (!settings.apiKeys.sora) {
          alert('Please enter your OpenAI API Key for Sora video generation.');
          return;
        }
        if (soraValid !== true) {
          alert('Please validate your OpenAI API Key before proceeding. Click the "Verify" button.');
          return;
        }
      }
    }

    // All validations passed, proceed to next step
    onNext();
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Generation Settings</h2>
        <p className="text-slate-400">Configure your production pipeline & API Access.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* --- LEFT COLUMN: VISUALS --- */}
        <div className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-6">
            <div className="flex items-center space-x-2 text-blue-400 mb-2">
              <ImageIcon size={20} />
              <h3 className="font-semibold text-white">Visual Engine</h3>
            </div>

            {/* Image Engine Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-400">Select Model</label>
              <div className="space-y-2">
                <EngineOption 
                  label="Google Nano Banana" 
                  subLabel="Fastest"
                  badge="API KEY"
                  badgeColor="blue"
                  selected={settings.imageEngine === 'gemini-2.5-flash-image'}
                  onClick={() => update('imageEngine', 'gemini-2.5-flash-image')}
                />
                <EngineOption 
                  label="Imagen 3.0" 
                  subLabel="High Quality"
                  badge="API KEY"
                  badgeColor="blue"
                  selected={settings.imageEngine === 'imagen-3.0-generate-001'}
                  onClick={() => update('imageEngine', 'imagen-3.0-generate-001')}
                />
                <EngineOption 
                  label="Leonardo.Ai" 
                  subLabel="Artistic Control"
                  badge="API KEY"
                  badgeColor="orange"
                  selected={settings.imageEngine === 'leonardo-ai'}
                  onClick={() => update('imageEngine', 'leonardo-ai')}
                />
              </div>

              {/* MANUAL API KEY INPUT FOR GOOGLE (Applies to all google services) */}
              {(settings.imageEngine.includes('gemini') || settings.imageEngine.includes('imagen')) && (
                  <div className="mt-2 animate-fade-in bg-slate-900 p-3 rounded border border-slate-700 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-slate-400 flex items-center gap-1">
                        <Key size={12} />
                        <span>Google Gemini API Key (Required)</span>
                      </label>
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-[10px] text-blue-400 hover:underline">Get Key →</a>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={settings.apiKeys.google || ''}
                        onChange={(e) => updateApiKey('google', e.target.value || undefined)}
                        placeholder="Enter your Google Gemini API Key..."
                        className={`flex-1 bg-slate-800 border ${googleValid === false ? 'border-red-500' : 'border-slate-600'} rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none`}
                      />
                      {settings.apiKeys.google && (
                        <button
                          onClick={handleValidateGoogle}
                          disabled={validatingGoogle}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-medium flex items-center gap-1 min-w-[70px] justify-center"
                          title="Verify Key"
                        >
                          {validatingGoogle ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              <span>Verifying...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle size={12} />
                              <span>Verify</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {googleValid === true && <div className="text-[10px] text-green-400 flex items-center gap-1"><CheckCircle size={10} /> Key Verified & Active</div>}
                    {googleValid === false && <div className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle size={10} /> Invalid API Key</div>}
                    {!settings.apiKeys.google && <div className="text-[10px] text-orange-400">API key is required for {settings.imageEngine === 'gemini-2.5-flash-image' ? 'Google Nano Banana' : 'Imagen 3.0'}</div>}
                  </div>
              )}

              {/* API KEY FOR LEONARDO */}
              {settings.imageEngine === 'leonardo-ai' && (
                <div className="mt-2 animate-fade-in bg-slate-900 p-3 rounded border border-slate-700 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-slate-400 flex items-center gap-1">
                      <Key size={12} />
                      <span>Leonardo AI API Key (Required)</span>
                    </label>
                    <a href="https://app.leonardo.ai/settings" target="_blank" className="text-[10px] text-blue-400 hover:underline">Get Key →</a>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={settings.apiKeys.leonardo || ''}
                      onChange={(e) => updateApiKey('leonardo', e.target.value || undefined)}
                      placeholder="Enter your Leonardo API Key..."
                      className={`flex-1 bg-slate-800 border ${leonardoValid === false ? 'border-red-500' : 'border-slate-600'} rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none`}
                    />
                    {settings.apiKeys.leonardo && (
                      <button
                        onClick={handleValidateLeonardo}
                        disabled={validatingLeonardo}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-medium flex items-center gap-1 min-w-[70px] justify-center"
                        title="Verify Key"
                      >
                        {validatingLeonardo ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={12} />
                            <span>Verify</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  {leonardoValid === true && <div className="text-[10px] text-green-400 flex items-center gap-1"><CheckCircle size={10} /> Key Verified & Active</div>}
                  {leonardoValid === false && <div className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle size={10} /> Invalid API Key</div>}
                  {!settings.apiKeys.leonardo && <div className="text-[10px] text-orange-400">API key is required for Leonardo AI</div>}
                </div>
              )}
            </div>
            
            <div className="border-t border-slate-700 pt-4 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center justify-between">
                    <span>Scenes per Paragraph</span>
                    <span className="text-blue-400 font-bold">{settings.imageCount}</span>
                 </label>
                 <select 
                   value={settings.imageCount}
                   onChange={(e) => update('imageCount', parseInt(e.target.value))}
                   className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                 >
                   {Array.from({length: 50}, (_, i) => i + 1).map(num => (
                     <option key={num} value={num}>{num} {num === 1 ? 'Scene' : 'Scenes'}</option>
                   ))}
                 </select>
                 <p className="text-[10px] text-slate-500 mt-1">Each scene includes a Start Image, End Image, and Video transition.</p>
               </div>

               <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Aspect Ratio</label>
                <select 
                  value={settings.aspectRatio}
                  onChange={(e) => update('aspectRatio', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Art Style</label>
                <select 
                  value={settings.style}
                  onChange={(e) => update('style', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: AUDIO & VIDEO --- */}
        <div className="space-y-6">
          
          {/* Audio Settings */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-purple-400">
                <Mic size={20} />
                <h3 className="font-semibold text-white">Audio Narration</h3>
              </div>
              <Toggle checked={!!settings.generateAudio} onChange={(c) => update('generateAudio', c)} />
            </div>
            
            {settings.generateAudio && (
              <div className="space-y-4 animate-fade-in-down">
                 <div className="space-y-2">
                  <EngineOption 
                    label="Gemini TTS" 
                    subLabel="Native, Fast"
                    badge="API KEY"
                    badgeColor="blue"
                    selected={settings.audioEngine === 'gemini-tts'}
                    onClick={() => update('audioEngine', 'gemini-tts')}
                  />
                  <EngineOption 
                    label="ElevenLabs" 
                    subLabel="Premium Clones"
                    badge="Paid Subscription"
                    badgeColor="orange"
                    selected={settings.audioEngine === 'elevenlabs'}
                    onClick={() => update('audioEngine', 'elevenlabs')}
                  />
                </div>

                {settings.audioEngine === 'gemini-tts' && (
                    <div className="animate-fade-in bg-slate-900 p-3 rounded border border-slate-700 space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs text-slate-400 flex items-center gap-1">
                          <Key size={12} />
                          <span>Google Gemini API Key (Required)</span>
                        </label>
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-[10px] text-blue-400 hover:underline">Get Key →</a>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={settings.apiKeys.google || ''}
                          onChange={(e) => updateApiKey('google', e.target.value || undefined)}
                          placeholder="Enter your Google Gemini API Key..."
                          className={`flex-1 bg-slate-800 border ${googleValid === false ? 'border-red-500' : 'border-slate-600'} rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none`}
                        />
                        {settings.apiKeys.google && (
                          <button
                            onClick={handleValidateGoogle}
                            disabled={validatingGoogle}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-medium flex items-center gap-1 min-w-[70px] justify-center"
                            title="Verify Key"
                          >
                            {validatingGoogle ? (
                              <>
                                <Loader2 size={12} className="animate-spin" />
                                <span>Verifying...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle size={12} />
                                <span>Verify</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      {googleValid === true && <div className="text-[10px] text-green-400 flex items-center gap-1"><CheckCircle size={10} /> Key Verified & Active</div>}
                      {googleValid === false && <div className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle size={10} /> Invalid API Key</div>}
                      {!settings.apiKeys.google && <div className="text-[10px] text-orange-400">API key is required for Gemini TTS</div>}
                    </div>
                )}

                {settings.audioEngine === 'elevenlabs' && (
                  <div className="animate-fade-in bg-slate-900 p-3 rounded border border-slate-700 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-slate-400 flex items-center gap-1">
                        <Key size={12} />
                        <span>ElevenLabs API Key (Required)</span>
                      </label>
                      <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" className="text-[10px] text-blue-400 hover:underline">Get Key →</a>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={settings.apiKeys.elevenlabs || ''}
                        onChange={(e) => updateApiKey('elevenlabs', e.target.value || undefined)}
                        placeholder="Enter your ElevenLabs API Key..."
                        className={`flex-1 bg-slate-800 border ${elevenLabsValid === false ? 'border-red-500' : 'border-slate-600'} rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none`}
                      />
                      {settings.apiKeys.elevenlabs && (
                        <button
                          onClick={handleValidateElevenLabs}
                          disabled={validatingElevenLabs}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-medium flex items-center gap-1 min-w-[70px] justify-center"
                          title="Verify Key"
                        >
                          {validatingElevenLabs ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              <span>Verifying...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle size={12} />
                              <span>Verify</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {elevenLabsValid === true && <div className="text-[10px] text-green-400 flex items-center gap-1"><CheckCircle size={10} /> Key Verified & Active</div>}
                    {elevenLabsValid === false && <div className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle size={10} /> Invalid API Key</div>}
                    {!settings.apiKeys.elevenlabs && <div className="text-[10px] text-orange-400">API key is required for ElevenLabs</div>}
                  </div>
                )}

                 <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Voice Profile</label>
                  <select 
                    value={settings.audioVoice}
                    onChange={(e) => update('audioVoice', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Video Settings */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-green-400">
                <Video size={20} />
                <h3 className="font-semibold text-white">Motion Video</h3>
              </div>
              <Toggle checked={!!settings.generateVideo} onChange={(c) => update('generateVideo', c)} />
            </div>

            {settings.generateVideo && (
              <div className="space-y-4 animate-fade-in-down">
                 <div className="space-y-2">
                  <EngineOption 
                    label="Google Veo" 
                    subLabel="High Motion"
                    badge="API KEY" 
                    badgeColor="blue"
                    selected={settings.videoEngine === 'veo'}
                    onClick={() => update('videoEngine', 'veo')}
                  />
                  <EngineOption 
                    label="Kling AI" 
                    subLabel="Realistic"
                    badge="Subscription"
                    badgeColor="orange"
                    selected={settings.videoEngine === 'kling'}
                    onClick={() => update('videoEngine', 'kling')}
                  />
                  <EngineOption 
                    label="Hailuo AI" 
                    subLabel="Creative"
                    badge="Subscription"
                    badgeColor="orange"
                    selected={settings.videoEngine === 'hailuo'}
                    onClick={() => update('videoEngine', 'hailuo')}
                  />
                  <EngineOption 
                    label="Sora (OpenAI)" 
                    subLabel="Coming Soon"
                    badge="Subscription"
                    badgeColor="orange"
                    selected={settings.videoEngine === 'sora'}
                    onClick={() => update('videoEngine', 'sora')}
                  />
                </div>
                
                {settings.videoEngine === 'veo' && (
                    <div className="animate-fade-in bg-slate-900 p-3 rounded border border-slate-700 space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs text-slate-400 flex items-center gap-1">
                          <Key size={12} />
                          <span>Google Gemini API Key (Required)</span>
                        </label>
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-[10px] text-blue-400 hover:underline">Get Key →</a>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={settings.apiKeys.google || ''}
                          onChange={(e) => updateApiKey('google', e.target.value || undefined)}
                          placeholder="Enter your Google Gemini API Key..."
                          className={`flex-1 bg-slate-800 border ${googleValid === false ? 'border-red-500' : 'border-slate-600'} rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none`}
                        />
                        {settings.apiKeys.google && (
                          <button
                            onClick={handleValidateGoogle}
                            disabled={validatingGoogle}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-medium flex items-center gap-1 min-w-[70px] justify-center"
                            title="Verify Key"
                          >
                            {validatingGoogle ? (
                              <>
                                <Loader2 size={12} className="animate-spin" />
                                <span>Verifying...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle size={12} />
                                <span>Verify</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      {googleValid === true && <div className="text-[10px] text-green-400 flex items-center gap-1"><CheckCircle size={10} /> Key Verified & Active</div>}
                      {googleValid === false && <div className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle size={10} /> Invalid API Key</div>}
                      {!settings.apiKeys.google && <div className="text-[10px] text-orange-400">API key is required for Google Veo</div>}
                    </div>
                )}

                {settings.videoEngine === 'kling' && (
                  <div className="animate-fade-in bg-slate-900 p-3 rounded border border-slate-700 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-slate-400 flex items-center gap-1">
                        <Key size={12} />
                        <span>Kling AI API Key (Required)</span>
                      </label>
                      <a href="https://klingai.com" target="_blank" className="text-[10px] text-blue-400 hover:underline">Get Key →</a>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={settings.apiKeys.kling || ''}
                        onChange={(e) => updateApiKey('kling', e.target.value || undefined)}
                        placeholder="Enter your Kling AI API Key..."
                        className={`flex-1 bg-slate-800 border ${klingValid === false ? 'border-red-500' : 'border-slate-600'} rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none`}
                      />
                      {settings.apiKeys.kling && (
                        <button
                          onClick={handleValidateKling}
                          disabled={validatingKling}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-medium flex items-center gap-1 min-w-[70px] justify-center"
                          title="Verify Key"
                        >
                          {validatingKling ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              <span>Verifying...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle size={12} />
                              <span>Verify</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {klingValid === true && <div className="text-[10px] text-green-400 flex items-center gap-1"><CheckCircle size={10} /> Key Verified & Active</div>}
                    {klingValid === false && <div className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle size={10} /> Invalid API Key</div>}
                    {!settings.apiKeys.kling && <div className="text-[10px] text-orange-400">API key is required for Kling AI</div>}
                  </div>
                )}

                {settings.videoEngine === 'hailuo' && (
                  <div className="animate-fade-in bg-slate-900 p-3 rounded border border-slate-700 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-slate-400 flex items-center gap-1">
                        <Key size={12} />
                        <span>Hailuo AI API Key (Required)</span>
                      </label>
                      <a href="https://hailuoai.com" target="_blank" className="text-[10px] text-blue-400 hover:underline">Get Key →</a>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={settings.apiKeys.hailuo || ''}
                        onChange={(e) => updateApiKey('hailuo', e.target.value || undefined)}
                        placeholder="Enter your Hailuo AI API Key..."
                        className={`flex-1 bg-slate-800 border ${hailuoValid === false ? 'border-red-500' : 'border-slate-600'} rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none`}
                      />
                      {settings.apiKeys.hailuo && (
                        <button
                          onClick={handleValidateHailuo}
                          disabled={validatingHailuo}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-medium flex items-center gap-1 min-w-[70px] justify-center"
                          title="Verify Key"
                        >
                          {validatingHailuo ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              <span>Verifying...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle size={12} />
                              <span>Verify</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {hailuoValid === true && <div className="text-[10px] text-green-400 flex items-center gap-1"><CheckCircle size={10} /> Key Verified & Active</div>}
                    {hailuoValid === false && <div className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle size={10} /> Invalid API Key</div>}
                    {!settings.apiKeys.hailuo && <div className="text-[10px] text-orange-400">API key is required for Hailuo AI</div>}
                  </div>
                )}

                {settings.videoEngine === 'sora' && (
                  <div className="animate-fade-in bg-slate-900 p-3 rounded border border-slate-700 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-slate-400 flex items-center gap-1">
                        <Key size={12} />
                        <span>OpenAI API Key (Required for Sora)</span>
                      </label>
                      <a href="https://platform.openai.com/api-keys" target="_blank" className="text-[10px] text-blue-400 hover:underline">Get Key →</a>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={settings.apiKeys.sora || ''}
                        onChange={(e) => updateApiKey('sora', e.target.value || undefined)}
                        placeholder="sk-..."
                        className={`flex-1 bg-slate-800 border ${soraValid === false ? 'border-red-500' : 'border-slate-600'} rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none`}
                      />
                      {settings.apiKeys.sora && (
                        <button
                          onClick={handleValidateSora}
                          disabled={validatingSora}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-medium flex items-center gap-1 min-w-[70px] justify-center"
                          title="Verify Key"
                        >
                          {validatingSora ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              <span>Verifying...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle size={12} />
                              <span>Verify</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {soraValid === true && <div className="text-[10px] text-green-400 flex items-center gap-1"><CheckCircle size={10} /> Key Verified & Active</div>}
                    {soraValid === false && <div className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle size={10} /> Invalid API Key</div>}
                    {!settings.apiKeys.sora && <div className="text-[10px] text-orange-400">API key is required for Sora</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
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
          onClick={handleNext}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg shadow-blue-600/20"
        >
          <span>Next: Review Prompts</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

// --- Sub Components ---

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (c: boolean) => void }) => (
  <div 
    onClick={() => onChange(!checked)}
    className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer"
  >
    <div className={`absolute inset-0 rounded-full transition-colors ${checked ? 'bg-blue-600 border-blue-600' : 'bg-slate-900 border-slate-700 border'}`}></div>
    <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${checked ? 'translate-x-6' : 'translate-x-0'}`}></span>
  </div>
);

const EngineOption = ({ label, subLabel, badge, badgeColor, selected, onClick }: { label: string, subLabel: string, badge: string, badgeColor: 'green' | 'orange' | 'blue', selected: boolean, onClick: () => void }) => (
  <div 
    onClick={onClick}
    className={`
      relative p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between group
      ${selected ? 'bg-blue-600/10 border-blue-500' : 'bg-slate-900 border-slate-700 hover:border-slate-600'}
    `}
  >
    <div className="flex items-center space-x-3">
      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${selected ? 'border-blue-500' : 'border-slate-500'}`}>
        {selected && <div className="w-2 h-2 rounded-full bg-blue-500" />}
      </div>
      <div>
        <div className={`font-medium text-sm ${selected ? 'text-white' : 'text-slate-300'}`}>{label}</div>
        <div className="text-xs text-slate-500">{subLabel}</div>
      </div>
    </div>
    
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
      badgeColor === 'orange' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 
      badgeColor === 'blue' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
      'bg-green-500/20 text-green-400 border border-green-500/30'
    }`}>
      {badge}
    </span>
  </div>
);

const ApiKeyInput = ({ service, currentKey, onSave, placeholder = "sk-...", link, validate, onValidationChange }: { service: string, currentKey?: string, onSave: (k?: string) => void, placeholder?: string, link?: string, validate?: (k: string) => Promise<boolean>, onValidationChange?: (isValid: boolean) => void }) => {
  const [val, setVal] = useState(currentKey || '');
  const [isEditing, setIsEditing] = useState(!currentKey);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    const cleaned = val.trim();
    if (cleaned) {
      if (validate) {
          setValidating(true);
          const isValid = await validate(cleaned);
          setValidating(false);
          if (!isValid) {
              setError("Invalid API Key. Verification failed. Please check characters.");
              if (onValidationChange) onValidationChange(false);
              return;
          }
          if (onValidationChange) onValidationChange(true);
      } else {
          // Simple length check for other services to prevent empty/garbage
          if (cleaned.length < 8) {
              setError("Key seems too short.");
              if (onValidationChange) onValidationChange(false);
              return;
          }
      }
      onSave(cleaned);
      localStorage.setItem(`api_key_${service.toLowerCase().replace(' ', '_')}`, cleaned);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    onSave(undefined);
    localStorage.removeItem(`api_key_${service.toLowerCase().replace(' ', '_')}`);
    setVal('');
    setError(null);
    setIsEditing(true);
    if (onValidationChange) onValidationChange(false);
  };

  if (!isEditing && currentKey) {
    return (
      <div className="bg-slate-900/50 p-3 rounded border border-slate-700 flex items-center justify-between animate-fade-in">
        <div className="flex items-center space-x-2 text-green-400">
           <Check size={14} />
           <div className="flex flex-col">
              <span className="text-xs font-mono font-bold">API Key Saved</span>
              <span className="text-[10px] text-green-500/70">Verified & Active</span>
           </div>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setIsEditing(true)} className="text-xs text-blue-400 hover:underline">Edit</button>
          <button onClick={handleDelete} className="text-xs text-red-400 hover:underline">Delete</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 p-3 rounded border border-slate-700 space-y-2 animate-fade-in">
      <div className="flex justify-between items-center">
          <label className="text-xs text-slate-400 flex items-center gap-1">
            <Key size={12} />
            <span>Enter {service} Key</span>
          </label>
          {link && <a href={link} target="_blank" className="text-[10px] text-blue-400 hover:underline">Get Key &rarr;</a>}
      </div>
      <div className="flex space-x-2">
        <input 
          type="password"
          value={val}
          onChange={(e) => { setVal(e.target.value); setError(null); }}
          placeholder={placeholder}
          className={`flex-1 bg-slate-800 border ${error ? 'border-red-500' : 'border-slate-600'} rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none`}
        />
        <button 
          onClick={handleSave}
          disabled={!val.trim() || validating}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 py-1 rounded text-xs font-medium flex items-center space-x-1 min-w-[70px] justify-center"
        >
          {validating ? (
              <>
                <Settings2 className="animate-spin" size={12} />
                <span>Checking...</span>
              </>
          ) : (
              <>
                <Save size={12} />
                <span>Save</span>
              </>
          )}
        </button>
      </div>
      {error && (
          <div className="flex items-center gap-1 text-[10px] text-red-400">
              <AlertCircle size={10} />
              <span>{error}</span>
          </div>
      )}
    </div>
  );
};
