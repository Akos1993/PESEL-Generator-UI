
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  User, 
  Calendar, 
  Plus, 
  Trash2, 
  Download, 
  Search, 
  IdCard, 
  CheckCircle2, 
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
  Upload, 
  ShieldCheck, 
  AlertCircle, 
  FileText, 
  Clock, 
  Scan,
  Lock,
  Unlock,
  Settings,
  ArrowLeft,
  Database,
  ExternalLink,
  Fingerprint,
  CreditCard,
  Home
} from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Types & Constants
 */
type Language = 'PL' | 'ENG' | 'UKR';
type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';
type View = 'user' | 'login' | 'admin';

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: 'male' | 'female';
  pesel: string;
  createdAt: number;
  verificationStatus: VerificationStatus;
  verificationDetails?: string;
  idPhoto?: string;
}

const ADMIN_PASS = "admin123";
const LANGUAGE_CONFIG: Record<Language, { label: string; flag: string }> = {
  PL: { label: 'PL', flag: '🇵🇱' },
  ENG: { label: 'EN', flag: '🇬🇧' },
  UKR: { label: 'UA', flag: '🇺🇦' }
};

const TRANSLATIONS = {
  PL: {
    title: 'PESEL Master',
    subtitle: 'Generator Tożsamości i Weryfikacja',
    manualEntry: 'Nowy Wniosek',
    firstName: 'Imię',
    lastName: 'Nazwisko',
    dob: 'Data Urodzenia',
    gender: 'Płeć',
    male: 'Mężczyzna',
    female: 'Kobieta',
    generateIdentity: 'Generuj Tożsamość',
    activeIdentity: 'Twoja Tożsamość',
    verification: 'Weryfikacja',
    readOutLoud: 'Czytaj na głos',
    explainStructure: 'Struktura PESEL',
    a11yOptions: 'Dostępność',
    textSize: 'Rozmiar Tekstu',
    highContrast: 'Wysoki Kontrast',
    highContrastDesc: 'Ostrzejsze kolory',
    voiceAssistant: 'Asystent AI',
    readSummary: 'Czytaj Podsumowanie',
    analyzing: 'Analizowanie...',
    applyChanges: 'Zastosuj',
    noActiveRecord: 'Brak danych',
    searchPrompt: 'Wypełnij formularz obok, aby wygenerować PESEL. Wymagane: ID/Paszport, potwierdzenie zameldowania (>6 m-cy) oraz opłata 17 PLN.',
    footerStandard: 'Standard 1-3-7-9',
    footerAi: 'Vision AI Enabled',
    footerDesc: 'Generator jest zgodny ze standardem PESEL. Dane są przetwarzane lokalnie z wykorzystaniem AI do weryfikacji dokumentów.',
    verify: 'Wgraj i Sprawdź Dokumenty',
    docVerification: 'Weryfikacja Tożsamości',
    uploadId: 'Wybierz Pliki',
    idDesc: 'Wgraj dowód, paszport lub potwierdzenie zameldowania (>6 m-cy). Pamiętaj o opłacie 17 PLN.',
    statusPending: 'Oczekiwanie',
    statusVerified: 'Zweryfikowany',
    statusRejected: 'Odrzucony',
    aiChecking: 'AI analizuje dokumenty...',
    aiMatch: 'Dane zgodne',
    aiMismatch: 'Błąd! Wykryto: {name}',
    close: 'Zamknij',
    adminLogin: 'Panel Administratora',
    password: 'Hasło',
    login: 'Zaloguj',
    adminPanel: 'Baza Danych (Admin)',
    backToUser: 'Powrót do Generatora',
    exportDb: 'Eksportuj (.json)',
    totalRecords: 'Wszystkich rekordów',
    invalidPass: 'Błędne hasło',
    feeNotice: 'Opłata skarbowa: 17 PLN',
    docsRequired: 'Wymagane dokumenty'
  },
  ENG: {
    title: 'PESEL Master',
    subtitle: 'Identity Generator & Verification',
    manualEntry: 'New Application',
    firstName: 'First Name',
    lastName: 'Last Name',
    dob: 'Birth Date',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    generateIdentity: 'Generate Identity',
    activeIdentity: 'Your Identity',
    verification: 'Verification',
    readOutLoud: 'Read out loud',
    explainStructure: 'PESEL Structure',
    a11yOptions: 'Accessibility',
    textSize: 'Text Size',
    highContrast: 'High Contrast',
    highContrastDesc: 'Sharper colors',
    voiceAssistant: 'AI Assistant',
    readSummary: 'Read Summary',
    analyzing: 'Analyzing...',
    applyChanges: 'Apply',
    noActiveRecord: 'No data',
    searchPrompt: 'Fill the form on the left to generate a PESEL. Required: ID/Passport, proof of residence (>6 months), and a 17 PLN fee.',
    footerStandard: '1-3-7-9 Standard',
    footerAi: 'Vision AI Enabled',
    footerDesc: 'Generator follows the PESEL standard. Data is processed locally using AI for document verification.',
    verify: 'Upload & Verify Docs',
    docVerification: 'Identity Verification',
    uploadId: 'Select Files',
    idDesc: 'Upload ID, passport, or proof of residence (>6 months). Note the 17 PLN fee.',
    statusPending: 'Pending',
    statusVerified: 'Verified',
    statusRejected: 'Rejected',
    aiChecking: 'AI is inspecting...',
    aiMatch: 'Data matches',
    aiMismatch: 'Mismatch! Detected: {name}',
    close: 'Close',
    adminLogin: 'Admin Panel',
    password: 'Password',
    login: 'Login',
    adminPanel: 'Hidden Database (Admin)',
    backToUser: 'Back to Generator',
    exportDb: 'Export (.json)',
    totalRecords: 'Total Records',
    invalidPass: 'Invalid password',
    feeNotice: 'Service Fee: 17 PLN',
    docsRequired: 'Documents required'
  },
  UKR: {
    title: 'PESEL Майстер',
    subtitle: 'Генератор ідентифікації та перевірка',
    manualEntry: 'Нова заявка',
    firstName: "Ім'я",
    lastName: 'Прізвище',
    dob: 'Дата народження',
    gender: 'Стать',
    male: 'Чоловік',
    female: 'Жінка',
    generateIdentity: 'Створити особу',
    activeIdentity: 'Ваша особа',
    verification: 'Перевірка',
    readOutLoud: 'Читати вголос',
    explainStructure: 'Структура PESEL',
    a11yOptions: 'Доступність',
    textSize: 'Розмір тексту',
    highContrast: 'Високий контраст',
    highContrastDesc: 'Чіткіші кольори',
    voiceAssistant: 'AI Помічник',
    readSummary: 'Прочитати огляд',
    analyzing: 'Аналіз...',
    applyChanges: 'Застосувати',
    noActiveRecord: 'Немає даних',
    searchPrompt: 'Заповніть форму зліва, щоб згенерувати PESEL. Необхідно: ID/Паспорт, підтвердження проживання (>6 місяців) та збір 17 PLN.',
    footerStandard: 'Стандарт 1-3-7-9',
    footerAi: 'Vision AI Увімкнено',
    footerDesc: 'Генератор відповідає стандарту PESEL. Дані обробляються локально з використанням AI для перевірки документів.',
    verify: 'Завантажити та перевірити',
    docVerification: 'Перевірка особи',
    uploadId: 'Обрати файли',
    idDesc: 'Завантажте ID, паспорт або підтвердження проживання (>6 міс). Не забудьте про збір 17 PLN.',
    statusPending: 'Очікується',
    statusVerified: 'Підтверджено',
    statusRejected: 'Відхилено',
    aiChecking: 'AI перевіряє...',
    aiMatch: 'Дані збігаються',
    aiMismatch: 'Помилка! Виявлено: {name}',
    close: 'Закрити',
    adminLogin: 'Панель адміністратора',
    password: 'Пароль',
    login: 'Увійти',
    adminPanel: 'Приховата база (Admin)',
    backToUser: 'Назад до генератора',
    exportDb: 'Експорт (.json)',
    totalRecords: 'Всього записів',
    invalidPass: 'Невірний пароль',
    feeNotice: 'Збір: 17 PLN',
    docsRequired: 'Необхідні документи'
  }
};

/**
 * Helpers
 */
const decode = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
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
  const sexDigit = gender === 'male' ? [1, 3, 5, 7, 9][Math.floor(Math.random() * 5)] : [0, 2, 4, 6, 8][Math.floor(Math.random() * 5)];
  const base = `${yearPart}${monthPart}${dayPartStr}${zzz}${sexDigit}`;
  const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  let sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(base[i]) * weights[i];
  const checkDigit = (10 - (sum % 10)) % 10;
  return base + checkDigit.toString();
};

/**
 * Main App
 */
const App: React.FC = () => {
  const [view, setView] = useState<View>('user');
  const [people, setPeople] = useState<Person[]>([]);
  const [activePerson, setActivePerson] = useState<Person | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('pesel_theme') === 'dark');
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('pesel_lang') as Language) || 'PL');
  const [isA11yMenuOpen, setIsA11yMenuOpen] = useState(false);
  const [fontScale, setFontScale] = useState(() => Number(localStorage.getItem('pesel_font_scale')) || 1);
  const [isHighContrast, setIsHighContrast] = useState(() => localStorage.getItem('pesel_high_contrast') === 'true');
  const [formData, setFormData] = useState({ firstName: '', lastName: '', dob: '', gender: 'male' as 'male' | 'female' });
  const [adminPass, setAdminPass] = useState('');
  
  const [verificationModalPerson, setVerificationModalPerson] = useState<Person | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (key: keyof typeof TRANSLATIONS['PL']) => TRANSLATIONS[lang][key] || TRANSLATIONS['PL'][key];

  useEffect(() => {
    const saved = localStorage.getItem('pesel_vault_admin');
    if (saved) setPeople(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('pesel_vault_admin', JSON.stringify(people));
  }, [people]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('pesel_theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('pesel_lang', lang);
    localStorage.setItem('pesel_font_scale', fontScale.toString());
    localStorage.setItem('pesel_high_contrast', isHighContrast.toString());
  }, [isDarkMode, lang, fontScale, isHighContrast]);

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.dob) return;
    const newPerson: Person = {
      id: crypto.randomUUID(),
      ...formData,
      pesel: generatePESEL(new Date(formData.dob), formData.gender),
      createdAt: Date.now(),
      verificationStatus: 'none'
    };
    // Removed immediate addition to 'people' (the admin database)
    setActivePerson(newPerson);
    setFormData({ firstName: '', lastName: '', dob: '', gender: 'male' });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass === ADMIN_PASS) {
      setView('admin');
      setAdminPass('');
    } else alert(t('invalidPass'));
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(people, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pesel_vault_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleVerifyDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePerson) return;
    setIsVerifying(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: { parts: [ 
            { inlineData: { data: base64Data, mimeType: file.type } }, 
            { text: `Verify if this ID document or Proof of Residence belongs to: "${activePerson.firstName} ${activePerson.lastName}". Return JSON: { "isValidDoc": boolean, "nameOnDoc": string, "isMatch": boolean, "reason": string }` } 
          ] },
          config: { responseMimeType: "application/json" }
        });
        const result = JSON.parse(response.text || '{}');
        const status: VerificationStatus = result.isValidDoc && result.isMatch ? 'verified' : 'rejected';
        const updated = { ...activePerson, verificationStatus: status, verificationDetails: result.reason || (status === 'verified' ? t('aiMatch') : t('aiMismatch').replace('{name}', result.nameOnDoc || 'N/A')), idPhoto: reader.result as string };
        
        // Add to database ONLY after successful evaluation
        if (status === 'verified') {
           setPeople(prev => {
             // Avoid duplicates if user clicks verify again
             const exists = prev.some(p => p.pesel === updated.pesel);
             if (exists) return prev;
             return [updated, ...prev];
           });
        }
        
        setActivePerson(updated);
      } catch (err) { console.error(err); } finally { setIsVerifying(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleExplain = async (person: Person) => {
    setAiExplanation(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const res = await ai.models.generateContent({ 
        model: "gemini-3-flash-preview", 
        contents: `Explain Polish PESEL ${person.pesel} (birth ${person.dob}, gender ${person.gender}) in ${lang}. Markdown format.` 
      });
      setAiExplanation(res.text || "Error.");
    } catch { setAiExplanation("Error."); }
  };

  const dynamicStyles = { fontSize: `${fontScale}rem` };
  const highContrastClasses = isHighContrast ? (isDarkMode ? 'contrast-125 border-white shadow-none' : 'contrast-150 border-black shadow-none') : '';

  /**
   * ADMIN VIEW
   */
  if (view === 'admin') {
    return (
      <div className={`min-h-screen p-8 animate-in fade-in duration-500 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="max-w-6xl mx-auto">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black flex items-center gap-3"><Database className="text-indigo-500" /> {t('adminPanel')}</h1>
              <p className="opacity-60">{t('totalRecords')}: {people.length}</p>
            </div>
            <div className="flex gap-4">
              <button onClick={exportData} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all"><Download size={18} /> {t('exportDb')}</button>
              <button onClick={() => setView('user')} className="flex items-center gap-2 px-4 py-2 border rounded-lg font-bold hover:bg-white/10 transition-all"><ArrowLeft size={18} /> {t('backToUser')}</button>
            </div>
          </header>
          <div className={`rounded-2xl border overflow-hidden shadow-2xl ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <table className="w-full text-left">
              <thead className="bg-slate-500/10 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Identity</th>
                  <th className="px-6 py-4">PESEL</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-500/10">
                {people.length > 0 ? people.map(p => (
                  <tr key={p.id} className="hover:bg-indigo-500/5 transition-colors">
                    <td className="px-6 py-4 font-bold">{p.firstName} {p.lastName} <span className="opacity-40 font-normal ml-2">{p.dob}</span></td>
                    <td className="px-6 py-4"><code className="bg-indigo-500/10 px-2 py-1 rounded text-indigo-500 font-bold">{p.pesel}</code></td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${p.verificationStatus === 'verified' ? 'bg-green-500 text-white' : p.verificationStatus === 'rejected' ? 'bg-red-500 text-white' : 'bg-slate-500/10 text-slate-500'}`}>
                        {p.verificationStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right opacity-40 text-xs">{new Date(p.createdAt).toLocaleString()}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center opacity-40 font-bold uppercase tracking-widest italic">Database is empty</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  /**
   * LOGIN VIEW
   */
  if (view === 'login') {
    return (
      <div className={`min-h-screen flex items-center justify-center p-8 animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
        <div className={`w-full max-w-md p-10 rounded-[2.5rem] border shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex flex-col items-center mb-8">
            <div className="bg-indigo-600 p-5 rounded-[1.5rem] text-white mb-6 shadow-2xl shadow-indigo-500/30 animate-bounce"><Lock size={40} /></div>
            <h2 className="text-3xl font-black tracking-tighter">{t('adminLogin')}</h2>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase opacity-50 block mb-2 tracking-widest">{t('password')}</label>
              <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} className={`w-full px-5 py-4 rounded-2xl border outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} autoFocus />
            </div>
            <button className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs">{t('login')}</button>
            <button type="button" onClick={() => setView('user')} className="w-full text-xs font-bold opacity-40 hover:opacity-100 transition-opacity uppercase tracking-widest">{t('backToUser')}</button>
          </form>
        </div>
      </div>
    );
  }

  /**
   * USER VIEW
   */
  return (
    <div style={dynamicStyles} className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} p-4 md:p-8`}>
      <div className={`max-w-6xl mx-auto ${highContrastClasses}`}>
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-indigo-600 p-4 rounded-3xl text-white shadow-2xl shadow-indigo-500/30"><IdCard size={36} /></div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter">{t('title')}</h1>
              <p className="opacity-40 text-xs font-black uppercase tracking-[0.3em] mt-1">{t('subtitle')}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className={`flex items-center p-1.5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} shadow-inner`}>
              {(['PL', 'ENG', 'UKR'] as Language[]).map(l => (
                <button key={l} onClick={() => setLang(l)} className={`flex items-center gap-2 px-5 py-2 text-xs font-black transition-all rounded-xl ${lang === l ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'opacity-40 hover:opacity-100'}`}>
                  <span>{LANGUAGE_CONFIG[l].flag}</span> {LANGUAGE_CONFIG[l].label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsA11yMenuOpen(true)} className="p-3.5 rounded-2xl border hover:bg-white/10 transition-colors" title={t('a11yOptions')}><Accessibility size={24} /></button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3.5 rounded-2xl border hover:bg-white/10 transition-colors">{isDarkMode ? <Sun size={24} /> : <Moon size={24} />}</button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Generator Form */}
          <div className="lg:col-span-4 space-y-8">
            <div className={`rounded-[2.5rem] shadow-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="border-b px-10 py-6 flex items-center gap-3 font-black uppercase text-[10px] tracking-[0.2em] opacity-50"><Plus size={16} />{t('manualEntry')}</div>
              <form onSubmit={handleAddPerson} className="p-10 space-y-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase opacity-40 block mb-2 tracking-widest">{t('firstName')}</label>
                    <input type="text" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className={`w-full px-5 py-3.5 rounded-2xl border outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase opacity-40 block mb-2 tracking-widest">{t('lastName')}</label>
                    <input type="text" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className={`w-full px-5 py-3.5 rounded-2xl border outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase opacity-40 block mb-2 tracking-widest">{t('dob')}</label>
                    <input type="date" required value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className={`w-full px-5 py-3.5 rounded-2xl border outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase opacity-40 block mb-2 tracking-widest">{t('gender')}</label>
                    <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as 'male' | 'female'})} className={`w-full px-5 py-3.5 rounded-2xl border outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}>
                      <option value="male">{t('male')}</option>
                      <option value="female">{t('female')}</option>
                    </select>
                  </div>
                </div>

                {/* Requirement Alerts */}
                <div className="space-y-3">
                  <div className={`p-4 rounded-2xl flex items-start gap-3 text-[10px] font-black uppercase tracking-widest shadow-sm ${isDarkMode ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                    <CreditCard size={18} className="shrink-0" />
                    <div>
                      <p className="opacity-60">{t('feeNotice')}</p>
                    </div>
                  </div>
                  <div className={`p-4 rounded-2xl flex items-start gap-3 text-[10px] font-black uppercase tracking-widest shadow-sm ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                    <Home size={18} className="shrink-0" />
                    <div>
                      <p className="opacity-60">{t('docsRequired')}: ID/Pass + Zameldowanie</p>
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full bg-indigo-600 text-white font-black py-5 rounded-[1.5rem] hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-500/30 uppercase tracking-[0.2em] text-[10px]">
                  {t('generateIdentity')}
                </button>
              </form>
            </div>
          </div>

          {/* Result / Active Identity View */}
          <div className="lg:col-span-8">
            {activePerson ? (
              <div className={`rounded-[3rem] shadow-2xl border overflow-hidden animate-in zoom-in-95 duration-500 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="p-10 md:p-14">
                  <div className="flex flex-col md:flex-row gap-14 items-start">
                    <div className={`w-44 h-44 rounded-[3rem] flex items-center justify-center text-6xl font-black shadow-2xl ring-8 ring-offset-4 ${isDarkMode ? 'ring-slate-800 ring-offset-slate-900' : 'ring-slate-100 ring-offset-white'} ${activePerson.gender === 'male' ? 'bg-blue-600 text-white' : 'bg-pink-600 text-white'}`}>
                      {activePerson.firstName[0]}{activePerson.lastName[0]}
                    </div>
                    <div className="flex-1 space-y-8 w-full">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-5xl font-black tracking-tighter leading-tight">{activePerson.firstName} {activePerson.lastName}</h2>
                          <div className="flex gap-6 mt-3 font-black uppercase text-[11px] tracking-widest opacity-40">
                            <span className="flex items-center gap-2"><User size={14} /> {activePerson.gender === 'male' ? t('male') : t('female')}</span>
                            <span className="flex items-center gap-2"><Calendar size={14} /> {activePerson.dob}</span>
                          </div>
                        </div>
                        <div className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl ${
                          activePerson.verificationStatus === 'verified' ? 'bg-green-500 text-white shadow-green-500/20' :
                          activePerson.verificationStatus === 'rejected' ? 'bg-red-500 text-white shadow-red-500/20' :
                          'bg-indigo-500/10 text-indigo-500'
                        }`}>
                          {activePerson.verificationStatus === 'verified' ? <ShieldCheck size={18} /> : activePerson.verificationStatus === 'rejected' ? <AlertCircle size={18} /> : <Clock size={18} />}
                          {activePerson.verificationStatus === 'none' ? t('statusPending') : activePerson.verificationStatus === 'verified' ? t('statusVerified') : t('statusRejected')}
                        </div>
                      </div>

                      <div className={`p-8 rounded-[2rem] border flex items-center justify-between group cursor-help transition-all hover:scale-[1.02] shadow-sm ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`} onClick={() => handleExplain(activePerson)}>
                        <div>
                          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-3">PESEL Identity Number</p>
                          <code className="text-5xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400">{activePerson.pesel}</code>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-700"><HelpCircle size={40} className="text-indigo-500" /></div>
                      </div>

                      <div className="flex flex-wrap gap-5">
                        <button onClick={() => setVerificationModalPerson(activePerson)} className="flex-1 min-w-[280px] flex items-center justify-center gap-4 py-5 rounded-[1.5rem] bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-500/40 uppercase text-[11px] tracking-[0.2em]">
                          <Scan size={24} /> {t('verify')}
                        </button>
                        <button onClick={() => setActivePerson(null)} className="p-5 rounded-[1.5rem] border hover:bg-red-500/10 hover:text-red-500 transition-all hover:scale-105 active:scale-95"><Trash2 size={28} /></button>
                      </div>
                    </div>
                  </div>

                  {aiExplanation && (
                    <div className="mt-14 p-10 rounded-[2.5rem] bg-indigo-500/5 border border-indigo-500/10 animate-in slide-in-from-bottom-8 duration-700">
                      <div className="text-base prose dark:prose-invert max-w-none prose-indigo prose-p:leading-relaxed prose-strong:text-indigo-500">
                        {aiExplanation.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={`h-full flex flex-col items-center justify-center text-center p-24 rounded-[4rem] border-4 border-dashed animate-in fade-in duration-700 ${isDarkMode ? 'border-slate-800 bg-slate-900/20' : 'border-slate-100 bg-slate-50/50'}`}>
                <div className="bg-indigo-500/10 p-10 rounded-[2.5rem] mb-10 ring-1 ring-indigo-500/20"><Fingerprint size={100} className="text-indigo-500 opacity-20" strokeWidth={1} /></div>
                <h3 className="text-3xl font-black mb-4 tracking-tighter">{t('noActiveRecord')}</h3>
                <p className="max-w-md text-sm opacity-40 leading-relaxed font-bold tracking-tight whitespace-pre-line">{t('searchPrompt')}</p>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-24 py-16 border-t border-slate-500/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 opacity-40 text-[10px] font-black uppercase tracking-[0.3em]">
            <div className="flex gap-10"><span>{t('footerStandard')}</span><span>{t('footerAi')}</span></div>
            <p className="max-w-lg text-center normal-case font-medium leading-relaxed tracking-normal text-[11px]">{t('footerDesc')}</p>
            <button onClick={() => setView('login')} className="flex items-center gap-2.5 hover:text-indigo-500 transition-colors py-2 px-4 rounded-xl hover:bg-indigo-500/5"><Lock size={14} /> {t('adminLogin')}</button>
          </div>
        </footer>
      </div>

      {/* Verification Modal */}
      {verificationModalPerson && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className={`w-full max-w-3xl rounded-[3rem] shadow-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="p-10 border-b flex items-center justify-between bg-slate-500/5">
              <h2 className="text-3xl font-black flex items-center gap-4 tracking-tighter"><ShieldCheck className="text-indigo-500" /> {t('docVerification')}</h2>
              <button onClick={() => setVerificationModalPerson(null)} className="p-4 hover:bg-slate-500/10 rounded-full transition-all"><X size={28} /></button>
            </div>
            <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="space-y-8">
                <div className={`relative h-64 rounded-[2rem] border-4 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all group ${isDarkMode ? 'border-slate-700 bg-slate-800 hover:border-indigo-500/40' : 'border-slate-200 bg-slate-50 hover:border-indigo-500/40'}`}>
                  {activePerson?.idPhoto ? <img src={activePerson.idPhoto} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110" /> : <div className="text-center"><FileText size={64} className="mx-auto mb-6 opacity-10" /><p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">{t('uploadId')}</p></div>}
                  {!activePerson?.idPhoto && <input type="file" ref={fileInputRef} onChange={handleVerifyDocument} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />}
                </div>
                <button onClick={() => fileInputRef.current?.click()} disabled={isVerifying} className="w-full py-5 rounded-2xl bg-indigo-600 text-white font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl shadow-indigo-500/40 disabled:opacity-50 hover:bg-indigo-700 active:scale-95 transition-all">
                  {isVerifying ? <Loader2 className="animate-spin mx-auto" size={24} /> : t('uploadId')}
                </button>
              </div>
              <div className="flex flex-col justify-center space-y-8">
                <div className={`p-8 rounded-[2rem] border flex flex-col items-center justify-center min-h-[220px] transition-all shadow-sm ${activePerson?.verificationStatus === 'verified' ? 'bg-green-500/10 border-green-500/40 text-green-600' : activePerson?.verificationStatus === 'rejected' ? 'bg-red-500/10 border-red-500/40 text-red-600' : 'bg-slate-500/5 opacity-40'}`}>
                  {isVerifying ? (
                    <div className="text-center">
                      <Loader2 size={48} className="animate-spin mx-auto mb-6 text-indigo-500" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">{t('aiChecking')}</p>
                    </div>
                  ) : (
                    <>
                      {activePerson?.verificationStatus === 'none' && <Clock size={64} className="mb-6" />}
                      {activePerson?.verificationStatus === 'verified' && <ShieldCheck size={80} className="mb-6" />}
                      {activePerson?.verificationStatus === 'rejected' && <AlertCircle size={80} className="mb-6" />}
                      <p className="font-black uppercase text-base tracking-[0.3em]">{activePerson?.verificationStatus === 'none' ? t('statusPending') : activePerson?.verificationStatus === 'verified' ? t('statusVerified') : t('statusRejected')}</p>
                    </>
                  )}
                </div>
                {activePerson?.verificationDetails && <div className="text-xs text-center opacity-70 leading-relaxed font-black italic p-4 rounded-2xl bg-slate-500/5 ring-1 ring-slate-500/5">{activePerson.verificationDetails}</div>}
                
                {/* Secondary Requirement Notice */}
                <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10">
                   <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                     <AlertCircle size={14} /> {t('idDesc')}
                   </p>
                </div>
              </div>
            </div>
            <div className="p-10 bg-slate-500/5 text-right"><button onClick={() => setVerificationModalPerson(null)} className="px-14 py-4 rounded-2xl font-black border uppercase text-[11px] tracking-[0.3em] hover:bg-white/10 transition-all">{t('close')}</button></div>
          </div>
        </div>
      )}

      {/* A11y Modal */}
      {isA11yMenuOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in zoom-in-95 duration-200">
          <div className={`w-full max-w-lg p-12 rounded-[3.5rem] border shadow-2xl ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-black flex items-center gap-4 tracking-tighter"><Accessibility className="text-indigo-500" /> {t('a11yOptions')}</h2>
              <button onClick={() => setIsA11yMenuOpen(false)} className="p-3 hover:bg-slate-500/10 rounded-full"><X size={24} /></button>
            </div>
            <div className="space-y-10">
              <div>
                <label className="text-[11px] font-black uppercase opacity-40 mb-5 block tracking-[0.2em]">{t('textSize')}</label>
                <div className="flex gap-4">
                  {[1, 1.15, 1.3].map(s => (
                    <button key={s} onClick={() => setFontScale(s)} className={`flex-1 py-5 rounded-[1.5rem] border-2 font-black transition-all ${fontScale === s ? 'border-indigo-600 bg-indigo-500/10 text-indigo-600 scale-105 shadow-xl' : 'border-slate-500/10 hover:border-slate-500/30'}`}>
                      {s === 1 ? 'A' : s === 1.15 ? 'A+' : 'A++'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-7 rounded-[2.5rem] border border-slate-500/10 bg-slate-500/5">
                <div>
                  <p className="font-black uppercase text-xs tracking-[0.2em]">{t('highContrast')}</p>
                  <p className="text-[10px] opacity-40 font-bold mt-1 tracking-tight">{t('highContrastDesc')}</p>
                </div>
                <button onClick={() => setIsHighContrast(!isHighContrast)} className={`w-16 h-9 rounded-full relative transition-all duration-300 ring-4 ring-white/10 ${isHighContrast ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`absolute top-1 w-7 h-7 bg-white rounded-full transition-all duration-300 shadow-xl ${isHighContrast ? 'left-8' : 'left-1'}`} />
                </button>
              </div>
            </div>
            <button onClick={() => setIsA11yMenuOpen(false)} className="w-full mt-12 bg-indigo-600 text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-indigo-500/40 uppercase tracking-[0.4em] text-xs hover:bg-indigo-700 active:scale-[0.98] transition-all">
              {t('applyChanges')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
