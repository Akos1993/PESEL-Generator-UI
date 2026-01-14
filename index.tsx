
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  User, 
  Calendar, 
  Users, 
  Plus, 
  Trash2, 
  Download, 
  Search, 
  IdCard, 
  CheckCircle2, 
  RefreshCw,
  Info,
  Sun,
  Moon,
  Volume2,
  Loader2,
  HelpCircle,
  Accessibility,
  X,
  Type,
  Eye,
  ZapOff,
  Play
} from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Audio Decoding Helpers for Gemini TTS raw PCM
 */
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * PESEL Generation Logic
 */
interface Person {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: 'male' | 'female';
  pesel: string;
  createdAt: number;
}

const generatePESEL = (dobDate: Date, gender: 'male' | 'female'): string => {
  const year = dobDate.getFullYear();
  let month = dobDate.getMonth() + 1;

  if (year >= 1800 && year < 1900) month += 80;
  else if (year >= 2000 && year < 2100) month += 20;
  else if (year >= 2100 && year < 2200) month += 40;
  else if (year >= 2200 && year < 2300) month += 60;

  const yearPart = (year % 100).toString().padStart(2, '0');
  const monthPart = month.toString().padStart(2, '0');
  const dayPartStr = dobDate.getDate().toString().padStart(2, '0');

  const zzz = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  const sexDigit = gender === 'male' 
    ? [1, 3, 5, 7, 9][Math.floor(Math.random() * 5)]
    : [0, 2, 4, 6, 8][Math.floor(Math.random() * 5)];

  const base = `${yearPart}${monthPart}${dayPartStr}${zzz}${sexDigit}`;
  
  const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(base[i]) * weights[i];
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return base + checkDigit.toString();
};

const RANDOM_NAMES = {
  male: ['Jakub', 'Antoni', 'Jan', 'Filip', 'Franciszek', 'Mikołaj', 'Aleksander', 'Kacper', 'Wojciech', 'Adam'],
  female: ['Zuzanna', 'Julia', 'Maja', 'Zofia', 'Hanna', 'Lena', 'Alicja', 'Maria', 'Oliwia', 'Amelia'],
  surnames: ['Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski', 'Zieliński', 'Szymański', 'Woźniak']
};

const App: React.FC = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('pesel_theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  // Accessibility States
  const [isA11yMenuOpen, setIsA11yMenuOpen] = useState(false);
  const [fontScale, setFontScale] = useState(() => Number(localStorage.getItem('pesel_font_scale')) || 1);
  const [isHighContrast, setIsHighContrast] = useState(() => localStorage.getItem('pesel_high_contrast') === 'true');
  const [isReduceMotion, setIsReduceMotion] = useState(() => localStorage.getItem('pesel_reduce_motion') === 'true');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: 'male' as 'male' | 'female'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  
  // AI Accessibility states
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const [globalAudioLoading, setGlobalAudioLoading] = useState(false);
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('pesel_app_db');
    if (saved) {
      try {
        setPeople(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved data", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pesel_app_db', JSON.stringify(people));
  }, [people]);

  useEffect(() => {
    localStorage.setItem('pesel_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Persist A11y Settings
  useEffect(() => {
    localStorage.setItem('pesel_font_scale', fontScale.toString());
    localStorage.setItem('pesel_high_contrast', isHighContrast.toString());
    localStorage.setItem('pesel_reduce_motion', isReduceMotion.toString());
  }, [fontScale, isHighContrast, isReduceMotion]);

  const handleAddPerson = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.dob) return;

    const newPerson: Person = {
      id: crypto.randomUUID(),
      ...formData,
      pesel: generatePESEL(new Date(formData.dob), formData.gender),
      createdAt: Date.now()
    };

    setPeople(prev => [newPerson, ...prev]);
    setFormData({ firstName: '', lastName: '', dob: '', gender: 'male' });
  };

  const deletePerson = (id: string) => {
    setPeople(prev => prev.filter(p => p.id !== id));
  };

  const generateRandom = (count: number = 1) => {
    setIsAutoGenerating(true);
    const newBatch: Person[] = [];
    for (let i = 0; i < count; i++) {
      const gender = Math.random() > 0.5 ? 'male' : 'female';
      const firstName = RANDOM_NAMES[gender][Math.floor(Math.random() * 10)];
      const lastName = RANDOM_NAMES.surnames[Math.floor(Math.random() * 10)];
      const start = new Date(1950, 0, 1).getTime();
      const end = new Date(2010, 11, 31).getTime();
      const dobDate = new Date(start + Math.random() * (end - start));
      const dobStr = dobDate.toISOString().split('T')[0];

      newBatch.push({
        id: crypto.randomUUID(),
        firstName,
        lastName,
        dob: dobStr,
        gender,
        pesel: generatePESEL(dobDate, gender),
        createdAt: Date.now()
      });
    }
    setPeople(prev => [...newBatch, ...prev]);
    setTimeout(() => setIsAutoGenerating(false), 500);
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(people, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pesel_database_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  /**
   * AI Accessibility: Read Out Loud
   */
  const handleReadOutLoud = async (person: Person) => {
    if (audioLoadingId) return;
    setAudioLoadingId(person.id);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Read out the following identity details clearly and professionally: 
      Full name: ${person.firstName} ${person.lastName}. 
      Birth date: ${person.dob}. 
      PESEL identity number: ${person.pesel.split('').join(' ')}.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: person.gender === 'male' ? 'Kore' : 'Puck' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const buffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.onended = () => setAudioLoadingId(null);
        source.start();
      } else {
        setAudioLoadingId(null);
      }
    } catch (err) {
      console.error("TTS Error:", err);
      setAudioLoadingId(null);
    }
  };

  /**
   * AI Accessibility: Global Page Summary
   */
  const handleReadGlobalSummary = async () => {
    if (globalAudioLoading) return;
    setGlobalAudioLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const summaryText = people.length > 0 
        ? `You currently have ${people.length} identities in your database. 
           The most recent record is for ${people[0].firstName} ${people[0].lastName}, 
           born on ${people[0].dob}, with PESEL ${people[0].pesel.split('').join(' ')}.`
        : "Your identity database is currently empty. You can add a person manually or use the bulk generate button to start.";

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Speak as a helpful accessibility assistant: ${summaryText}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const buffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.onended = () => setGlobalAudioLoading(false);
        source.start();
      } else {
        setGlobalAudioLoading(false);
      }
    } catch (err) {
      console.error("Global TTS Error:", err);
      setGlobalAudioLoading(false);
    }
  };

  /**
   * AI Accessibility: Explain PESEL Structure
   */
  const handleExplainPESEL = async (person: Person) => {
    if (explainingId) return;
    setExplainingId(person.id);
    setAiExplanation(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Explain the structure of this Polish PESEL number: ${person.pesel}. 
      Break down the segments (YYMMDD ZZZ S Q) and what they signify for this specific individual born on ${person.dob}. 
      Be concise and helpful for someone using an accessibility tool. Use markdown.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setAiExplanation(response.text || "Could not generate explanation.");
    } catch (err) {
      console.error("AI Explain Error:", err);
      setAiExplanation("Error communicating with AI assistant.");
    }
  };

  const filteredPeople = useMemo(() => {
    return people.filter(p => 
      `${p.firstName} ${p.lastName} ${p.pesel}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [people, searchTerm]);

  // Style overrides for Accessibility
  const dynamicStyles = {
    fontSize: `${fontScale}rem`,
    transition: isReduceMotion ? 'none' : 'all 0.3s ease'
  };

  const highContrastClasses = isHighContrast 
    ? (isDarkMode ? 'contrast-125 border-white shadow-none' : 'contrast-150 border-black shadow-none') 
    : '';

  return (
    <div 
      style={dynamicStyles}
      className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans p-4 md:p-8 ${isReduceMotion ? 'motion-none' : ''}`}
    >
      <div className={`max-w-6xl mx-auto ${highContrastClasses}`}>
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-500/20">
                <IdCard size={28} />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">PESEL Master</h1>
            </div>
            <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Polish Identity Number Management System</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* AI Global Read Aloud Button - Prominent Placement */}
            <button 
              onClick={handleReadGlobalSummary}
              disabled={globalAudioLoading}
              className={`p-2 rounded-lg transition-all border flex items-center justify-center ${globalAudioLoading ? 'bg-indigo-100 dark:bg-indigo-900/50' : (isDarkMode ? 'bg-slate-800 border-slate-700 text-indigo-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-50')} shadow-sm`}
              title="Read Page Summary (AI Voice)"
              aria-label="Read page summary out loud"
            >
              {globalAudioLoading ? <Loader2 size={20} className="animate-spin text-indigo-500" /> : <Volume2 size={20} />}
            </button>

            {/* Accessibility Menu Trigger */}
            <button 
              onClick={() => setIsA11yMenuOpen(true)}
              className={`p-2 rounded-lg transition-colors border flex items-center justify-center ${isDarkMode ? 'bg-slate-800 border-slate-700 text-indigo-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-50'} shadow-sm`}
              title="Accessibility Settings"
              aria-label="Open accessibility settings"
            >
              <Accessibility size={20} />
            </button>
            
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg transition-colors border flex items-center justify-center ${isDarkMode ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-50'} shadow-sm`}
              title="Toggle theme"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={() => generateRandom(10)}
              disabled={isAutoGenerating}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${isDarkMode ? 'bg-indigo-900/30 text-indigo-300 border-indigo-500/30 hover:bg-indigo-900/50' : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'}`}
            >
              <RefreshCw size={18} className={isAutoGenerating ? 'animate-spin' : ''} />
              <span>Bulk Generate</span>
            </button>
            <button 
              onClick={exportData}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border shadow-sm ${isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
            >
              <Download size={18} />
              <span>Export</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Form & Stats */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Form Card */}
            <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl shadow-sm border overflow-hidden ${isHighContrast ? 'border-2' : ''}`}>
              <div className={`${isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200'} border-b px-6 py-4`}>
                <h2 className="font-semibold flex items-center gap-2">
                  <Plus size={18} className="text-indigo-500" />
                  Manual Entry
                </h2>
              </div>
              <form onSubmit={handleAddPerson} className="p-6 space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      required
                      value={formData.firstName}
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-all outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'}`}
                      placeholder="e.g. Adam"
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Last Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      required
                      value={formData.lastName}
                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-all outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'}`}
                      placeholder="e.g. Kowalski"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Birth Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 text-slate-400" size={18} />
                      <input 
                        type="date" 
                        required
                        value={formData.dob}
                        onChange={e => setFormData({...formData, dob: e.target.value})}
                        className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-all outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Gender</label>
                    <select 
                      value={formData.gender}
                      onChange={e => setFormData({...formData, gender: e.target.value as 'male' | 'female'})}
                      className={`w-full px-4 py-2 rounded-lg border transition-all outline-none focus:ring-2 focus:ring-indigo-500 appearance-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center gap-2 mt-2"
                >
                  <CheckCircle2 size={18} />
                  Generate Identity
                </button>
              </form>
            </div>

            {/* AI Explanation Detail Modal/Box */}
            {explainingId && (
              <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'} ${isHighContrast ? 'border-2' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                    <HelpCircle size={18} />
                    AI Assistant
                  </h3>
                  <button onClick={() => {setExplainingId(null); setAiExplanation(null)}} className="text-slate-400 hover:text-slate-600" aria-label="Close AI explanation">&times;</button>
                </div>
                {aiExplanation ? (
                  <div className={`text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {aiExplanation.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-slate-500 text-sm italic py-4">
                    <Loader2 size={16} className="animate-spin text-indigo-500" />
                    Analyzing PESEL structure...
                  </div>
                )}
              </div>
            )}

            {/* Stats Card */}
            <div className={`bg-indigo-600 dark:bg-indigo-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden ${isHighContrast ? 'border-2 border-white' : ''}`}>
              <div className="relative z-10">
                <h3 className="text-indigo-200 font-medium mb-4 flex items-center gap-2">
                  <Info size={18} />
                  Database Overview
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <p className="text-xs text-indigo-200 uppercase tracking-wider mb-1">Total Records</p>
                    <p className="text-3xl font-bold">{people.length}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <p className="text-xs text-indigo-200 uppercase tracking-wider mb-1">M / F Split</p>
                    <p className="text-xl font-bold">
                      {people.filter(p => p.gender === 'male').length} / {people.filter(p => p.gender === 'female').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute top-[-20%] right-[-10%] opacity-10">
                <Users size={200} />
              </div>
            </div>

          </div>

          {/* Right Column: List */}
          <div className="lg:col-span-8">
            <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl shadow-sm border overflow-hidden h-full flex flex-col ${isHighContrast ? 'border-2' : ''}`}>
              
              {/* Toolbar */}
              <div className={`p-6 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} flex flex-col md:flex-row gap-4 items-center justify-between`}>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users size={20} className="text-indigo-500" />
                  Generated Identities
                </h2>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search name or PESEL..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-full border-transparent focus:border-indigo-500 outline-none transition-all ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-50 text-slate-900'}`}
                  />
                </div>
              </div>

              {/* Table / List */}
              <div className="flex-1 overflow-auto max-h-[700px]">
                {filteredPeople.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead className={`${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'} sticky top-0 z-10`}>
                      <tr>
                        <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b ${isDarkMode ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-100'}`}>Identity</th>
                        <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b ${isDarkMode ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-100'}`}>Birth Data</th>
                        <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b ${isDarkMode ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-100'}`}>PESEL</th>
                        <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b text-right ${isDarkMode ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-100'}`}>Accessibility</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                      {filteredPeople.map((person) => (
                        <tr key={person.id} className={`transition-colors group ${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${person.gender === 'male' ? (isDarkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700') : (isDarkMode ? 'bg-pink-900/50 text-pink-400' : 'bg-pink-100 text-pink-700')}`}>
                                {person.firstName[0]}{person.lastName[0]}
                              </div>
                              <div>
                                <div className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{person.firstName} {person.lastName}</div>
                                <div className="text-xs text-slate-400 capitalize">{person.gender}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{person.dob}</div>
                            <div className="text-xs text-slate-500">Rec: {new Date(person.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <code className={`px-3 py-1 rounded-md font-mono text-sm font-bold tracking-wider ${isDarkMode ? 'bg-indigo-900/40 text-indigo-400' : 'bg-indigo-50 text-indigo-700'}`}>
                                {person.pesel}
                              </code>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Read Out Loud Button */}
                              <button 
                                onClick={() => handleReadOutLoud(person)}
                                disabled={audioLoadingId !== null}
                                className={`p-2 rounded-lg transition-all border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-indigo-400 hover:text-indigo-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-50'} shadow-sm flex items-center justify-center`}
                                title="Read out loud (AI Assistant)"
                                aria-label={`Read ${person.firstName}'s details out loud`}
                              >
                                {audioLoadingId === person.id ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={16} />}
                              </button>
                              
                              {/* Explain Structure Button */}
                              <button 
                                onClick={() => handleExplainPESEL(person)}
                                className={`p-2 rounded-lg transition-all border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-emerald-400 hover:text-emerald-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-emerald-600 hover:bg-slate-50'} shadow-sm flex items-center justify-center`}
                                title="Explain PESEL structure (AI Assistant)"
                                aria-label={`Explain structure of PESEL ${person.pesel}`}
                              >
                                <HelpCircle size={16} />
                              </button>

                              <button 
                                onClick={() => deletePerson(person.id)}
                                className="text-slate-400 hover:text-red-500 p-2 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Delete entry"
                                aria-label={`Delete entry for ${person.firstName} ${person.lastName}`}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <IdCard size={64} strokeWidth={1} className="mb-4 opacity-20" />
                    <p className="text-lg">No records found</p>
                    <p className="text-sm opacity-60">Add a new identity to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Accessibility Modal */}
      {isA11yMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} transition-transform duration-300 transform scale-100`}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-xl text-white">
                  <Accessibility size={24} />
                </div>
                <h2 className="text-2xl font-bold">Accessibility Options</h2>
              </div>
              <button 
                onClick={() => setIsA11yMenuOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close settings"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* AI Read Aloud Section - Repurposed in menu too for redundancy */}
              <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-900/20">
                <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  <Volume2 size={18} />
                  AI Voice Assistant
                </label>
                <button
                  onClick={handleReadGlobalSummary}
                  disabled={globalAudioLoading}
                  className={`w-full py-4 rounded-xl border-2 transition-all font-bold flex items-center justify-center gap-3 shadow-md ${globalAudioLoading ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                  {globalAudioLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Generating Audio...
                    </>
                  ) : (
                    <>
                      <Play size={20} fill="currentColor" />
                      Read Page Summary
                    </>
                  )}
                </button>
              </div>

              {/* Font Scale */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                  <Type size={18} className="text-indigo-500" />
                  Text Size
                </label>
                <div className="flex gap-2">
                  {[1, 1.15, 1.3].map((scale) => (
                    <button
                      key={scale}
                      onClick={() => setFontScale(scale)}
                      className={`flex-1 py-3 rounded-xl border-2 transition-all font-bold ${fontScale === scale ? 'border-indigo-600 bg-indigo-600/10 text-indigo-600' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                    >
                      {scale === 1 ? 'Default' : scale === 1.15 ? 'Medium' : 'Large'}
                    </button>
                  ))}
                </div>
              </div>

              {/* High Contrast */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isHighContrast ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <Eye size={18} />
                  </div>
                  <div>
                    <p className="font-semibold">High Contrast</p>
                    <p className="text-xs text-slate-500">Sharper colors & borders</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsHighContrast(!isHighContrast)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isHighContrast ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isHighContrast ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Reduce Motion */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isReduceMotion ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <ZapOff size={18} />
                  </div>
                  <div>
                    <p className="font-semibold">Reduce Motion</p>
                    <p className="text-xs text-slate-500">Disable animations</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsReduceMotion(!isReduceMotion)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isReduceMotion ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isReduceMotion ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <button 
              onClick={() => setIsA11yMenuOpen(false)}
              className="w-full mt-8 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-shadow shadow-lg hover:shadow-indigo-500/30"
            >
              Apply Changes
            </button>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <footer className={`max-w-6xl mx-auto mt-12 pb-8 text-center text-xs transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        <div className="flex items-center justify-center gap-4 mb-3">
          <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500" /> Standard Compliant</span>
          <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500" /> AI-Enhanced Readout</span>
          <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500" /> Multi-Century</span>
        </div>
        <p className="max-w-xl mx-auto leading-relaxed">
          This educational tool simulates Polish National Identification Numbers. 
          All generation logic follows the official 1-3-7-9 weight algorithm.
          AI Features use Google Gemini for accessibility assistance.
        </p>
      </footer>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
