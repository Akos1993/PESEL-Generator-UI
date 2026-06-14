import React, { useState, useEffect, useRef } from 'react';
import { Loader2, HelpCircle, Upload } from 'lucide-react';
import { Language, Person, View, DbStatus } from './types';
import { ADMIN_PASS, TRANSLATIONS, TranslationKey } from './constants';
import { generatePESEL, getPeselExplanation } from './utils';
import { dbHealth, dbFetchPeople, dbSyncPerson, dbDeletePerson, dbClearAll, dbUploadDocument } from './db';

import FormField from './FormField';
import AdminView from './AdminView';
import ReviewView from './ReviewView';
import LoginView from './LoginView';
import A11yModal from './A11yModal';
import MainLayout from './MainLayout';
import Accordion from './Accordion';

type FormDataType = {
  applicantFirstName: string; applicantLastName: string; applicantStreet: string;
  applicantHouseNumber: string; applicantApartmentNumber: string; applicantPostalCode: string; applicantCity: string;
  firstName: string; lastName: string; secondName: string; otherNames: string; maidenName: string;
  dob: string; gender: 'male' | 'female';
  birthPlace: string; countryOfBirth: string; countryOfResidence: string;
  nationality: string; citizenshipStatus: 'polish' | 'stateless' | 'other';
  fatherFirstName: string; fatherMaidenName: string; motherFirstName: string; motherMaidenName: string; civRegistryOffice: string;
  idSeriesNumber: string; idValidityDate: string; idIssuingAuthority: string;
  passportSeriesNumber: string; passportValidityDate: string;
  otherDocSeriesNumber: string; otherDocValidityDate: string;
  maritalStatus: 'single' | 'married' | 'divorced' | 'widow' | 'widower';
  spouseFirstName: string; spouseMaidenName: string; spousePesel: string;
  notificationMethod: 'paper' | 'electronic';
  emailAddress: string; epuapAddress: string;
  idPhoto: string;
  proofOfResidence: string;
};

const createLangText = (lang: Language, pl: string, ukr: string, en: string): string =>
  lang === 'PL' ? pl : lang === 'UKR' ? ukr : en;

const INITIAL_FORM_DATA: FormDataType = {
  applicantFirstName: '', applicantLastName: '', applicantStreet: '',
  applicantHouseNumber: '', applicantApartmentNumber: '', applicantPostalCode: '', applicantCity: '',
  firstName: '', lastName: '', secondName: '', otherNames: '', maidenName: '',
  dob: '', gender: 'male',
  birthPlace: '', countryOfBirth: '', countryOfResidence: '',
  nationality: '', citizenshipStatus: 'polish',
  fatherFirstName: '', fatherMaidenName: '', motherFirstName: '', motherMaidenName: '', civRegistryOffice: '',
  idSeriesNumber: '', idValidityDate: '', idIssuingAuthority: '',
  passportSeriesNumber: '', passportValidityDate: '',
  otherDocSeriesNumber: '', otherDocValidityDate: '',
  maritalStatus: 'single', spouseFirstName: '', spouseMaidenName: '', spousePesel: '',
  notificationMethod: 'paper', emailAddress: '', epuapAddress: '',
  idPhoto: '',
  proofOfResidence: '',
};

const App: React.FC = () => {
  // ── Navigation
  const [view, setView] = useState<View>('generator');

  // ── User Authentication
  const [loggedInUser, setLoggedInUser] = useState<{ email: string; pesel: string } | null>(() => {
    const saved = localStorage.getItem('pesel_logged_in_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPesel, setLoginPesel] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);

  // ── People / DB
  const [people, setPeople] = useState<Person[]>([]);
  const [activePerson, setActivePerson] = useState<Person | null>(null);
  const [submittedApplication, setSubmittedApplication] = useState<Person | null>(null);
  const [dbStatus, setDbStatus] = useState<DbStatus>('connecting');
  const [dbMessage, setDbMessage] = useState('');

  // ── UI preferences
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('pesel_lang') as Language) || 'PL');
  const [fontScale, setFontScale] = useState(() => Number(localStorage.getItem('pesel_font_scale')) || 1);
  const [isHighContrast, setIsHighContrast] = useState(() => localStorage.getItem('pesel_high_contrast') === 'true');
  const [isA11yOpen, setIsA11yOpen] = useState(false);

  // ── Form
  const [formData, setFormData] = useState<FormDataType>(INITIAL_FORM_DATA);
  const [adminPass, setAdminPass] = useState('');

  // ── Verification
  const [isVerifying, setIsVerifying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (key: TranslationKey): string => TRANSLATIONS[lang][key] ?? TRANSLATIONS.PL[key];

  // ── Persist settings
  useEffect(() => {
    localStorage.setItem('pesel_lang', lang);
    localStorage.setItem('pesel_font_scale', fontScale.toString());
    localStorage.setItem('pesel_high_contrast', isHighContrast.toString());
  }, [lang, fontScale, isHighContrast]);

  // ── Persist logged in user
  useEffect(() => {
    if (loggedInUser) {
      localStorage.setItem('pesel_logged_in_user', JSON.stringify(loggedInUser));
    } else {
      localStorage.removeItem('pesel_logged_in_user');
    }
  }, [loggedInUser]);

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

    const missingFields: string[] = [];
    if (!applicantFirstName) missingFields.push('Applicant First Name');
    if (!applicantLastName) missingFields.push('Applicant Last Name');
    if (!applicantStreet) missingFields.push('Street');
    if (!applicantHouseNumber) missingFields.push('House Number');
    if (!applicantPostalCode) missingFields.push('Postal Code');
    if (!applicantCity) missingFields.push('City');
    if (!firstName) missingFields.push('First Name');
    if (!lastName) missingFields.push('Last Name');
    if (!dob) missingFields.push('Date of Birth');
    if (!nationality) missingFields.push('Nationality');
    if (!fatherFirstName) missingFields.push('Father First Name');
    if (!fatherMaidenName) missingFields.push('Father Maiden Name');
    if (!motherFirstName) missingFields.push('Mother First Name');
    if (!motherMaidenName) missingFields.push('Mother Maiden Name');
    if (!notificationMethod) missingFields.push('Notification Method');
    if (notificationMethod === 'electronic' && !emailAddress && !epuapAddress) {
      missingFields.push('Email Address or ePUAP Address');
    }

    if (missingFields.length > 0) {
      alert(`Please fill in required fields:\n\n${missingFields.join('\n')}`);
      return;
    }

    const newPerson: Person = {
      id: crypto.randomUUID(),
      dob, gender, nationality,
      firstname: firstName,
      lastname: lastName,
      applicantfirstname: applicantFirstName,
      applicantlastname: applicantLastName,
      applicantstreet: applicantStreet,
      applicanthousenumber: applicantHouseNumber,
      applicantapartmentnumber: formData.applicantApartmentNumber,
      applicantpostalcode: applicantPostalCode,
      applicantcity: applicantCity,
      secondname: formData.secondName,
      othernames: formData.otherNames,
      maidenname: formData.maidenName,
      birthplace: formData.birthPlace,
      countryofbirth: formData.countryOfBirth,
      countryofresidence: formData.countryOfResidence,
      citizenshipstatus: citizenshipStatus,
      fatherfirstname: fatherFirstName,
      fathermaidenname: fatherMaidenName,
      motherfirstname: motherFirstName,
      mothermaidenname: motherMaidenName,
      civregistryoffice: formData.civRegistryOffice,
      idseriesnumber: formData.idSeriesNumber,
      idvaliditydate: formData.idValidityDate,
      idissuingauthority: formData.idIssuingAuthority,
      passportseriesnumber: formData.passportSeriesNumber,
      passportvaliditydate: formData.passportValidityDate,
      otherdocseriesnumber: formData.otherDocSeriesNumber,
      otherdocvaliditydate: formData.otherDocValidityDate,
      maritalstatus: formData.maritalStatus,
      spousefirstname: formData.spouseFirstName,
      spousemaidenname: formData.spouseMaidenName,
      spousepesel: formData.spousePesel,
      notificationmethod: notificationMethod,
      emailaddress: emailAddress,
      epuapaddress: epuapAddress,
      pesel: generatePESEL(new Date(dob), gender),
      createdAt: Date.now(),
      verificationdetails: '',
      verificationstatus: 'none',
    };

    setActivePerson(newPerson);
    setSubmittedApplication(null);
    setFormData(INITIAL_FORM_DATA);
    syncPerson(newPerson).catch(() => {});
  };

  // ── Document verification
  const handleVerifyDocument = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file || !activePerson) return;
    setIsVerifying(true);

    const feedback = createLangText(
      lang,
      `Dokumenty przesłane pomyślnie. Wniosek weryfikowany dla: ${activePerson.first_name} ${activePerson.last_name}.`,
      `Документи завантажені. Заявку верифікується для: ${activePerson.first_name} ${activePerson.last_name}.`,
      `Documents uploaded. Application under review for: ${activePerson.first_name} ${activePerson.last_name}.`
    );

    (async () => {
      try {
        const photoUrl = await dbUploadDocument(file, activePerson.pesel);
        const updated: Person = {
          ...activePerson,
          verificationstatus: 'pending',
          verificationdetails: feedback,
          idphoto: photoUrl,
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
    })().catch(() => {});
  };

  // ── Admin actions
  const handleDeletePerson = async (id: string) => {
    if (!confirm('Permanently delete this record?')) return;
    try { await dbDeletePerson(id); } catch { }
    setPeople((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearDatabase = async () => {
    if (!confirm('Delete ALL records from the database and local cache?')) return;
    try { await dbClearAll(); } catch { }
    setPeople([]);
    localStorage.removeItem('pesel_vault_admin');
  };

  const handleReviewDecision = async (id: string, decision: 'verified' | 'rejected') => {
    const person = people.find((p) => p.id === id);
    if (!person) return;
    const updated: Person = { ...person, verificationstatus: decision };
    setPeople((prev) => prev.map((p) => (p.id === id ? updated : p)));
    await syncPerson(updated);
  };

  const handleLogin = (e: React.FormEvent): void => {
    e.preventDefault();
    if (adminPass === ADMIN_PASS) { setView('admin'); setAdminPass(''); }
    else alert(t('invalidPass'));
  };

  const handleUserLogin = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!loginEmail || !loginPesel) {
      alert('Please enter email and PESEL');
      return;
    }
    const matchingPerson = people.find(p => p.emailAddress === loginEmail && p.pesel === loginPesel);
    if (matchingPerson) {
      setLoggedInUser({ email: loginEmail, pesel: loginPesel });
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPesel('');
      setView('mydata');
    } else {
      alert('Email lub PESEL nie znaleziony. Sprawdź dane lub złóż nowy wniosek.');
    }
  };

  const handleUserLogout = (): void => {
    setLoggedInUser(null);
    setView('generator');
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
        isDarkMode={false}
        dbStatus={dbStatus}
        dbMessage={dbMessage}
        t={t}
        onDeletePerson={(id) => { handleDeletePerson(id).catch(() => {}); }}
        onClearDatabase={() => { handleClearDatabase().catch(() => {}); }}
        onExport={exportData}
        onOpenReview={() => setView('review')}
        onBack={() => setView('generator')}
      />
    );
  }

  if (view === 'review') {
    return (
      <ReviewView
        people={people}
        isDarkMode={false}
        t={t}
        onApprove={(id) => { handleReviewDecision(id, 'verified').catch(() => {}); }}
        onReject={(id) => { handleReviewDecision(id, 'rejected').catch(() => {}); }}
        onBack={() => setView('admin')}
      />
    );
  }

  if (view === 'login') {
    return (
      <LoginView
        isDarkMode={false}
        t={t}
        adminPass={adminPass}
        setAdminPass={setAdminPass}
        onLogin={() => { setView('admin'); setAdminPass(''); }}
        onBack={() => setView('generator')}
      />
    );
  }

  if (view === 'mydata') {
    if (!loggedInUser) {
      return (
        <MainLayout
          lang={lang}
          setLang={setLang}
          currentView={view}
          onViewChange={setView}
          breadcrumbs={[{ label: 'Moja data' }]}
        >
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-2">Moja data</h1>
            <div className="text-center p-12 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-gray-700 mb-4">Zaloguj się, aby zobaczyć swoją dane</p>
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Zaloguj się
              </button>
            </div>
          </div>
        </MainLayout>
      );
    }

    const userApplications = people.filter(p => p.emailAddress === loggedInUser.email && p.pesel === loggedInUser.pesel);

    return (
      <MainLayout
        lang={lang}
        setLang={setLang}
        currentView={view}
        onViewChange={setView}
        breadcrumbs={[{ label: 'Moja data' }]}
        loggedInUser={loggedInUser}
        onLogout={handleUserLogout}
      >
        <div className="max-w-4xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Moja data</h1>
              <p className="text-gray-600">Zalogowany: {loggedInUser.email}</p>
            </div>
            <button
              onClick={handleUserLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Wyloguj się
            </button>
          </div>

          {userApplications.length === 0 ? (
            <div className="text-center p-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-600 mb-4">Brak złożonych wniosków</p>
              <button
                onClick={() => setView('generator')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Złóż nowy wniosek
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {userApplications.map((person) => (
                <div key={person.id} className="p-6 border border-gray-200 rounded-lg bg-white hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{person.firstName} {person.lastName}</h3>
                      <p className="text-sm text-gray-600 mt-1">PESEL: <span className="font-mono font-bold">{person.pesel}</span></p>
                      <p className="text-sm text-gray-600">Data urodzenia: {person.dob}</p>
                      <p className="text-sm text-gray-600 mt-2">Złożono: {new Date(person.createdAt).toLocaleDateString('pl-PL')}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                        person.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
                        person.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        person.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {person.verificationStatus === 'verified' ? 'Zweryfikowany' :
                         person.verificationStatus === 'pending' ? 'W weryfikacji' :
                         person.verificationStatus === 'rejected' ? 'Odrzucony' : 'Oczekujący'}
                      </span>
                      {person.verificationDetails && (
                        <p className="text-xs text-gray-600 mt-2">{person.verificationDetails}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </MainLayout>
    );
  }

  if (view === 'help') {
    return (
      <MainLayout
        lang={lang}
        setLang={setLang}
        currentView={view}
        onViewChange={setView}
        breadcrumbs={[{ label: 'Pomoc' }]}
      >
        <div className="max-w-4xl">
          <h1 className="text-3xl font-bold mb-2">Pomoc</h1>
          <p className="text-gray-600 mb-8">Odpowiedzi na najczęściej zadawane pytania</p>

          <div className="space-y-6">
            <div className="p-6 border border-gray-200 rounded-lg">
              <h3 className="font-bold text-lg mb-2">Co to jest PESEL?</h3>
              <p className="text-gray-700">PESEL to Powszechny Elektroniczny System Ewidencji Ludności - unikalny numer identyfikacyjny każdej osoby zarejestrowanej w Polsce.</p>
            </div>

            <div className="p-6 border border-gray-200 rounded-lg">
              <h3 className="font-bold text-lg mb-2">Jak złożyć wniosek?</h3>
              <ol className="text-gray-700 list-decimal list-inside space-y-2">
                <li>Wypełnij formularz na stronie głównej</li>
                <li>Podaj wszystkie wymagane informacje</li>
                <li>Załącz wymagane dokumenty</li>
                <li>Złóż wniosek i czekaj na weryfikację</li>
              </ol>
            </div>

            <div className="p-6 border border-gray-200 rounded-lg">
              <h3 className="font-bold text-lg mb-2">Jakie dokumenty są wymagane?</h3>
              <p className="text-gray-700">Wymagany jest ważny dowód osobisty, paszport lub inne oficjalne dokumenty tożsamości oraz potwierdzenie zameldowania ponad 6 miesięcy.</p>
            </div>

            <div className="p-6 border border-gray-200 rounded-lg">
              <h3 className="font-bold text-lg mb-2">Jak długo trwa weryfikacja?</h3>
              <p className="text-gray-700">Proces weryfikacji zwykle trwa od 5 do 10 dni roboczych. Będziesz powiadomiony o statusie na podaną stronę lub email.</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ── GENERATOR VIEW (default)
  return (
    <MainLayout
      lang={lang}
      setLang={setLang}
      currentView={view}
      onViewChange={setView}
      breadcrumbs={[{ label: 'Generator PESEL' }]}
      loggedInUser={loggedInUser}
      onLogout={handleUserLogout}
      onMObywatelClick={() => setShowLoginModal(true)}
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
                      <FormField label={t('applicantFirstName')} name="applicantFirstName" type="text" value={formData.applicantFirstName} required onChange={(v) => setFormData({ ...formData, applicantFirstName: v })} isDarkMode={false} />
                      <FormField label={t('applicantLastName')} name="applicantLastName" type="text" value={formData.applicantLastName} required onChange={(v) => setFormData({ ...formData, applicantLastName: v })} isDarkMode={false} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label={t('street')} name="applicantStreet" type="text" value={formData.applicantStreet} required onChange={(v) => setFormData({ ...formData, applicantStreet: v })} isDarkMode={false} />
                      <FormField label={t('houseNumber')} name="applicantHouseNumber" type="text" value={formData.applicantHouseNumber} required onChange={(v) => setFormData({ ...formData, applicantHouseNumber: v })} isDarkMode={false} />
                    </div>
                    <FormField label={`${t('apartmentNumber')} ${t('optional')}`} name="applicantApartmentNumber" type="text" value={formData.applicantApartmentNumber} onChange={(v) => setFormData({ ...formData, applicantApartmentNumber: v })} isDarkMode={false} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label={t('postalCode')} name="applicantPostalCode" type="text" value={formData.applicantPostalCode} required onChange={(v) => setFormData({ ...formData, applicantPostalCode: v })} isDarkMode={false} />
                      <FormField label={t('city')} name="applicantCity" type="text" value={formData.applicantCity} required onChange={(v) => setFormData({ ...formData, applicantCity: v })} isDarkMode={false} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">{t('notificationMethod')}</label>
                      <select value={formData.notificationMethod} onChange={(e) => setFormData({ ...formData, notificationMethod: e.target.value as 'paper' | 'electronic' })} className="w-full px-3 py-2 border border-gray-300 rounded">
                        <option value="paper">{t('notificationPaper')}</option>
                        <option value="electronic">{t('notificationElectronic')}</option>
                      </select>
                    </div>
                    {formData.notificationMethod === 'electronic' && (
                      <FormField label={t('emailAddress')} name="emailAddress" type="email" value={formData.emailAddress} onChange={(v) => setFormData({ ...formData, emailAddress: v })} isDarkMode={false} />
                    )}
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
                      <FormField label={t('firstName')} name="firstName" type="text" value={formData.firstName} required onChange={(v) => setFormData({ ...formData, firstName: v })} isDarkMode={false} />
                      <FormField label={t('lastName')} name="lastName" type="text" value={formData.lastName} required onChange={(v) => setFormData({ ...formData, lastName: v })} isDarkMode={false} />
                      <FormField label={t('nationality')} name="nationality" type="text" value={formData.nationality} required onChange={(v) => setFormData({ ...formData, nationality: v })} isDarkMode={false} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label={t('dob')} name="dob" type="date" value={formData.dob} required onChange={(v) => setFormData({ ...formData, dob: v })} isDarkMode={false} />
                      <div>
                        <label className="block text-sm font-semibold mb-2">{t('gender')}</label>
                        <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })} className="w-full px-3 py-2 border border-gray-300 rounded">
                          <option value="male">{t('male')}</option>
                          <option value="female">{t('female')}</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label={`${t('secondName')} ${t('optional')}`} name="secondName" type="text" value={formData.secondName} onChange={(v) => setFormData({ ...formData, secondName: v })} isDarkMode={false} />
                      <FormField label={`${t('otherNames')} ${t('optional')}`} name="otherNames" type="text" value={formData.otherNames} onChange={(v) => setFormData({ ...formData, otherNames: v })} isDarkMode={false} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label={`${t('maidenName')} ${t('optional')}`} name="maidenName" type="text" value={formData.maidenName} onChange={(v) => setFormData({ ...formData, maidenName: v })} isDarkMode={false} />
                      <FormField label={`${t('birthPlace')} ${t('optional')}`} name="birthPlace" type="text" value={formData.birthPlace} onChange={(v) => setFormData({ ...formData, birthPlace: v })} isDarkMode={false} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField label={`${t('countryOfBirth')} ${t('optional')}`} name="countryOfBirth" type="text" value={formData.countryOfBirth} onChange={(v) => setFormData({ ...formData, countryOfBirth: v })} isDarkMode={false} />
                      <FormField label={`${t('countryOfResidence')} ${t('optional')}`} name="countryOfResidence" type="text" value={formData.countryOfResidence} onChange={(v) => setFormData({ ...formData, countryOfResidence: v })} isDarkMode={false} />
                      <div>
                        <label className="block text-sm font-semibold mb-2">{t('citizenshipStatus')} {t('optional')}</label>
                        <select value={formData.citizenshipStatus} onChange={(e) => setFormData({ ...formData, citizenshipStatus: e.target.value as 'polish' | 'stateless' | 'other' })} className="w-full px-3 py-2 border border-gray-300 rounded">
                          <option value="polish">{t('citizenshipPolish')}</option>
                          <option value="stateless">{t('citizenshipStateless')}</option>
                          <option value="other">{t('citizenshipOther')}</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label={t('fatherFirstName')} name="fatherFirstName" type="text" value={formData.fatherFirstName} required onChange={(v) => setFormData({ ...formData, fatherFirstName: v })} isDarkMode={false} />
                      <FormField label={t('fatherMaidenName')} name="fatherMaidenName" type="text" value={formData.fatherMaidenName} required onChange={(v) => setFormData({ ...formData, fatherMaidenName: v })} isDarkMode={false} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label={t('motherFirstName')} name="motherFirstName" type="text" value={formData.motherFirstName} required onChange={(v) => setFormData({ ...formData, motherFirstName: v })} isDarkMode={false} />
                      <FormField label={t('motherMaidenName')} name="motherMaidenName" type="text" value={formData.motherMaidenName} required onChange={(v) => setFormData({ ...formData, motherMaidenName: v })} isDarkMode={false} />
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
                      <FormField label={t('idSeriesNumber')} name="idSeriesNumber" type="text" value={formData.idSeriesNumber} onChange={(v) => setFormData({ ...formData, idSeriesNumber: v })} isDarkMode={false} />
                      <FormField label={t('idValidityDate')} name="idValidityDate" type="date" value={formData.idValidityDate} onChange={(v) => setFormData({ ...formData, idValidityDate: v })} isDarkMode={false} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label={`${t('idIssuingAuthority')} ${t('optional')}`} name="idIssuingAuthority" type="text" value={formData.idIssuingAuthority} onChange={(v) => setFormData({ ...formData, idIssuingAuthority: v })} isDarkMode={false} />
                      <FormField label={`${t('civRegistryOffice')} ${t('optional')}`} name="civRegistryOffice" type="text" value={formData.civRegistryOffice} onChange={(v) => setFormData({ ...formData, civRegistryOffice: v })} isDarkMode={false} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label={`Passport Series Number ${t('optional')}`} name="passportSeriesNumber" type="text" value={formData.passportSeriesNumber} onChange={(v) => setFormData({ ...formData, passportSeriesNumber: v })} isDarkMode={false} />
                      <FormField label={`Passport Validity Date ${t('optional')}`} name="passportValidityDate" type="date" value={formData.passportValidityDate} onChange={(v) => setFormData({ ...formData, passportValidityDate: v })} isDarkMode={false} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label={`Other Document Series Number ${t('optional')}`} name="otherDocSeriesNumber" type="text" value={formData.otherDocSeriesNumber} onChange={(v) => setFormData({ ...formData, otherDocSeriesNumber: v })} isDarkMode={false} />
                      <FormField label={`Other Document Validity Date ${t('optional')}`} name="otherDocValidityDate" type="date" value={formData.otherDocValidityDate} onChange={(v) => setFormData({ ...formData, otherDocValidityDate: v })} isDarkMode={false} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Marital Status {t('optional')}</label>
                      <select value={formData.maritalStatus} onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value as 'single' | 'married' | 'divorced' | 'widow' | 'widower' })} className="w-full px-3 py-2 border border-gray-300 rounded">
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="divorced">Divorced</option>
                        <option value="widow">Widow</option>
                        <option value="widower">Widower</option>
                      </select>
                    </div>
                    {(formData.maritalStatus === 'married' || formData.maritalStatus === 'divorced') && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField label={`Spouse First Name ${t('optional')}`} name="spouseFirstName" type="text" value={formData.spouseFirstName} onChange={(v) => setFormData({ ...formData, spouseFirstName: v })} isDarkMode={false} />
                        <FormField label={`Spouse Maiden Name ${t('optional')}`} name="spouseMaidenName" type="text" value={formData.spouseMaidenName} onChange={(v) => setFormData({ ...formData, spouseMaidenName: v })} isDarkMode={false} />
                        <FormField label={`Spouse PESEL ${t('optional')}`} name="spousePesel" type="text" value={formData.spousePesel} onChange={(v) => setFormData({ ...formData, spousePesel: v })} isDarkMode={false} />
                      </div>
                    )}

                    <div className="border-t pt-6 mt-6">
                      <h4 className="font-semibold text-lg mb-4">Document Upload</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
                          <label className="block text-sm font-semibold mb-3">ID Document (Passport, ID Card, etc.)</label>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setFormData({ ...formData, idPhoto: file.name });
                              }
                            }}
                            className="w-full text-sm text-gray-600 cursor-pointer"
                          />
                          <p className="text-xs text-gray-500 mt-2">Max 15MB. Formats: JPG, PNG, PDF</p>
                          {formData.idPhoto && <p className="text-xs text-green-600 mt-1">✓ {formData.idPhoto}</p>}
                        </div>

                        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
                          <label className="block text-sm font-semibold mb-3">Proof of Residence (&gt;6 months)</label>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setFormData({ ...formData, proofOfResidence: file.name });
                              }
                            }}
                            className="w-full text-sm text-gray-600 cursor-pointer"
                          />
                          <p className="text-xs text-gray-500 mt-2">Max 15MB. Formats: JPG, PNG, PDF</p>
                          {formData.proofOfResidence && <p className="text-xs text-green-600 mt-1">✓ {formData.proofOfResidence}</p>}
                        </div>
                      </div>
                    </div>

                  </form>
                ),
              },
            ]}
          />

          {activePerson && (
            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-bold text-blue-900 mb-4">{t('activeIdentity')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div><span className="text-xs font-semibold text-blue-700">Name</span><p className="font-semibold">{activePerson.firstname} {activePerson.lastname}</p></div>
                <div><span className="text-xs font-semibold text-blue-700">PESEL</span><p className="font-mono text-lg font-bold">{activePerson.pesel}</p></div>
                <div><span className="text-xs font-semibold text-blue-700">DOB</span><p>{activePerson.dob}</p></div>
                <div><span className="text-xs font-semibold text-blue-700">Gender</span><p>{activePerson.gender === 'male' ? t('male') : t('female')}</p></div>
              </div>

              <div className="mb-6">
                <button
                  onClick={() => {
                    const explanation = getPeselExplanation(activePerson.pesel, activePerson.dob, activePerson.gender, lang);
                    alert(explanation);
                  }}
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
        isDarkMode={false}
        t={t}
        fontScale={fontScale}
        setFontScale={setFontScale}
        isHighContrast={isHighContrast}
        setIsHighContrast={setIsHighContrast}
        onClose={() => setIsA11yOpen(false)}
      />

      {/* User Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">Zaloguj się do mObywatela</h2>
            <form onSubmit={handleUserLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Twój email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">PESEL</label>
                <input
                  type="text"
                  value={loginPesel}
                  onChange={(e) => setLoginPesel(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Twój numer PESEL"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Zaloguj się
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setLoginEmail('');
                    setLoginPesel('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Anuluj
                </button>
              </div>
              <p className="text-xs text-gray-600 text-center mt-4">
                Użyj tego samego emaila i numeru PESEL, które podałeś podczas składania wniosku
              </p>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default App;
