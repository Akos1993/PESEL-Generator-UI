import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, IdCard, CheckCircle2, Sun, Moon, Volume2,
  Loader2, HelpCircle, Accessibility, Upload, ShieldCheck,
  Clock, Lock, Database, Shield, Wallet,
} from 'lucide-react';

import { Language, Person, View, DbStatus } from './types';
import { ADMIN_PASS, LANGUAGE_CONFIG, TRANSLATIONS, TranslationKey } from './constants';
import { generatePESEL, getPeselExplanation } from './utils';
import { dbHealth, dbFetchPeople, dbSyncPerson, dbDeletePerson, dbClearAll, dbUploadDocument } from './db';

import FormField      from './FormField';
import PaymentModal   from './PaymentModal';
import AdminView      from './AdminView';
import ReviewView     from './ReviewView';
import LoginView      from './LoginView';
import A11yModal      from './A11yModal';
import PeselModal     from './PeselModal';

// ─── DbDot ─── (defined here once, outside the render loop)
const DbDot: React.FC<{ status: DbStatus }> = ({ status }) => (
  <span className={`w-2 h-2 rounded-full inline-block ${
    status === 'connected'  ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse' :
    status === 'connecting' ? 'bg-amber-500 animate-pulse' :
    'bg-rose-500'
  }`} />
);

// ─── App ──────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  // ── Navigation ────────────────────────────────────────────────────────────
  const [view, setView] = useState<View>('user');

  // ── People / DB ───────────────────────────────────────────────────────────
  const [people, setPeople]                         = useState<Person[]>([]);
  const [activePerson, setActivePerson]             = useState<Person | null>(null);
  const [submittedApplication, setSubmittedApplication] = useState<Person | null>(null);
  const [dbStatus, setDbStatus]                     = useState<DbStatus>('connecting');
  const [dbMessage, setDbMessage]                   = useState('');

  // ── UI preferences ────────────────────────────────────────────────────────
  const [isDarkMode, setIsDarkMode]       = useState(() => localStorage.getItem('pesel_theme') === 'dark');
  const [lang, setLang]                   = useState<Language>(() => (localStorage.getItem('pesel_lang') as Language) || 'PL');
  const [fontScale, setFontScale]         = useState(() => Number(localStorage.getItem('pesel_font_scale')) || 1);
  const [isHighContrast, setIsHighContrast] = useState(() => localStorage.getItem('pesel_high_contrast') === 'true');
  const [isA11yOpen, setIsA11yOpen]       = useState(false);

  // ── Form ──────────────────────────────────────────────────────────────────
  const [wizardStep, setWizardStep] = useState(1);
  const [formData, setFormData] = useState({
    // ── Step 1: Applicant Info ──────────────────────────────────────────────
    applicantFirstName: '',
    applicantLastName: '',
    applicantStreet: '',
    applicantHouseNumber: '',
    applicantApartmentNumber: '',
    applicantPostalCode: '',
    applicantCity: '',
    // ── Step 2: Person Info ─────────────────────────────────────────────────
    firstName: '',
    lastName: '',
    secondName: '',
    otherNames: '',
    maidenName: '',
    dob: '',
    gender: 'male' as 'male' | 'female',
    birthPlace: '',
    countryOfBirth: '',
    countryOfResidence: '',
    nationality: '',
    citizenshipStatus: 'polish' as 'polish' | 'stateless' | 'other',
    // Family info (Step 2, required)
    fatherFirstName: '',
    fatherMaidenName: '',
    motherFirstName: '',
    motherMaidenName: '',
    civRegistryOffice: '',
    // ── Step 3: Documents & Marital Status ──────────────────────────────────
    idSeriesNumber: '',
    idValidityDate: '',
    idIssuingAuthority: '',
    passportSeriesNumber: '',
    passportValidityDate: '',
    otherDocSeriesNumber: '',
    otherDocValidityDate: '',
    maritalStatus: 'single' as 'single' | 'married' | 'divorced' | 'widow' | 'widower',
    spouseFirstName: '',
    spouseMaidenName: '',
    spousePesel: '',
    notificationMethod: 'paper' as 'paper' | 'electronic',
    emailAddress: '',
    epuapAddress: '',
  });
  const [adminPass, setAdminPass] = useState('');

  // ── Verification ──────────────────────────────────────────────────────────
  const [isVerifying, setIsVerifying]         = useState(false);
  const [aiExplanation, setAiExplanation]     = useState<string | null>(null);
  const fileInputRef                          = useRef<HTMLInputElement>(null);

  // ── Payment modal ─────────────────────────────────────────────────────────
  const [paymentOpen, setPaymentOpen] = useState(false);

  // ── TTS / Dictation ───────────────────────────────────────────────────────
  const [audioLoadingId, setAudioLoadingId]   = useState<string | null>(null);
  const [dictatingField, setDictatingField]   = useState<string | null>(null);

  // ── Translation helper ────────────────────────────────────────────────────
  const t = (key: TranslationKey): string =>
    TRANSLATIONS[lang][key] ?? TRANSLATIONS.PL[key];

  // ── Persist settings ──────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('pesel_theme',        isDarkMode ? 'dark' : 'light');
    localStorage.setItem('pesel_lang',         lang);
    localStorage.setItem('pesel_font_scale',   fontScale.toString());
    localStorage.setItem('pesel_high_contrast', isHighContrast.toString());
  }, [isDarkMode, lang, fontScale, isHighContrast]);

  // ── DB initialisation ─────────────────────────────────────────────────────
  useEffect(() => {
    // Health check
    dbHealth()
      .then(({ status, message }) => {
        setDbStatus(status);
        setDbMessage(message);
      })
      .catch((_e: unknown) => {
        setDbStatus('disconnected');
        setDbMessage('Could not reach Supabase.');
      });

    // Fetch initial data
    dbFetchPeople()
      .then((data) => {
        if (data.length > 0) {
          setPeople(data);
        } else {
          const cached = localStorage.getItem('pesel_vault_admin');
          if (cached) setPeople(JSON.parse(cached) as Person[]);
        }
      })
      .catch((_e: unknown) => {
        const cached = localStorage.getItem('pesel_vault_admin');
        if (cached) setPeople(JSON.parse(cached) as Person[]);
      });
  }, []);

  // Sync people to localStorage as fallback cache
  useEffect(() => {
    localStorage.setItem('pesel_vault_admin', JSON.stringify(people));
  }, [people]);

  // ── API helpers ───────────────────────────────────────────────────────────
  const syncPerson = async (person: Person): Promise<void> => {
    try {
      await dbSyncPerson(person);
    } catch (_e: unknown) {
      console.warn('Could not sync to Supabase:', _e);
    }
  };

  // ── TTS ───────────────────────────────────────────────────────────────────
  const handleTTS = (text: string, id = 'tts'): void => {
    if (!('speechSynthesis' in window)) return;
    if (audioLoadingId === id) {
      window.speechSynthesis.cancel();
      setAudioLoadingId(null);
      return;
    }
    setAudioLoadingId(id);
    const utterance     = new SpeechSynthesisUtterance(text);
    utterance.lang      = lang === 'PL' ? 'pl-PL' : lang === 'UKR' ? 'uk-UA' : 'en-US';
    const clearLoading  = (): void => setAudioLoadingId(null);
    utterance.onend     = clearLoading;
    utterance.onerror   = clearLoading;
    window.speechSynthesis.speak(utterance);
  };

  const handleReadAloudIdentity = (p: Person): void => {
    const text =
      lang === 'PL'
        ? `Tożsamość: ${p.firstName} ${p.lastName}. Obywatelstwo: ${p.nationality}. Urodzony: ${p.dob}. PESEL: ${p.pesel}.`
        : lang === 'UKR'
          ? `Особа: ${p.firstName} ${p.lastName}. Громадянство: ${p.nationality}. Народжений: ${p.dob}. PESEL: ${p.pesel}.`
          : `Identity: ${p.firstName} ${p.lastName}. Nationality: ${p.nationality}. Born: ${p.dob}. PESEL: ${p.pesel}.`;
    handleTTS(text, 'identity');
  };

  // ── Dictation ─────────────────────────────────────────────────────────────
  const handleDictate = (field: keyof typeof formData): void => {
    if (dictatingField) return;
    const SR =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SR) { alert('Speech recognition not supported.'); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recogniser = new (SR as any)();
    recogniser.lang            = lang === 'UKR' ? 'uk-UA' : lang === 'PL' ? 'pl-PL' : 'en-US';
    recogniser.interimResults  = false;
    recogniser.maxAlternatives = 1;
    recogniser.onstart         = (): void => setDictatingField(field);
    recogniser.onend           = (): void => setDictatingField(null);
    recogniser.onerror         = (): void => setDictatingField(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recogniser.onresult = (e: any): void => {
      const transcript = String(e.results[0][0].transcript);   // ← renamed from `t` to avoid shadowing
      if (field === 'gender') {
        const lower = transcript.toLowerCase();
        setFormData((prev) => ({
          ...prev,
          gender: lower.includes('m') || lower.includes('ч') ? 'male' : 'female',
        }));
      } else {
        setFormData((prev) => ({ ...prev, [field]: transcript }));
      }
    };
    recogniser.start();
  };

  // ── Form submission ───────────────────────────────────────────────────────
  const handleAddPerson = (e: React.FormEvent): void => {
    e.preventDefault();
    const {
      // Applicant
      applicantFirstName, applicantLastName, applicantStreet, applicantHouseNumber,
      applicantPostalCode, applicantCity,
      // Person
      firstName, lastName, dob, nationality, gender, citizenshipStatus,
      // Family
      fatherFirstName, fatherMaidenName, motherFirstName, motherMaidenName,
      // Notification
      notificationMethod, emailAddress, epuapAddress,
    } = formData;

    // Validate required fields from all steps
    if (!applicantFirstName || !applicantLastName || !applicantStreet ||
        !applicantHouseNumber || !applicantPostalCode || !applicantCity ||
        !firstName || !lastName || !dob || !nationality ||
        !fatherFirstName || !fatherMaidenName || !motherFirstName || !motherMaidenName ||
        !notificationMethod || (notificationMethod === 'electronic' && !emailAddress && !epuapAddress)) {
      alert('Please fill in all required fields');
      return;
    }

    const newPerson: Person = {
      id:                 crypto.randomUUID(),
      // Basic person info
      firstName,
      lastName,
      dob,
      gender,
      nationality,
      // Applicant
      applicantFirstName,
      applicantLastName,
      applicantStreet,
      applicantHouseNumber,
      applicantApartmentNumber: formData.applicantApartmentNumber,
      applicantPostalCode,
      applicantCity,
      // Additional person info
      secondName: formData.secondName,
      otherNames: formData.otherNames,
      maidenName: formData.maidenName,
      birthPlace: formData.birthPlace,
      countryOfBirth: formData.countryOfBirth,
      countryOfResidence: formData.countryOfResidence,
      citizenshipStatus,
      // Family
      fatherFirstName,
      fatherMaidenName,
      motherFirstName,
      motherMaidenName,
      civRegistryOffice: formData.civRegistryOffice,
      // Documents
      idSeriesNumber: formData.idSeriesNumber,
      idValidityDate: formData.idValidityDate,
      idIssuingAuthority: formData.idIssuingAuthority,
      passportSeriesNumber: formData.passportSeriesNumber,
      passportValidityDate: formData.passportValidityDate,
      otherDocSeriesNumber: formData.otherDocSeriesNumber,
      otherDocValidityDate: formData.otherDocValidityDate,
      // Marital status
      maritalStatus: formData.maritalStatus,
      spouseFirstName: formData.spouseFirstName,
      spouseMaidenName: formData.spouseMaidenName,
      spousePesel: formData.spousePesel,
      // Notification
      notificationMethod,
      emailAddress,
      epuapAddress,
      // System
      pesel:              generatePESEL(new Date(dob), gender),
      createdAt:          Date.now(),
      verificationStatus: 'none',
      paymentStatus:      'unpaid',
    };

    setActivePerson(newPerson);
    setSubmittedApplication(null);
    // Reset form and wizard
    setWizardStep(1);
    setFormData({
      applicantFirstName: '', applicantLastName: '', applicantStreet: '',
      applicantHouseNumber: '', applicantApartmentNumber: '', applicantPostalCode: '', applicantCity: '',
      firstName: '', lastName: '', secondName: '', otherNames: '', maidenName: '',
      dob: '', gender: 'male', birthPlace: '', countryOfBirth: '', countryOfResidence: '',
      nationality: '', citizenshipStatus: 'polish',
      fatherFirstName: '', fatherMaidenName: '', motherFirstName: '', motherMaidenName: '', civRegistryOffice: '',
      idSeriesNumber: '', idValidityDate: '', idIssuingAuthority: '',
      passportSeriesNumber: '', passportValidityDate: '',
      otherDocSeriesNumber: '', otherDocValidityDate: '',
      maritalStatus: 'single', spouseFirstName: '', spouseMaidenName: '', spousePesel: '',
      notificationMethod: 'paper', emailAddress: '', epuapAddress: '',
    });
    // Stage 1 — persist the record immediately so it appears in the admin DB
    void syncPerson(newPerson);
  };

  // ── Document verification (upload → pending → under review) ───────────────
  const handleVerifyDocument = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file || !activePerson) return;
    setIsVerifying(true);

    const feedback =
      lang === 'PL'
        ? `Dokumenty przesłane pomyślnie. Wniosek weryfikowany dla: ${activePerson.firstName} ${activePerson.lastName}.`
        : lang === 'UKR'
          ? `Документи завантажені. Заявку верифікується для: ${activePerson.firstName} ${activePerson.lastName}.`
          : `Documents uploaded. Application under review for: ${activePerson.firstName} ${activePerson.lastName}.`;

    // Stage 3 — upload file to Supabase Storage bucket, then persist the record
    void (async () => {
      try {
        const photoUrl = await dbUploadDocument(file, activePerson.pesel);

        const updated: Person = {
          ...activePerson,
          verificationStatus: 'pending',
          verificationDetails: feedback,
          idPhoto: photoUrl,   // public URL, not base64
        };

        setPeople((prev) => {
          const idx = prev.findIndex((p) => p.pesel === updated.pesel);
          if (idx >= 0) { const arr = [...prev]; arr[idx] = updated; return arr; }
          return [updated, ...prev];
        });

        await dbSyncPerson(updated);
        setSubmittedApplication(updated);
        setActivePerson(null);
      } catch (err: unknown) {
        console.error('Document upload failed:', err);
        // Show error in UI so the user knows something went wrong
        alert(
          err instanceof Error
            ? `Upload failed: ${err.message}`
            : 'Upload failed — check the browser console for details.',
        );
      } finally {
        setIsVerifying(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    })();
  };

  // ── Payment callback ──────────────────────────────────────────────────────
  const handlePaymentComplete = (_txId: string): void => {
    setActivePerson((prev) => {
      if (!prev) return null;
      const updated: Person = { ...prev, paymentStatus: 'paid' };
      // Stage 2 — persist payment status
      void syncPerson(updated);
      return updated;
    });
  };

  // ── Admin actions ─────────────────────────────────────────────────────────
  const handleDeletePerson = async (id: string): Promise<void> => {
    if (!confirm('Permanently delete this record?')) return;
    try { await dbDeletePerson(id); } catch (_e: unknown) { /* intentional */ }
    setPeople((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearDatabase = async (): Promise<void> => {
    if (!confirm('Delete ALL records from the database and local cache?')) return;
    try { await dbClearAll(); } catch (_e: unknown) { /* intentional */ }
    setPeople([]);
    localStorage.removeItem('pesel_vault_admin');
  };

  // ── Document review (human verification decision) ────────────────────────
  const handleReviewDecision = async (id: string, decision: 'verified' | 'rejected'): Promise<void> => {
    const person = people.find((p) => p.id === id);
    if (!person) return;
    const updated: Person = { ...person, verificationStatus: decision };
    setPeople((prev) => prev.map((p) => (p.id === id ? updated : p)));
    await syncPerson(updated);
  };

  const handleLogin = (e: React.FormEvent): void => {
    e.preventDefault();
    if (adminPass === ADMIN_PASS) { setView('admin'); setAdminPass(''); }
    else alert(t('invalidPass'));
  };

  const exportData = (): void => {
    const blob = new Blob([JSON.stringify(people, null, 2)], { type: 'application/json' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `pesel_export_${new Date().toISOString().split('T')[0]}.json`;
    anchor.click();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (view === 'admin') {
    return (
      <AdminView
        people={people}
        isDarkMode={isDarkMode}
        dbStatus={dbStatus}
        dbMessage={dbMessage}
        t={t}
        onDeletePerson={(id) => void handleDeletePerson(id)}
        onClearDatabase={() => void handleClearDatabase()}
        onExport={exportData}
        onOpenReview={() => setView('review')}
        onBack={() => setView('user')}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REVIEW VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (view === 'review') {
    return (
      <ReviewView
        people={people}
        isDarkMode={isDarkMode}
        t={t}
        onApprove={(id) => void handleReviewDecision(id, 'verified')}
        onReject={(id) => void handleReviewDecision(id, 'rejected')}
        onBack={() => setView('admin')}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOGIN VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (view === 'login') {
    return (
      <LoginView
        isDarkMode={isDarkMode}
        t={t}
        adminPass={adminPass}
        setAdminPass={setAdminPass}
        onLogin={handleLogin}
        onBack={() => setView('user')}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // USER VIEW
  // ─────────────────────────────────────────────────────────────────────────
  const dark = isDarkMode;

  return (
    <div
      style={{ fontSize: `${fontScale}rem` }}
      className={`min-h-screen transition-colors duration-500 p-4 md:p-8 ${dark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}
    >
      <div className="max-w-6xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-indigo-600 p-4 rounded-3xl text-white shadow-2xl shadow-indigo-500/30">
              <IdCard size={36} />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter">PESEL Master</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <p className="opacity-40 text-xs font-black uppercase tracking-[0.3em]">{t('subtitle')}</p>
                <span className="opacity-20">•</span>
                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider opacity-50">
                  <DbDot status={dbStatus} />
                  Supabase{' '}
                  {dbStatus === 'connected' ? 'Connected' :
                   dbStatus === 'connecting' ? 'Connecting' :
                   dbStatus === 'unconfigured' ? 'Unconfigured' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Language switcher */}
            <div className={`flex items-center p-1.5 rounded-2xl border shadow-inner ${dark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
              {(['PL', 'ENG', 'UKR'] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`flex items-center gap-2 px-5 py-2 text-xs font-black transition-all rounded-xl ${
                    lang === l ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'opacity-40 hover:opacity-100'
                  }`}
                >
                  <span>{LANGUAGE_CONFIG[l].flag}</span>
                  {LANGUAGE_CONFIG[l].label}
                </button>
              ))}
            </div>

            {/* Toolbar buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsA11yOpen(true)}
                className={`p-3.5 rounded-2xl border hover:bg-white/10 transition-colors ${dark ? 'border-slate-700' : 'border-slate-200'}`}
                title={t('a11yOptions')}
              >
                <Accessibility size={22} />
              </button>
              <button
                onClick={() => setIsDarkMode(!dark)}
                className={`p-3.5 rounded-2xl border hover:bg-white/10 transition-colors ${dark ? 'border-slate-700' : 'border-slate-200'}`}
              >
                {dark ? <Sun size={22} /> : <Moon size={22} />}
              </button>
              <button
                onClick={() => setView('login')}
                className={`p-3.5 rounded-2xl border hover:bg-white/10 transition-colors ${dark ? 'border-slate-700' : 'border-slate-200'}`}
                title="Admin"
              >
                <Lock size={22} />
              </button>
            </div>
          </div>
        </header>

        {/* ── Main grid ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── Left: wizard form ─────────────────────────────────────── */}
          <div className="lg:col-span-4">
            <div className={`rounded-[2.5rem] shadow-2xl border overflow-hidden ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`border-b px-10 py-5 flex items-center justify-between font-black uppercase text-[10px] tracking-[0.2em] opacity-50 ${dark ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <Plus size={14} /> {t('manualEntry')}
                </div>
                <span>{t('step')} {wizardStep} {t('of')} 3</span>
              </div>
              <form onSubmit={handleAddPerson} className="p-8 space-y-6">

                {/* ── STEP 1: APPLICANT INFO ─────────────────────────────── */}
                {wizardStep === 1 && (
                  <>
                    <h3 className="text-sm font-black uppercase opacity-60 mb-4">{t('applicantSection')}</h3>
                    {(['applicantFirstName', 'applicantLastName'] as const).map((field) => (
                      <FormField
                        key={field}
                        label={t(field)}
                        name={field}
                        type="text"
                        value={formData[field]}
                        required
                        onChange={(v) => setFormData({ ...formData, [field]: v })}
                        isDarkMode={dark}
                      />
                    ))}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        label={t('street')}
                        name="applicantStreet"
                        type="text"
                        value={formData.applicantStreet}
                        required
                        onChange={(v) => setFormData({ ...formData, applicantStreet: v })}
                        isDarkMode={dark}
                      />
                      <FormField
                        label={t('houseNumber')}
                        name="applicantHouseNumber"
                        type="text"
                        value={formData.applicantHouseNumber}
                        required
                        onChange={(v) => setFormData({ ...formData, applicantHouseNumber: v })}
                        isDarkMode={dark}
                      />
                    </div>
                    <FormField
                      label={`${t('apartmentNumber')} ${t('optional')}`}
                      name="applicantApartmentNumber"
                      type="text"
                      value={formData.applicantApartmentNumber}
                      onChange={(v) => setFormData({ ...formData, applicantApartmentNumber: v })}
                      isDarkMode={dark}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        label={t('postalCode')}
                        name="applicantPostalCode"
                        type="text"
                        value={formData.applicantPostalCode}
                        required
                        onChange={(v) => setFormData({ ...formData, applicantPostalCode: v })}
                        isDarkMode={dark}
                      />
                      <FormField
                        label={t('city')}
                        name="applicantCity"
                        type="text"
                        value={formData.applicantCity}
                        required
                        onChange={(v) => setFormData({ ...formData, applicantCity: v })}
                        isDarkMode={dark}
                      />
                    </div>
                  </>
                )}

                {/* ── STEP 2: PERSON & FAMILY INFO ───────────────────────── */}
                {wizardStep === 2 && (
                  <>
                    <h3 className="text-sm font-black uppercase opacity-60 mb-4">{t('personSection')}</h3>
                    {(['firstName', 'lastName', 'nationality'] as const).map((field) => (
                      <FormField
                        key={field}
                        label={t(field)}
                        name={field}
                        type="text"
                        value={formData[field]}
                        required
                        placeholder={field === 'nationality' ? 'e.g. Polish, Ukrainian' : undefined}
                        onChange={(v) => setFormData({ ...formData, [field]: v })}
                        isDarkMode={dark}
                      />
                    ))}

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        label={t('dob')}
                        name="dob"
                        type="date"
                        value={formData.dob}
                        required
                        onChange={(v) => setFormData({ ...formData, dob: v })}
                        isDarkMode={dark}
                      />
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase opacity-40 block tracking-widest">{t('gender')}</label>
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                          className={`w-full px-4 py-3.5 rounded-2xl border outline-none transition-all ${dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                        >
                          <option value="male">{t('male')}</option>
                          <option value="female">{t('female')}</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        label={`${t('secondName')} ${t('optional')}`}
                        name="secondName"
                        type="text"
                        value={formData.secondName}
                        onChange={(v) => setFormData({ ...formData, secondName: v })}
                        isDarkMode={dark}
                      />
                      <FormField
                        label={`${t('maidenName')} ${t('optional')}`}
                        name="maidenName"
                        type="text"
                        value={formData.maidenName}
                        onChange={(v) => setFormData({ ...formData, maidenName: v })}
                        isDarkMode={dark}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        label={`${t('birthPlace')} ${t('optional')}`}
                        name="birthPlace"
                        type="text"
                        value={formData.birthPlace}
                        onChange={(v) => setFormData({ ...formData, birthPlace: v })}
                        isDarkMode={dark}
                      />
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase opacity-40 block tracking-widest">{t('citizenshipStatus')}</label>
                        <select
                          value={formData.citizenshipStatus}
                          onChange={(e) => setFormData({ ...formData, citizenshipStatus: e.target.value as any })}
                          className={`w-full px-4 py-3.5 rounded-2xl border outline-none transition-all ${dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                        >
                          <option value="polish">{t('citizenshipPolish')}</option>
                          <option value="stateless">{t('citizenshipStateless')}</option>
                          <option value="other">{t('citizenshipOther')}</option>
                        </select>
                      </div>
                    </div>

                    <h3 className="text-sm font-black uppercase opacity-60 mt-6 mb-4">{t('familySection')} {t('required')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        label={t('fatherFirstName')}
                        name="fatherFirstName"
                        type="text"
                        value={formData.fatherFirstName}
                        required
                        onChange={(v) => setFormData({ ...formData, fatherFirstName: v })}
                        isDarkMode={dark}
                      />
                      <FormField
                        label={t('fatherMaidenName')}
                        name="fatherMaidenName"
                        type="text"
                        value={formData.fatherMaidenName}
                        required
                        onChange={(v) => setFormData({ ...formData, fatherMaidenName: v })}
                        isDarkMode={dark}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        label={t('motherFirstName')}
                        name="motherFirstName"
                        type="text"
                        value={formData.motherFirstName}
                        required
                        onChange={(v) => setFormData({ ...formData, motherFirstName: v })}
                        isDarkMode={dark}
                      />
                      <FormField
                        label={t('motherMaidenName')}
                        name="motherMaidenName"
                        type="text"
                        value={formData.motherMaidenName}
                        required
                        onChange={(v) => setFormData({ ...formData, motherMaidenName: v })}
                        isDarkMode={dark}
                      />
                    </div>
                  </>
                )}

                {/* ── STEP 3: DOCUMENTS & NOTIFICATION ───────────────────── */}
                {wizardStep === 3 && (
                  <>
                    <h3 className="text-sm font-black uppercase opacity-60 mb-4">{t('documentSection')} {t('optional')}</h3>

                    <div className="text-xs opacity-50 mb-4 p-2 border-l-2 border-amber-500">{t('fillIfAvailable')}</div>

                    <details className="border rounded-lg p-3 cursor-pointer">
                      <summary className="font-bold text-sm">{t('idSection')}</summary>
                      <div className="space-y-3 mt-3">
                        <FormField label={t('idSeriesNumber')} name="idSeriesNumber" type="text" value={formData.idSeriesNumber} onChange={(v) => setFormData({ ...formData, idSeriesNumber: v })} isDarkMode={dark} />
                        <FormField label={t('idValidityDate')} name="idValidityDate" type="date" value={formData.idValidityDate} onChange={(v) => setFormData({ ...formData, idValidityDate: v })} isDarkMode={dark} />
                        <FormField label={t('idIssuingAuthority')} name="idIssuingAuthority" type="text" value={formData.idIssuingAuthority} onChange={(v) => setFormData({ ...formData, idIssuingAuthority: v })} isDarkMode={dark} />
                      </div>
                    </details>

                    <details className="border rounded-lg p-3 cursor-pointer">
                      <summary className="font-bold text-sm">{t('passportSection')}</summary>
                      <div className="space-y-3 mt-3">
                        <FormField label={t('passportSeriesNumber')} name="passportSeriesNumber" type="text" value={formData.passportSeriesNumber} onChange={(v) => setFormData({ ...formData, passportSeriesNumber: v })} isDarkMode={dark} />
                        <FormField label={t('passportValidityDate')} name="passportValidityDate" type="date" value={formData.passportValidityDate} onChange={(v) => setFormData({ ...formData, passportValidityDate: v })} isDarkMode={dark} />
                      </div>
                    </details>

                    <h3 className="text-sm font-black uppercase opacity-60 mt-6 mb-4">{t('maritalStatusSection')} {t('optional')}</h3>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase opacity-40 block tracking-widest">{t('maritalStatus')}</label>
                      <select value={formData.maritalStatus} onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value as any })} className={`w-full px-4 py-3.5 rounded-2xl border outline-none transition-all ${dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}>
                        <option value="single">{t('maritalSingle')}</option>
                        <option value="married">{t('maritalMarried')}</option>
                        <option value="divorced">{t('maritalDivorced')}</option>
                        <option value="widow">{t('maritalWidow')}</option>
                      </select>
                    </div>
                    {(formData.maritalStatus === 'married' || formData.maritalStatus === 'divorced' || formData.maritalStatus === 'widow') && (
                      <div className="grid grid-cols-2 gap-4">
                        <FormField label={t('spouseFirstName')} name="spouseFirstName" type="text" value={formData.spouseFirstName} onChange={(v) => setFormData({ ...formData, spouseFirstName: v })} isDarkMode={dark} />
                        <FormField label={t('spouseMaidenName')} name="spouseMaidenName" type="text" value={formData.spouseMaidenName} onChange={(v) => setFormData({ ...formData, spouseMaidenName: v })} isDarkMode={dark} />
                      </div>
                    )}

                    <h3 className="text-sm font-black uppercase opacity-60 mt-6 mb-4">{t('notificationSection')} {t('required')}</h3>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase opacity-40 block tracking-widest">{t('notificationMethod')}</label>
                      <select value={formData.notificationMethod} onChange={(e) => setFormData({ ...formData, notificationMethod: e.target.value as any })} className={`w-full px-4 py-3.5 rounded-2xl border outline-none transition-all ${dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}>
                        <option value="paper">{t('notificationPaper')}</option>
                        <option value="electronic">{t('notificationElectronic')}</option>
                      </select>
                    </div>
                    {formData.notificationMethod === 'electronic' && (
                      <div className="grid grid-cols-1 gap-4">
                        <FormField label={`${t('emailAddress')} ${t('optional')}`} name="emailAddress" type="email" value={formData.emailAddress} onChange={(v) => setFormData({ ...formData, emailAddress: v })} isDarkMode={dark} />
                        <FormField label={`${t('epuapAddress')} ${t('optional')}`} name="epuapAddress" type="text" value={formData.epuapAddress} onChange={(v) => setFormData({ ...formData, epuapAddress: v })} isDarkMode={dark} />
                      </div>
                    )}
                  </>
                )}

                {/* Navigation buttons */}
                <div className="flex gap-3 pt-4">
                  {wizardStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setWizardStep(wizardStep - 1)}
                      className="flex-1 border border-indigo-600 text-indigo-600 font-black py-3 rounded-2xl hover:bg-indigo-600/10 active:scale-95 transition-all uppercase tracking-widest text-xs"
                    >
                      ← {t('previous')}
                    </button>
                  )}
                  {wizardStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => setWizardStep(wizardStep + 1)}
                      className="flex-1 bg-indigo-600 text-white font-black py-3 rounded-2xl shadow-xl shadow-indigo-500/25 hover:bg-indigo-700 active:scale-95 transition-all uppercase tracking-widest text-xs"
                    >
                      {t('next')} →
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 text-white font-black py-3 rounded-2xl shadow-xl shadow-indigo-500/25 hover:bg-indigo-700 active:scale-95 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                    >
                      <IdCard size={16} /> {t('generateIdentity')}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* ── Right: identity panel ──────────────────────────────────── */}
          <div className="lg:col-span-8 space-y-6">

            {/* Under-review banner */}
            {submittedApplication && !activePerson && (
              <div className="rounded-[2rem] border-2 border-amber-400/30 bg-amber-500/5 p-8">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="shrink-0 w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Clock size={30} className="text-amber-500" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-lg font-black">{t('underReview')}</h3>
                    <p className="text-sm opacity-60 mt-1">{t('underReviewDesc')}</p>
                    <div className="flex flex-wrap gap-4 mt-3">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{t('applicationRef')}</span>
                        <p className="font-black text-sm font-mono text-indigo-500">{submittedApplication.pesel}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{t('submittedAt')}</span>
                        <p className="font-bold text-sm">{submittedApplication.firstName} {submittedApplication.lastName}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSubmittedApplication(null)}
                    className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 whitespace-nowrap"
                  >
                    <Plus size={14} /> {t('newApplication')}
                  </button>
                </div>
              </div>
            )}

            {activePerson ? (
              <div className="space-y-5">

                {/* Identity card */}
                <div className={`rounded-[2.5rem] shadow-2xl border overflow-hidden ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  {/* Card gradient header */}
                  <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                    <div className="relative">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <p className="text-white/50 text-[9px] font-black uppercase tracking-[0.3em] mb-1">{t('activeIdentity')}</p>
                          <h2 className="text-2xl font-black">{activePerson.firstName} {activePerson.lastName}</h2>
                          <p className="text-white/60 text-sm mt-0.5">{activePerson.nationality}</p>
                        </div>
                        <div className="bg-white/10 p-3 rounded-2xl"><IdCard size={28} /></div>
                      </div>
                      <div className="mb-4">
                        <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.3em] mb-1">PESEL</p>
                        <code className="text-2xl font-black tracking-[0.15em]">{activePerson.pesel}</code>
                      </div>
                      <div className="flex gap-8 text-sm">
                        <div>
                          <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">{t('dob')}</p>
                          <p className="font-bold">{activePerson.dob}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">{t('gender')}</p>
                          <p className="font-bold">{activePerson.gender === 'male' ? t('male') : t('female')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status / actions bar */}
                  <div className={`px-8 py-4 flex items-center gap-3 flex-wrap border-t ${dark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${activePerson.paymentStatus === 'paid' ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'}`}>
                      {activePerson.paymentStatus === 'paid' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                      {activePerson.paymentStatus === 'paid' ? t('paid') : t('unpaid')}
                    </span>
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${activePerson.verificationStatus === 'pending' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-500/10 text-slate-500'}`}>
                      <ShieldCheck size={12} />
                      {activePerson.verificationStatus === 'pending' ? t('statusPending') : 'Awaiting docs'}
                    </span>
                    <div className="ml-auto flex gap-2">
                      <button
                        onClick={() => handleReadAloudIdentity(activePerson)}
                        title={t('readOutLoud')}
                        className={`p-2.5 rounded-xl transition-all ${audioLoadingId === 'identity' ? 'text-indigo-500 bg-indigo-500/10 animate-pulse' : 'hover:bg-slate-500/10 opacity-40 hover:opacity-100'}`}
                      >
                        <Volume2 size={16} />
                      </button>
                      <button
                        onClick={() => setAiExplanation(getPeselExplanation(activePerson.pesel, activePerson.dob, activePerson.gender, lang))}
                        title={t('explainStructure')}
                        className="p-2.5 rounded-xl hover:bg-slate-500/10 opacity-40 hover:opacity-100 transition-all"
                      >
                        <HelpCircle size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 1 — Pay */}
                {activePerson.paymentStatus !== 'paid' && (
                  <div className={`rounded-[2rem] border p-6 ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0">1</div>
                        <div>
                          <h3 className="font-black text-sm">{t('payToVerify')}</h3>
                          <p className="text-xs opacity-40 mt-0.5">{t('feeNotice')}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setPaymentOpen(true)}
                        className="shrink-0 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                      >
                        <Wallet size={16} /> {t('payNow')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2 — Upload docs */}
                <div className={`rounded-[2rem] border p-6 space-y-4 transition-all ${
                  activePerson.paymentStatus !== 'paid'
                    ? 'opacity-40 pointer-events-none'
                    : dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${activePerson.paymentStatus === 'paid' ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-500'}`}>2</div>
                    <div>
                      <h3 className="font-black text-sm">{t('docVerification')}</h3>
                      <p className="text-xs opacity-40 mt-0.5">{t('idDesc')}</p>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleVerifyDocument}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isVerifying}
                    className={`flex items-center justify-center gap-3 w-full px-6 py-3.5 rounded-2xl font-black text-sm transition-all ${
                      isVerifying
                        ? 'bg-slate-500/10 opacity-70 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20'
                    }`}
                  >
                    {isVerifying
                      ? <><Loader2 size={18} className="animate-spin" /> {t('aiChecking')}</>
                      : <><Upload size={18} /> {t('verify')}</>}
                  </button>
                </div>

              </div>
            ) : !submittedApplication ? (
              /* Empty state */
              <div className={`rounded-[2.5rem] border-2 border-dashed min-h-[400px] flex flex-col items-center justify-center p-12 text-center ${dark ? 'border-slate-800' : 'border-slate-200'}`}>
                <IdCard size={52} className="opacity-10 mb-5" />
                <p className="opacity-30 font-bold text-sm max-w-xs leading-relaxed">{t('searchPrompt')}</p>
              </div>
            ) : null}

          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <footer className={`mt-16 pt-8 border-t text-center ${dark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] opacity-25 font-black uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><Shield size={10} /> {t('footerStandard')}</span>
            <span>•</span>
            <span className="flex items-center gap-1.5"><Database size={10} /> {t('footerAi')}</span>
          </div>
          <p className="text-[9px] opacity-15 mt-2 max-w-lg mx-auto">{t('footerDesc')}</p>
        </footer>

      </div>

      {/* ── Modals ────────────────────────────────────────────────────── */}
      <PaymentModal
        isOpen={paymentOpen}
        isDarkMode={dark}
        t={t}
        onPaymentComplete={handlePaymentComplete}
        onClose={() => setPaymentOpen(false)}
      />

      <A11yModal
        isOpen={isA11yOpen}
        isDarkMode={dark}
        t={t}
        fontScale={fontScale}
        setFontScale={setFontScale}
        isHighContrast={isHighContrast}
        setIsHighContrast={setIsHighContrast}
        onClose={() => setIsA11yOpen(false)}
      />

      <PeselModal
        explanation={aiExplanation}
        isDarkMode={dark}
        t={t}
        onClose={() => setAiExplanation(null)}
      />

      {/* Hidden file input rendered globally to avoid re-focus issues */}
    </div>
  );
};

export default App;
