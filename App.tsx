import React, { useState, useEffect, useRef } from 'react';
import { Plus, IdCard, Volume2, Loader2, HelpCircle, Accessibility, Upload, ShieldCheck } from 'lucide-react';
import { Language, Person, View, DbStatus } from './types';
import { ADMIN_PASS, TRANSLATIONS, TranslationKey } from './constants';
import { generatePESEL, getPeselExplanation } from './utils';
import { dbHealth, dbFetchPeople, dbSyncPerson, dbDeletePerson, dbClearAll, dbUploadDocument } from './db';

import FormField from './FormField';
import AdminView from './AdminView';
import ReviewView from './ReviewView';
import LoginView from './LoginView';
import A11yModal from './A11yModal';
import PeselModal from './PeselModal';
import MainLayout from './MainLayout';
import Accordion from './Accordion';

const App: React.FC = () => {
  // ── Navigation
  const [view, setView] = useState<View>('user');

  // ── People / DB
  const [people, setPeople] = useState<Person[]>([]);
  const [activePerson, setActivePerson] = useState<Person | null>(null);
  const [submittedApplication, setSubmittedApplication] = useState<Person | null>(null);
  const [dbStatus, setDbStatus] = useState<DbStatus>('connecting');
  const [dbMessage, setDbMessage] = useState('');

  // ── UI preferences
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('pesel_theme') === 'dark');
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('pesel_lang') as Language) || 'PL');
  const [fontScale, setFontScale] = useState(() => Number(localStorage.getItem('pesel_font_scale')) || 1);
  const [isHighContrast, setIsHighContrast] = useState(() => localStorage.getItem('pesel_high_contrast') === 'true');
  const [isA11yOpen, setIsA11yOpen] = useState(false);

  // ── Form
  const [formData, setFormData] = useState({
    applicantFirstName: '', applicantLastName: '', applicantStreet: '',
    applicantHouseNumber: '', applicantApartmentNumber: '', applicantPostalCode: '', applicantCity: '',
    firstName: '', lastName: '', secondName: '', otherNames: '', maidenName: '',
    dob: '', gender: 'male' as 'male' | 'female',
    birthPlace: '', countryOfBirth: '', countryOfResidence: '', nationality: '', citizenshipStatus: 'polish' as 'polish' | 'stateless' | 'other',
    fatherFirstName: '', fatherMaidenName: '', motherFirstName: '', motherMaidenName: '', civRegistryOffice: '',
    idSeriesNumber: '', idValidityDate: '', idIssuingAuthority: '',
    passportSeriesNumber: '', passportValidityDate: '',
    otherDocSeriesNumber: '', otherDocValidityDate: '',
    maritalStatus: 'single' as 'single' | 'married' | 'divorced' | 'widow' | 'widower',
    spouseFirstName: '', spouseMaidenName: '', spousePesel: '',
    notificationMethod: 'paper' as 'paper' | 'electronic',
    emailAddress: '', epuapAddress: '',
  });
  const [adminPass, setAdminPass] = useState('');

  // ── Verification
  const [isVerifying, setIsVerifying] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── TTS / Dictation
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const [dictatingField, setDictatingField] = useState<string | null>(null);

  const t = (key: TranslationKey): string => TRANSLATIONS[lang][key] ?? TRANSLATIONS.PL[key];

  // ── Persist settings
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('pesel_theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('pesel_lang', lang);
    localStorage.setItem('pesel_font_scale', fontScale.toString());
    localStorage.setItem('pesel_high_contrast', isHighContrast.toString());
  }, [isDarkMode, lang, fontScale, isHighContrast]);

  // ── DB initialisation
  useEffect(() => {
    dbHealth()
      .then(({ status, message }) => {
        setDbStatus(status);
        setDbMessage(message);
      })
      .catch(() => {
        setDbStatus('disconnected');
        setDbMessage('Could not reach Supabase.');
      });

    dbFetchPeople()
      .then((data) => {
        if (data.length > 0) {
          setPeople(data);
        } else {
          const cached = localStorage.getItem('pesel_vault_admin');
          if (cached) setPeople(JSON.parse(cached) as Person[]);
        }
      })
      .catch(() => {
        const cached = localStorage.getItem('pesel_vault_admin');
        if (cached) setPeople(JSON.parse(cached) as Person[]);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem('pesel_vault_admin', JSON.stringify(people));
  }, [people]);

  const syncPerson = async (person: Person): Promise<void> => {
    try {
      await dbSyncPerson(person);
    } catch (_e: unknown) {
      console.warn('Could not sync to Supabase:', _e);
    }
  };

  // ── TTS
  const handleTTS = (text: string, id = 'tts'): void => {
    if (!('speechSynthesis' in window)) return;
    if (audioLoadingId === id) {
      window.speechSynthesis.cancel();
      setAudioLoadingId(null);
      return;
    }
    setAudioLoadingId(id);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'PL' ? 'pl-PL' : lang === 'UKR' ? 'uk-UA' : 'en-US';
    const clearLoading = (): void => setAudioLoadingId(null);
    utterance.onend = clearLoading;
    utterance.onerror = clearLoading;
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

  // ── Dictation
  const handleDictate = (field: keyof typeof formData): void => {
    if (dictatingField) return;
    const SR =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SR) { alert('Speech recognition not supported.'); return; }

    const recogniser = new (SR as any)();
    recogniser.lang = lang === 'UKR' ? 'uk-UA' : lang === 'PL' ? 'pl-PL' : 'en-US';
    recogniser.interimResults = false;
    recogniser.maxAlternatives = 1;
    recogniser.onstart = (): void => setDictatingField(field);
    recogniser.onend = (): void => setDictatingField(null);
    recogniser.onerror = (): void => setDictatingField(null);
    recogniser.onresult = (e: any): void => {
      const transcript = String(e.results[0][0].transcript);
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

  // ── Form submission
  const handleAddPerson = (e: React.FormEvent): void => {
    e.preventDefault();
    const {
      applicantFirstName, applicantLastName, applicantStreet, applicantHouseNumber,
      applicantPostalCode, applicantCity,
      firstName, lastName, dob, nationality, gender, citizenshipStatus,
      fatherFirstName, fatherMaidenName, motherFirstName, motherMaidenName,
      notificationMethod, emailAddress, epuapAddress,
    } = formData;

    if (!applicantFirstName || !applicantLastName || !applicantStreet ||
        !applicantHouseNumber || !applicantPostalCode || !applicantCity ||
        !firstName || !lastName || !dob || !nationality ||
        !fatherFirstName || !fatherMaidenName || !motherFirstName || !motherMaidenName ||
        !notificationMethod || (notificationMethod === 'electronic' && !emailAddress && !epuapAddress)) {
      alert('Please fill in all required fields');
      return;
    }

    const newPerson: Person = {
      id: crypto.randomUUID(),
      firstName, lastName, dob, gender, nationality,
      applicantFirstName, applicantLastName, applicantStreet, applicantHouseNumber,
      applicantApartmentNumber: formData.applicantApartmentNumber,
      applicantPostalCode, applicantCity,
      secondName: formData.secondName,
      otherNames: formData.otherNames,
      maidenName: formData.maidenName,
      birthPlace: formData.birthPlace,
      countryOfBirth: formData.countryOfBirth,
      countryOfResidence: formData.countryOfResidence,
      citizenshipStatus,
      fatherFirstName, fatherMaidenName,
      motherFirstName, motherMaidenName,
      civRegistryOffice: formData.civRegistryOffice,
      idSeriesNumber: formData.idSeriesNumber,
      idValidityDate: formData.idValidityDate,
      idIssuingAuthority: formData.idIssuingAuthority,
      passportSeriesNumber: formData.passportSeriesNumber,
      passportValidityDate: formData.passportValidityDate,
      otherDocSeriesNumber: formData.otherDocSeriesNumber,
      otherDocValidityDate: formData.otherDocValidityDate,
      maritalStatus: formData.maritalStatus,
      spouseFirstName: formData.spouseFirstName,
      spouseMaidenName: formData.spouseMaidenName,
      spousePesel: formData.spousePesel,
      notificationMethod, emailAddress, epuapAddress,
      pesel: generatePESEL(new Date(dob), gender),
      createdAt: Date.now(),
      verificationStatus: 'none',
    };

    setActivePerson(newPerson);
    setSubmittedApplication(null);
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
    void syncPerson(newPerson);
  };

  // ── Document verification
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

    void (async () => {
      try {
        const photoUrl = await dbUploadDocument(file, activePerson.pesel);
        const updated: Person = {
          ...activePerson,
          verificationStatus: 'pending',
          verificationDetails: feedback,
          idPhoto: photoUrl,
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

  // ── Admin actions
  const handleDeletePerson = async (id: string): Promise<void> => {
    if (!confirm('Permanently delete this record?')) return;
    try { await dbDeletePerson(id); } catch (_e: unknown) { }
    setPeople((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearDatabase = async (): Promise<void> => {
    if (!confirm('Delete ALL records from the database and local cache?')) return;
    try { await dbClearAll(); } catch (_e: unknown) { }
    setPeople([]);
    localStorage.removeItem('pesel_vault_admin');
  };

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

  // ── Views
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

  // ── USER VIEW (default)
  return (
    <MainLayout
      isDarkMode={isDarkMode}
      setIsDarkMode={setIsDarkMode}
      lang={lang}
      setLang={setLang}
      currentView={view}
      onViewChange={setView}
      breadcrumbs={[{ label: 'Get a PESEL ID - a service for foreigners' }]}
    >
      <div style={{ fontSize: `${fontScale}rem` }}>
        <div className="max-w-4xl">
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-gray-600 mb-8">{t('subtitle')}</p>

          {submittedApplication && !activePerson ? (
            <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="text-lg font-bold text-amber-900 mb-2">{t('underReview')}</h3>
              <p className="text-amber-800 text-sm mb-4">{t('underReviewDesc')}</p>
              <div className="flex flex-wrap gap-6 mb-4">
                <div>
                  <span className="text-xs font-semibold text-amber-700">{t('applicationRef')}</span>
                  <p className="font-mono text-blue-600">{submittedApplication.pesel}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-amber-700">{t('submittedAt')}</span>
                  <p>{submittedApplication.firstName} {submittedApplication.lastName}</p>
                </div>
              </div>
              <button
                onClick={() => setSubmittedApplication(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {t('newApplication')}
              </button>
            </div>
          ) : null}

          <Accordion
            items={[
              {
                number: 1,
                title: t('applicantSection'),
                children: (
                  <form onSubmit={handleAddPerson} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label={t('applicantFirstName')} name="applicantFirstName" type="text" value={formData.applicantFirstName} required onChange={(v) => setFormData({ ...formData, applicantFirstName: v })} isDarkMode={isDarkMode} />
                      <FormField label={t('applicantLastName')} name="applicantLastName" type="text" value={formData.applicantLastName} required onChange={(v) => setFormData({ ...formData, applicantLastName: v })} isDarkMode={isDarkMode} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label={t('street')} name="applicantStreet" type="text" value={formData.applicantStreet} required onChange={(v) => setFormData({ ...formData, applicantStreet: v })} isDarkMode={isDarkMode} />
                      <FormField label={t('houseNumber')} name="applicantHouseNumber" type="text" value={formData.applicantHouseNumber} required onChange={(v) => setFormData({ ...formData, applicantHouseNumber: v })} isDarkMode={isDarkMode} />
                    </div>
                    <FormField label={`${t('apartmentNumber')} ${t('optional')}`} name="applicantApartmentNumber" type="text" value={formData.applicantApartmentNumber} onChange={(v) => setFormData({ ...formData, applicantApartmentNumber: v })} isDarkMode={isDarkMode} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label={t('postalCode')} name="applicantPostalCode" type="text" value={formData.applicantPostalCode} required onChange={(v) => setFormData({ ...formData, applicantPostalCode: v })} isDarkMode={isDarkMode} />
                      <FormField label={t('city')} name="applicantCity" type="text" value={formData.applicantCity} required onChange={(v) => setFormData({ ...formData, applicantCity: v })} isDarkMode={isDarkMode} />
                    </div>
                  </form>
                ),
                defaultOpen: true,
              },
              {
                number: 2,
                title: `${t('personSection')} & ${t('familySection')}`,
                children: (
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField label={t('firstName')} name="firstName" type="text" value={formData.firstName} required onChange={(v) => setFormData({ ...formData, firstName: v })} isDarkMode={isDarkMode} />
                      <FormField label={t('lastName')} name="lastName" type="text" value={formData.lastName} required onChange={(v) => setFormData({ ...formData, lastName: v })} isDarkMode={isDarkMode} />
                      <FormField label={t('nationality')} name="nationality" type="text" value={formData.nationality} required onChange={(v) => setFormData({ ...formData, nationality: v })} isDarkMode={isDarkMode} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label={t('dob')} name="dob" type="date" value={formData.dob} required onChange={(v) => setFormData({ ...formData, dob: v })} isDarkMode={isDarkMode} />
                      <div>
                        <label className="block text-sm font-semibold mb-2">{t('gender')}</label>
                        <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })} className="w-full px-3 py-2 border border-gray-300 rounded">
                          <option value="male">{t('male')}</option>
                          <option value="female">{t('female')}</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label={t('fatherFirstName')} name="fatherFirstName" type="text" value={formData.fatherFirstName} required onChange={(v) => setFormData({ ...formData, fatherFirstName: v })} isDarkMode={isDarkMode} />
                      <FormField label={t('fatherMaidenName')} name="fatherMaidenName" type="text" value={formData.fatherMaidenName} required onChange={(v) => setFormData({ ...formData, fatherMaidenName: v })} isDarkMode={isDarkMode} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label={t('motherFirstName')} name="motherFirstName" type="text" value={formData.motherFirstName} required onChange={(v) => setFormData({ ...formData, motherFirstName: v })} isDarkMode={isDarkMode} />
                      <FormField label={t('motherMaidenName')} name="motherMaidenName" type="text" value={formData.motherMaidenName} required onChange={(v) => setFormData({ ...formData, motherMaidenName: v })} isDarkMode={isDarkMode} />
                    </div>
                  </form>
                ),
              },
              {
                number: 3,
                title: `${t('documentSection')} & ${t('notificationSection')}`,
                children: (
                  <form onSubmit={handleAddPerson} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label={t('idSeriesNumber')} name="idSeriesNumber" type="text" value={formData.idSeriesNumber} onChange={(v) => setFormData({ ...formData, idSeriesNumber: v })} isDarkMode={isDarkMode} />
                      <FormField label={t('idValidityDate')} name="idValidityDate" type="date" value={formData.idValidityDate} onChange={(v) => setFormData({ ...formData, idValidityDate: v })} isDarkMode={isDarkMode} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">{t('notificationMethod')}</label>
                      <select value={formData.notificationMethod} onChange={(e) => setFormData({ ...formData, notificationMethod: e.target.value as 'paper' | 'electronic' })} className="w-full px-3 py-2 border border-gray-300 rounded">
                        <option value="paper">{t('notificationPaper')}</option>
                        <option value="electronic">{t('notificationElectronic')}</option>
                      </select>
                    </div>
                    {formData.notificationMethod === 'electronic' && (
                      <FormField label={t('emailAddress')} name="emailAddress" type="email" value={formData.emailAddress} onChange={(v) => setFormData({ ...formData, emailAddress: v })} isDarkMode={isDarkMode} />
                    )}
                    <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700">
                      {t('generateIdentity')}
                    </button>
                  </form>
                ),
              },
            ]}
          />

          {activePerson && (
            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-bold text-blue-900 mb-4">{t('activeIdentity')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div><span className="text-xs font-semibold text-blue-700">Name</span><p className="font-semibold">{activePerson.firstName} {activePerson.lastName}</p></div>
                <div><span className="text-xs font-semibold text-blue-700">PESEL</span><p className="font-mono text-lg font-bold">{activePerson.pesel}</p></div>
                <div><span className="text-xs font-semibold text-blue-700">DOB</span><p>{activePerson.dob}</p></div>
                <div><span className="text-xs font-semibold text-blue-700">Gender</span><p>{activePerson.gender === 'male' ? t('male') : t('female')}</p></div>
              </div>

              <div className="mb-6">
                <button
                  onClick={() => handleReadAloudIdentity(activePerson)}
                  className="mr-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                >
                  <Volume2 size={14} className="inline mr-1" /> {t('readOutLoud')}
                </button>
                <button
                  onClick={() => setAiExplanation(getPeselExplanation(activePerson.pesel, activePerson.dob, activePerson.gender, lang))}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                >
                  <HelpCircle size={14} className="inline mr-1" /> {t('explainStructure')}
                </button>
              </div>

              <div className="p-4 border-t">
                <h4 className="font-semibold mb-3">{t('docVerification')}</h4>
                <p className="text-sm text-gray-600 mb-3">{t('idDesc')}</p>
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
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isVerifying ? <Loader2 size={16} className="inline animate-spin mr-2" /> : <Upload size={16} className="inline mr-2" />}
                  {isVerifying ? t('aiChecking') : t('verify')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <A11yModal
        isOpen={isA11yOpen}
        isDarkMode={isDarkMode}
        t={t}
        fontScale={fontScale}
        setFontScale={setFontScale}
        isHighContrast={isHighContrast}
        setIsHighContrast={setIsHighContrast}
        onClose={() => setIsA11yOpen(false)}
      />

      <PeselModal
        explanation={aiExplanation}
        isDarkMode={isDarkMode}
        t={t}
        onClose={() => setAiExplanation(null)}
      />
    </MainLayout>
  );
};

export default App;
