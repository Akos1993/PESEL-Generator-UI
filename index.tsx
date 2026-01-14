
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
  Play,
  Globe
} from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Translations Dictionary
 */
type Language = 'PL' | 'ENG' | 'UKR';

const LANGUAGE_CONFIG: Record<Language, { label: string; flag: string }> = {
  PL: { label: 'PL', flag: '🇵🇱' },
  ENG: { label: 'EN', flag: '🇬🇧' },
  UKR: { label: 'UA', flag: '🇺🇦' }
};

const TRANSLATIONS = {
  PL: {
    title: 'PESEL Master',
    subtitle: 'System Zarządzania Numerami PESEL',
    bulkGenerate: 'Generuj Grupowo',
    export: 'Eksportuj',
    manualEntry: 'Wprowadzanie Ręczne',
    firstName: 'Imię',
    lastName: 'Nazwisko',
    dob: 'Data Urodzenia',
    gender: 'Płeć',
    male: 'Mężczyzna',
    female: 'Kobieta',
    generateIdentity: 'Generuj Tożsamość',
    databaseOverview: 'Przegląd Bazy Danych',
    totalRecords: 'Łącznie Rekordów',
    mfSplit: 'Podział M / K',
    identities: 'Wygenerowane Tożsamości',
    searchPlaceholder: 'Szukaj imienia lub PESEL...',
    tableIdentity: 'Tożsamość',
    tableBirthData: 'Dane Urodzenia',
    tablePesel: 'PESEL',
    tableAccessibility: 'Dostępność',
    readOutLoud: 'Czytaj na głos',
    explainStructure: 'Wyjaśnij strukturę PESEL',
    a11yOptions: 'Opcje Dostępności',
    textSize: 'Rozmiar Tekstu',
    defaultSize: 'Domyślny',
    mediumSize: 'Średni',
    largeSize: 'Duży',
    highContrast: 'Wysoki Kontrast',
    highContrastDesc: 'Ostrzejsze kolory i krawędzie',
    reduceMotion: 'Ogranicz Ruch',
    reduceMotionDesc: 'Wyłącz animacje',
    voiceAssistant: 'Asystent Głosowy AI',
    readSummary: 'Czytaj Podsumowanie Strony',
    generatingAudio: 'Generowanie dźwięku...',
    analyzing: 'Analizowanie struktury PESEL...',
    applyChanges: 'Zastosuj Zmiany',
    noRecords: 'Nie znaleziono rekordów',
    addFirst: 'Dodaj pierwszą tożsamość, aby zacząć',
    footerStandard: 'Zgodność ze standardami',
    footerAi: 'Wsparcie AI',
    footerCentury: 'Wiele wieków',
    footerDesc: 'To narzędzie edukacyjne symuluje Polskie Numery Powszechnego Elektronicznego Systemu Ewidencji Ludności. Logika generowania jest zgodna z oficjalnym algorytmem wag 1-3-7-9. Funkcje AI wykorzystują Google Gemini.',
    recentRecord: 'Ostatni rekord to {name}, urodzony {dob}, z numerem PESEL {pesel}.',
    emptyDb: 'Twoja baza danych jest pusta. Możesz dodać osobę ręcznie lub użyć przycisku generowania grupowego.',
    totalSummary: 'Masz obecnie {count} tożsamości w bazie danych.'
  },
  ENG: {
    title: 'PESEL Master',
    subtitle: 'Polish Identity Number Management System',
    bulkGenerate: 'Bulk Generate',
    export: 'Export',
    manualEntry: 'Manual Entry',
    firstName: 'First Name',
    lastName: 'Last Name',
    dob: 'Birth Date',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    generateIdentity: 'Generate Identity',
    databaseOverview: 'Database Overview',
    totalRecords: 'Total Records',
    mfSplit: 'M / F Split',
    identities: 'Generated Identities',
    searchPlaceholder: 'Search name or PESEL...',
    tableIdentity: 'Identity',
    tableBirthData: 'Birth Data',
    tablePesel: 'PESEL',
    tableAccessibility: 'Accessibility',
    readOutLoud: 'Read out loud',
    explainStructure: 'Explain PESEL structure',
    a11yOptions: 'Accessibility Options',
    textSize: 'Text Size',
    defaultSize: 'Default',
    mediumSize: 'Medium',
    largeSize: 'Large',
    highContrast: 'High Contrast',
    highContrastDesc: 'Sharper colors & borders',
    reduceMotion: 'Reduce Motion',
    reduceMotionDesc: 'Disable animations',
    voiceAssistant: 'AI Voice Assistant',
    readSummary: 'Read Page Summary',
    generatingAudio: 'Generating Audio...',
    analyzing: 'Analyzing PESEL structure...',
    applyChanges: 'Apply Changes',
    noRecords: 'No records found',
    addFirst: 'Add a new identity to get started',
    footerStandard: 'Standard Compliant',
    footerAi: 'AI-Enhanced Readout',
    footerCentury: 'Multi-Century',
    footerDesc: 'This educational tool simulates Polish National Identification Numbers. All generation logic follows the official 1-3-7-9 weight algorithm. AI Features use Google Gemini.',
    recentRecord: 'The most recent record is for {name}, born on {dob}, with PESEL {pesel}.',
    emptyDb: 'Your identity database is currently empty. You can add a person manually or use the bulk generate button to start.',
    totalSummary: 'You currently have {count} identities in your database.'
  },
  UKR: {
    title: 'PESEL Майстер',
    subtitle: 'Система управління польськими ідентифікаційними номерами',
    bulkGenerate: 'Масове створення',
    export: 'Експорт',
    manualEntry: 'Ручне введення',
    firstName: "Ім'я",
    lastName: 'Прізвище',
    dob: 'Дата народження',
    gender: 'Стать',
    male: 'Чоловік',
    female: 'Жінка',
    generateIdentity: 'Створити особу',
    databaseOverview: 'Огляд бази даних',
    totalRecords: 'Всього записів',
    mfSplit: 'Ч / Ж Розподіл',
    identities: 'Створені особи',
    searchPlaceholder: 'Пошук за ім\'ям або PESEL...',
    tableIdentity: 'Особа',
    tableBirthData: 'Дані про народження',
    tablePesel: 'PESEL',
    tableAccessibility: 'Доступність',
    readOutLoud: 'Читати вголос',
    explainStructure: 'Пояснити структуру PESEL',
    a11yOptions: 'Налаштування доступності',
    textSize: 'Розмір тексту',
    defaultSize: 'Стандартний',
    mediumSize: 'Середній',
    largeSize: 'Великий',
    highContrast: 'Високий контраст',
    highContrastDesc: 'Чіткіші кольори та межі',
    reduceMotion: 'Менше анімації',
    reduceMotionDesc: 'Вимкнути анімацію',
    voiceAssistant: 'Голосовий помічник AI',
    readSummary: 'Прочитати огляд сторінки',
    generatingAudio: 'Генерація аудіо...',
    analyzing: 'Аналіз структури PESEL...',
    applyChanges: 'Застосувати зміни',
    noRecords: 'Записів не знайдено',
    addFirst: 'Додайте нову особу, щоб почати',
    footerStandard: 'Відповідність стандартам',
    footerAi: 'Підтримка AI',
    footerCentury: 'Мульти-століття',
    footerDesc: 'Цей освітній інструмент моделює польські національні ідентифікаційні номери. Логіка генерації відповідає офіційному алгоритму ваг 1-3-7-9. Функції AI використовують Google Gemini.',
    recentRecord: 'Останній запис — {name}, народився {dob}, номер PESEL {pesel}.',
    emptyDb: 'Ваша база даних наразі порожня. Ви можете додати особу вручну або скористатися кнопкою масового створення.',
    totalSummary: 'Наразі у вашій базі даних є {count} осіб.'
  }
};

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
  
  // Language State
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('pesel_lang') as Language) || 'PL');
  
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

  // Helper to get translated string
  const t = (key: keyof typeof TRANSLATIONS['PL']) => TRANSLATIONS[lang][key] || TRANSLATIONS['PL'][key];

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

  useEffect(() => {
    localStorage.setItem('pesel_lang', lang);
  }, [lang]);

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
      const prompt = `Translate to ${lang === 'UKR' ? 'Ukrainian' : lang === 'ENG' ? 'English' : 'Polish'} and read out the following identity details clearly: 
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
        ? t('totalSummary').replace('{count}', people.length.toString()) + " " + 
          t('recentRecord').replace('{name}', `${people[0].firstName} ${people[0].lastName}`).replace('{dob}', people[0].dob).replace('{pesel}', people[0].pesel.split('').join(' '))
        : t('emptyDb');

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Speak in ${lang === 'UKR' ? 'Ukrainian' : lang === 'ENG' ? 'English' : 'Polish'} as a helpful accessibility assistant: ${summaryText}` }] }],
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
      const prompt = `Explain the structure of this Polish PESEL number: ${person.pesel} in ${lang === 'UKR' ? 'Ukrainian' : lang === 'ENG' ? 'English' : 'Polish'}. 
      Break down the segments (YYMMDD ZZZ S Q) and what they signify for this specific individual born on ${person.dob}. 
      Be concise and helpful for someone using an accessibility tool. Use markdown.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setAiExplanation(response.text || "Error generating explanation.");
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
              <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            </div>
            <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('subtitle')}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Enhanced Language Switcher with Flags */}
            <div className={`flex items-center p-1 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
              {(['PL', 'ENG', 'UKR'] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all rounded-lg ${lang === l ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <span className="text-base leading-none" role="img" aria-label={l}>
                    {LANGUAGE_CONFIG[l].flag}
                  </span>
                  <span className="hidden sm:inline">{LANGUAGE_CONFIG[l].label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* AI Global Read Aloud Button */}
              <button 
                onClick={handleReadGlobalSummary}
                disabled={globalAudioLoading}
                className={`p-2 rounded-lg transition-all border flex items-center justify-center ${globalAudioLoading ? 'bg-indigo-100 dark:bg-indigo-900/50' : (isDarkMode ? 'bg-slate-800 border-slate-700 text-indigo-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-50')} shadow-sm`}
                title={t('readSummary')}
                aria-label={t('readSummary')}
              >
                {globalAudioLoading ? <Loader2 size={20} className="animate-spin text-indigo-500" /> : <Volume2 size={20} />}
              </button>

              {/* Accessibility Menu Trigger */}
              <button 
                onClick={() => setIsA11yMenuOpen(true)}
                className={`p-2 rounded-lg transition-colors border flex items-center justify-center ${isDarkMode ? 'bg-slate-800 border-slate-700 text-indigo-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-50'} shadow-sm`}
                title={t('a11yOptions')}
                aria-label={t('a11yOptions')}
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
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => generateRandom(10)}
                disabled={isAutoGenerating}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${isDarkMode ? 'bg-indigo-900/30 text-indigo-300 border-indigo-500/30 hover:bg-indigo-900/50' : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'}`}
              >
                <RefreshCw size={18} className={isAutoGenerating ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">{t('bulkGenerate')}</span>
              </button>
              <button 
                onClick={exportData}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border shadow-sm ${isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                <Download size={18} />
                <span className="hidden sm:inline">{t('export')}</span>
              </button>
            </div>
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
                  {t('manualEntry')}
                </h2>
              </div>
              <form onSubmit={handleAddPerson} className="p-6 space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t('firstName')}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      required
                      value={formData.firstName}
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-all outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'}`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t('lastName')}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      required
                      value={formData.lastName}
                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-all outline-none focus:ring-2 focus:ring-indigo-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'}`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t('dob')}</label>
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
                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t('gender')}</label>
                    <select 
                      value={formData.gender}
                      onChange={e => setFormData({...formData, gender: e.target.value as 'male' | 'female'})}
                      className={`w-full px-4 py-2 rounded-lg border transition-all outline-none focus:ring-2 focus:ring-indigo-500 appearance-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                    >
                      <option value="male">{t('male')}</option>
                      <option value="female">{t('female')}</option>
                    </select>
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center gap-2 mt-2"
                >
                  <CheckCircle2 size={18} />
                  {t('generateIdentity')}
                </button>
              </form>
            </div>

            {/* AI Explanation Detail Modal/Box */}
            {explainingId && (
              <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'} ${isHighContrast ? 'border-2' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                    <HelpCircle size={18} />
                    {t('voiceAssistant')}
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
                    {t('analyzing')}
                  </div>
                )}
              </div>
            )}

            {/* Stats Card */}
            <div className={`bg-indigo-600 dark:bg-indigo-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden ${isHighContrast ? 'border-2 border-white' : ''}`}>
              <div className="relative z-10">
                <h3 className="text-indigo-200 font-medium mb-4 flex items-center gap-2">
                  <Info size={18} />
                  {t('databaseOverview')}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <p className="text-xs text-indigo-200 uppercase tracking-wider mb-1">{t('totalRecords')}</p>
                    <p className="text-3xl font-bold">{people.length}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <p className="text-xs text-indigo-200 uppercase tracking-wider mb-1">{t('mfSplit')}</p>
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
                  {t('identities')}
                </h2>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder={t('searchPlaceholder')}
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
                        <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b ${isDarkMode ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-100'}`}>{t('tableIdentity')}</th>
                        <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b ${isDarkMode ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-100'}`}>{t('tableBirthData')}</th>
                        <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b ${isDarkMode ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-100'}`}>{t('tablePesel')}</th>
                        <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b text-right ${isDarkMode ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-100'}`}>{t('tableAccessibility')}</th>
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
                                <div className="text-xs text-slate-400 capitalize">{person.gender === 'male' ? t('male') : t('female')}</div>
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
                                title={t('readOutLoud')}
                                aria-label={`${t('readOutLoud')} ${person.firstName}`}
                              >
                                {audioLoadingId === person.id ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={16} />}
                              </button>
                              
                              {/* Explain Structure Button */}
                              <button 
                                onClick={() => handleExplainPESEL(person)}
                                className={`p-2 rounded-lg transition-all border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-emerald-400 hover:text-emerald-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-emerald-600 hover:bg-slate-50'} shadow-sm flex items-center justify-center`}
                                title={t('explainStructure')}
                                aria-label={t('explainStructure')}
                              >
                                <HelpCircle size={16} />
                              </button>

                              <button 
                                onClick={() => deletePerson(person.id)}
                                className="text-slate-400 hover:text-red-500 p-2 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Delete"
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
                    <p className="text-lg">{t('noRecords')}</p>
                    <p className="text-sm opacity-60">{t('addFirst')}</p>
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
                <h2 className="text-2xl font-bold">{t('a11yOptions')}</h2>
              </div>
              <button 
                onClick={() => setIsA11yMenuOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Voice Assistant Option */}
              <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-900/20">
                <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  <Volume2 size={18} />
                  {t('voiceAssistant')}
                </label>
                <button
                  onClick={handleReadGlobalSummary}
                  disabled={globalAudioLoading}
                  className={`w-full py-4 rounded-xl border-2 transition-all font-bold flex items-center justify-center gap-3 shadow-md ${globalAudioLoading ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                  {globalAudioLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      {t('generatingAudio')}
                    </>
                  ) : (
                    <>
                      <Play size={20} fill="currentColor" />
                      {t('readSummary')}
                    </>
                  )}
                </button>
              </div>

              {/* Font Scale */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                  <Type size={18} className="text-indigo-500" />
                  {t('textSize')}
                </label>
                <div className="flex gap-2">
                  {[1, 1.15, 1.3].map((scale) => (
                    <button
                      key={scale}
                      onClick={() => setFontScale(scale)}
                      className={`flex-1 py-3 rounded-xl border-2 transition-all font-bold ${fontScale === scale ? 'border-indigo-600 bg-indigo-600/10 text-indigo-600' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                    >
                      {scale === 1 ? t('defaultSize') : scale === 1.15 ? t('mediumSize') : t('largeSize')}
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
                    <p className="font-semibold">{t('highContrast')}</p>
                    <p className="text-xs text-slate-500">{t('highContrastDesc')}</p>
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
                    <p className="font-semibold">{t('reduceMotion')}</p>
                    <p className="text-xs text-slate-500">{t('reduceMotionDesc')}</p>
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
              {t('applyChanges')}
            </button>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <footer className={`max-w-6xl mx-auto mt-12 pb-8 text-center text-xs transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        <div className="flex items-center justify-center gap-4 mb-3">
          <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500" /> {t('footerStandard')}</span>
          <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500" /> {t('footerAi')}</span>
          <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500" /> {t('footerCentury')}</span>
        </div>
        <p className="max-w-xl mx-auto leading-relaxed">
          {t('footerDesc')}
        </p>
      </footer>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
