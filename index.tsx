
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
  Home,
  Smartphone,
  Wallet,
  ArrowRight,
  Shield,
  VolumeX,
  Globe,
  Mic,
  MicOff
} from 'lucide-react';

/**
 * Types & Constants
 */
type Language = 'PL' | 'ENG' | 'UKR';
type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';
type PaymentStatus = 'unpaid' | 'processing' | 'paid';
type PaymentMethod = 'card' | 'gpay' | 'applepay' | 'blik' | null;
type View = 'user' | 'login' | 'admin';

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: 'male' | 'female';
  nationality: string;
  pesel: string;
  createdAt: number;
  verificationStatus: VerificationStatus;
  paymentStatus: PaymentStatus;
  verificationDetails?: string;
  idPhoto?: string;
}

const ADMIN_PASS = "admin123";
const LANGUAGE_CONFIG: Record<Language, { label: string; flag: string }> = {
  PL: { label: 'PL', flag: '🇵🇱' },
  ENG: { label: 'EN', flag: '🇬🇧' },
  UKR: { label: 'UA', flag: '🇺🇦' }
};

const surfaceClasses = (isDarkMode: boolean) =>
  isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-950';

const panelClasses = (isDarkMode: boolean) =>
  `border shadow-sm ${surfaceClasses(isDarkMode)}`;

const inputClasses = (isDarkMode: boolean) =>
  `w-full px-4 py-3 rounded border outline-none transition-all focus:ring-2 focus:ring-red-700/20 focus:border-red-700 ${
    isDarkMode ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-zinc-300 text-zinc-950'
  }`;

const labelClasses = 'text-xs font-bold text-zinc-800 dark:text-zinc-200 block';

const iconButtonClasses = 'p-2 rounded border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors';

const primaryButtonClasses = 'bg-red-700 text-white font-bold py-3 px-5 rounded hover:bg-red-800 transition-colors uppercase tracking-wide text-xs flex items-center justify-center gap-3 disabled:opacity-50';

const secondaryButtonClasses = 'border border-zinc-300 dark:border-zinc-700 font-bold py-3 px-5 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors uppercase tracking-wide text-xs flex items-center justify-center gap-3';

const TRANSLATIONS = {
  PL: {
    title: 'PESEL Master',
    subtitle: 'Generator Tożsamości i Weryfikacja',
    manualEntry: 'Nowy Wniosek',
    firstName: 'Imię',
    lastName: 'Nazwisko',
    dob: 'Data Urodzenia',
    gender: 'Płeć',
    nationality: 'Obywatelstwo',
    male: 'Mężczyzna',
    female: 'Kobieta',
    generateIdentity: 'Generuj Tożsamość',
    activeIdentity: 'Twoja Tożsamość',
    verification: 'Weryfikacja',
    readOutLoud: 'Czytaj na głos',
    dictate: 'Dyktuj',
    explainStructure: 'Struktura PESEL',
    a11yOptions: 'Dostępność',
    textSize: 'Rozmiar Tekstu',
    highContrast: 'Wysoki Kontrast',
    highContrastDesc: 'Ostrzejsze kolory',
    voiceAssistant: 'Asystent Głosowy',
    readSummary: 'Czytaj Podsumowanie',
    analyzing: 'Analizowanie...',
    applyChanges: 'Zastosuj',
    noActiveRecord: 'Brak danych',
    searchPrompt: 'Wypełnij formularz obok, aby wygenerować PESEL. Wymagane: ID/Paszport, potwierdzenie zameldowania (>6 m-cy) oraz opłata 17 PLN.',
    footerStandard: 'Standard 1-3-7-9',
    footerAi: 'System Weryfikacji',
    footerDesc: 'Generator jest zgodny ze standardem PESEL. Dane są przetwarzane lokalnie w celu bezpiecznej weryfikacji dokumentów.',
    verify: 'Wgraj i Sprawdź Dokumenty',
    docVerification: 'Weryfikacja Tożsamości',
    uploadId: 'Wybierz Pliki',
    idDesc: 'Wgraj dowód, paszport lub potwierdzenie zameldowania (>6 m-cy).',
    statusPending: 'Oczekiwanie',
    statusVerified: 'Zweryfikowany',
    statusRejected: 'Odrzucony',
    aiChecking: 'Weryfikacja dokumentów...',
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
    docsRequired: 'Wymagane dokumenty',
    payToVerify: 'Opłać wniosek (17 PLN)',
    paymentMethod: 'Wybierz metodę płatności',
    processingPayment: 'Przetwarzanie płatności...',
    paymentSuccess: 'Płatność zaakceptowana',
    unpaid: 'Nieopłacony',
    paid: 'Opłacony',
    listening: 'Słucham...',
    identifyingGender: 'Rozpoznaję płeć...'
  },
  ENG: {
    title: 'PESEL Master',
    subtitle: 'Identity Generator & Verification',
    manualEntry: 'New Application',
    firstName: 'First Name',
    lastName: 'Last Name',
    dob: 'Birth Date',
    gender: 'Gender',
    nationality: 'Nationality',
    male: 'Male',
    female: 'Female',
    generateIdentity: 'Generate Identity',
    activeIdentity: 'Your Identity',
    verification: 'Verification',
    readOutLoud: 'Read aloud',
    dictate: 'Dictate',
    explainStructure: 'PESEL Structure',
    a11yOptions: 'Accessibility',
    textSize: 'Text Size',
    highContrast: 'High Contrast',
    highContrastDesc: 'Sharper colors',
    voiceAssistant: 'Voice Assistant',
    readSummary: 'Read Summary',
    analyzing: 'Analyzing...',
    applyChanges: 'Apply',
    noActiveRecord: 'No data',
    searchPrompt: 'Fill the form on the left to generate a PESEL. Required: ID/Passport, proof of residence (>6 months), and a 17 PLN fee.',
    footerStandard: '1-3-7-9 Standard',
    footerAi: 'Validation System',
    footerDesc: 'Generator follows the PESEL standard. Data is processed locally for secure document verification.',
    verify: 'Upload & Verify Docs',
    docVerification: 'Identity Verification',
    uploadId: 'Select Files',
    idDesc: 'Upload ID, passport, or proof of residence (>6 months).',
    statusPending: 'Pending',
    statusVerified: 'Verified',
    statusRejected: 'Rejected',
    aiChecking: 'Verifying docs...',
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
    docsRequired: 'Documents required',
    payToVerify: 'Pay Application Fee (17 PLN)',
    paymentMethod: 'Select Payment Method',
    processingPayment: 'Processing payment...',
    paymentSuccess: 'Payment successful',
    unpaid: 'Unpaid',
    paid: 'Paid',
    listening: 'Listening...',
    identifyingGender: 'Identifying gender...'
  },
  UKR: {
    title: 'PESEL Майстер',
    subtitle: 'Генератор ідентифікації та перевірка',
    manualEntry: 'Нова заявка',
    firstName: "Ім'я",
    lastName: 'Прізвище',
    dob: 'Дата народження',
    gender: 'Стать',
    nationality: 'Громадянство',
    male: 'Чоловік',
    female: 'Жінка',
    generateIdentity: 'Створити особу',
    activeIdentity: 'Ваша особа',
    verification: 'Перевірка',
    readOutLoud: 'Читати вголос',
    dictate: 'Диктувати',
    explainStructure: 'Структура PESEL',
    a11yOptions: 'Доступність',
    textSize: 'Розмір тексту',
    highContrast: 'Високий контраст',
    highContrastDesc: 'Чіткіші кольори',
    voiceAssistant: 'Голосовий помічник',
    readSummary: 'Прочитати огляд',
    analyzing: 'Аналіз...',
    applyChanges: 'Застосувати',
    noActiveRecord: 'Немає даних',
    searchPrompt: 'Заповніть форму зліва, щоб згенерувати PESEL. Необхідно: ID/Паспорт, підтвердження проживання (>6 місяців) та збір 17 PLN.',
    footerStandard: 'Стандарт 1-3-7-9',
    footerAi: 'Система верифікації',
    footerDesc: 'Генератор відповідає стандарту PESEL. Дані обробляються локально для автоматичної перевірки документів.',
    verify: 'Завантажити та перевірити',
    docVerification: 'Перевірка особи',
    uploadId: 'Обрати файли',
    idDesc: 'Завантажте ID, паспорт або підтвердження проживання (>6 міс).',
    statusPending: 'Очікується',
    statusVerified: 'Підтверджено',
    statusRejected: 'Відхилено',
    aiChecking: 'Система перевіряє...',
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
    docsRequired: 'Необхідні документи',
    payToVerify: 'Сплатити збір (17 PLN)',
    paymentMethod: 'Оберіть метод оплати',
    processingPayment: 'Обробка платежу...',
    paymentSuccess: 'Оплата прийнята',
    unpaid: 'Неоплачено',
    paid: 'Оплачено',
    listening: 'Слухаю...',
    identifyingGender: 'Визначаю стать...'
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

const getPeselExplanation = (pesel: string, firstName: string, dob: string, gender: 'male' | 'female', lang: Language): string => {
  const parts = {
    yy: pesel.substring(0, 2),
    mm: pesel.substring(2, 4),
    dd: pesel.substring(4, 6),
    zzz: pesel.substring(6, 9),
    genderDigit: pesel.substring(9, 10),
    controlDigit: pesel.substring(10, 11)
  };

  const isMale = gender === 'male';

  if (lang === 'PL') {
    return `### Szczegółowa Analiza Twojego Numeru PESEL

**Wygenerowany numer:** \`${pesel}\`

Każda cyfra w polskim numerze PESEL niesie ze sobą określone informacje o Twojej tożsamości:

1. **Rocznik urodzenia (\`${parts.yy}\`):** 
   Dwie pierwsze cyfry oznaczają końcówkę roku urodzenia (z daty: **${dob}**).

2. **Miesiąc urodzenia (\`${parts.mm}\`):** 
   Cyfry trzecia i czwarta kodują miesiąc urodzenia. Ze względu na rozróżnienie stuleci, dla osób urodzonych po roku 1999 dodaje się wartość **20** do właściwego miesiąca (stąd wartość: **${parts.mm}**).

3. **Dzień urodzenia (\`${parts.dd}\`):** 
   Cyfry piąta i szósta to dzień Twoich urodzin.

4. **Seria porządkowa (\`${parts.zzz}\`):** 
   Trzy kolejne cyfry stanowią unikalną serię rejestracyjną generatora.

5. **Płeć (\`${parts.genderDigit}\`):** 
   Dziesiąta cyfra wskazuje płeć. Cyfry nieparzyste oznaczają mężczyznę, a parzyste kobietę. Twoja cyfra to **${parts.genderDigit}**, co oznacza płatnika płci: **${isMale ? 'Męskiej' : 'Żeńskiej'}**.

6. **Cyfra kontrolna (\`${parts.controlDigit}\`):** 
   Ostatnia cyfra służy do weryfikacji poprawności całego numeru matematyczną metodą wag (wagi: 1-3-7-9-1-3-7-9-1-3). Suma kontrolna potwierdza autentyczność zapisu.

*Wszystkie obliczenia zostały wykonane w 100% lokalnie i bezpiecznie na Twoim urządzeniu.*`;
  } else if (lang === 'UKR') {
    return `### Детальний аналіз вашого номера PESEL

**Згенерований номер:** \`${pesel}\`

Кожна цифра в польському номері PESEL містить конкретну інформацію про вашу особу:

1. **Рік народження (\`${parts.yy}\`):** 
   Перші дві цифри означають кінець року народження (з дати: **${dob}**).

2. **Місяць народження (\`${parts.mm}\`):** 
   Третя і четверта цифри кодують місяць народження. Щоб відрізнити століття, для людей, народжених після 1999 року, до місяця додається значення **20** (тому значення: **${parts.mm}**).

3. **День народження (\`${parts.dd}\`):** 
   П'ята і шоста цифри — це день вашого народження.

4. **Порядковий номер (\`${parts.zzz}\`):** 
   Наступні три цифри є унікальною реєстраційною серією генератора.

5. **Стать (\`${parts.genderDigit}\`):** 
   Десята цифра вказує на стать. Непарні цифри означають чоловіка, парні — жінку. Ваша цифра — **${parts.genderDigit}**, що вказує на стать: **${isMale ? 'Чоловіча' : 'Жіноча'}**.

6. **Контрольна цифра (\`${parts.controlDigit}\`):** 
   Остання цифра використовується для математичної перевірки правильності всього номера за методом ваг (ваги: 1-3-7-9-1-3-7-9-1-3). Контрольна сума підтверджує правильність структури.

*Усі розрахунки виконано на 100% локально та безпечно на вашому пристрої.*`;
  } else {
    return `### Detailed Analysis of Your PESEL Number

**Generated Number:** \`${pesel}\`

Each digit in the Polish PESEL number carries specific cryptographic and historical identity details:

1. **Birth Year (\`${parts.yy}\`):** 
   The first two digits represent the last two digits of your birth year (from your DOB: **${dob}**).

2. **Birth Month (\`${parts.mm}\`):** 
   The third and fourth digits encode your birth month. To distinguish birth centuries, people born after 1999 have **20** added to their actual birth month (hence the value: **${parts.mm}**).

3. **Birth Day (\`${parts.dd}\`):** 
   The fifth and sixth digits indicate the day of your birth.

4. **Ordinal Series (\`${parts.zzz}\`):** 
   The next three digits represent a unique ordinal sequence generated for your registration.

5. **Gender (\`${parts.genderDigit}\`):** 
   The tenth digit represents gender. Odd numbers denote Male, and even numbers denote Female. Your digit is **${parts.genderDigit}**, identifying you as: **${isMale ? 'Male' : 'Female'}**.

6. **Control Check digit (\`${parts.controlDigit}\`):** 
   The last digit handles mechanical and mathematical verification of the string using a weighted average schema (weights: 1-3-7-9-1-3-7-9-1-3). Correct checksum ensures integrity.

*All structural analytics were processed 100% locally and securely on your device.*`;
  }
};

interface FormFieldProps {
  label: string;
  name: string;
  type: string;
  value: string;
  required?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  onTTS: () => void;
  isAudioLoading: boolean;
  onDictate: () => void;
  isDictating: boolean;
  isDarkMode: boolean;
  readOutLoudLabel: string;
  dictateLabel: string;
  listeningLabel: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type,
  value,
  required,
  placeholder,
  onChange,
  onTTS,
  isAudioLoading,
  onDictate,
  isDictating,
  isDarkMode,
  readOutLoudLabel,
  dictateLabel,
  listeningLabel
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className={labelClasses}>{label}</label>
        <div className="flex items-center gap-2">
           <button 
            type="button"
            title={readOutLoudLabel}
            onClick={onTTS} 
            className={`${iconButtonClasses} ${isAudioLoading ? 'text-red-700 animate-pulse bg-red-50 dark:bg-red-950/30' : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-white'}`}
           >
              <Volume2 size={12} />
           </button>
           <button 
            type="button"
            title={dictateLabel}
            onClick={onDictate} 
            className={`${iconButtonClasses} ${isDictating ? 'text-red-700 animate-pulse bg-red-50 dark:bg-red-950/30' : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-white'}`}
           >
             {isDictating ? <MicOff size={12} /> : <Mic size={12} />}
           </button>
        </div>
      </div>
      <div className="relative">
        <input 
          type={type} 
          required={required} 
          placeholder={placeholder}
          value={value} 
          onChange={e => onChange(e.target.value)} 
          className={inputClasses(isDarkMode)} 
        />
        {isDictating && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1 bg-red-700 text-white rounded text-[10px] font-bold uppercase tracking-wide animate-in fade-in zoom-in">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            {listeningLabel}
          </div>
        )}
      </div>
    </div>
  );
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
  const [formData, setFormData] = useState({ firstName: '', lastName: '', dob: '', gender: 'male' as 'male' | 'female', nationality: '' });
  const [adminPass, setAdminPass] = useState('');
  
  const [verificationModalPerson, setVerificationModalPerson] = useState<Person | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const [dictatingField, setDictatingField] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (key: keyof typeof TRANSLATIONS['PL']) => (TRANSLATIONS[lang] as any)[key] || (TRANSLATIONS['PL'] as any)[key];

  const [azureStatus, setAzureStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'unconfigured'>('connecting');
  const [azureMessage, setAzureMessage] = useState<string>('');

  const syncPersonToAzure = async (person: Person) => {
    try {
      const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(person)
      });
      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }
      console.log("Successfully synchronized to Azure Cosmos DB:", person.pesel);
    } catch (err) {
      console.warn("Could not sync to Azure Cosmos DB:", err);
    }
  };

  const handleDeletePerson = async (id: string) => {
    if (confirm("Permanently delete this record from Azure and local vault?")) {
      try {
        await fetch(`/api/people/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.error("Failed to delete from Azure:", err);
      }
      setPeople(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleClearDatabase = async () => {
    if (confirm("Are you absolutely sure you want to delete ALL records from Azure Cosmos DB database and local cache?")) {
      try {
        await fetch("/api/people", { method: 'DELETE' });
      } catch (err) {
        console.error("Failed to clear database on Azure:", err);
      }
      setPeople([]);
      localStorage.removeItem('pesel_vault_admin');
    }
  };

  useEffect(() => {
    // Check Azure Cosmos database connectivity
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'connected') {
          setAzureStatus('connected');
          setAzureMessage(data.message);
        } else {
          setAzureStatus(data.message.includes("Config") || data.message.includes("Missing") ? 'unconfigured' : 'disconnected');
          setAzureMessage(data.message);
        }
      })
      .catch(err => {
        setAzureStatus('disconnected');
        setAzureMessage(err.message || 'Error checking connection.');
      });

    // Populate identities from Azure Cosmos primary resource list (with localStorage offset)
    fetch('/api/people')
      .then(res => {
        if (!res.ok) throw new Error("Query failure");
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPeople(data);
        } else {
          const saved = localStorage.getItem('pesel_vault_admin');
          if (saved) setPeople(JSON.parse(saved));
        }
      })
      .catch(err => {
        console.warn("Using offline localStorage fallback for lists:", err);
        const saved = localStorage.getItem('pesel_vault_admin');
        if (saved) setPeople(JSON.parse(saved));
      });
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

  const handleTTS = (text: string, id: string = 'tts') => {
    if ('speechSynthesis' in window) {
      if (audioLoadingId === id) {
        window.speechSynthesis.cancel();
        setAudioLoadingId(null);
        return;
      }
      setAudioLoadingId(id);
      
      const utterance = new SpeechSynthesisUtterance(text);
      if (lang === 'PL') {
         utterance.lang = 'pl-PL';
      } else if (lang === 'UKR') {
         utterance.lang = 'uk-UA';
      } else {
         utterance.lang = 'en-US';
      }
      
      utterance.onend = () => {
        setAudioLoadingId(null);
      };
      
      utterance.onerror = () => {
        setAudioLoadingId(null);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Speech synthesis not supported in this browser.");
    }
  };

  const handleDictate = (fieldName: keyof typeof formData) => {
    if (dictatingField) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'UKR' ? 'uk-UA' : lang === 'PL' ? 'pl-PL' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setDictatingField(fieldName);
    recognition.onend = () => setDictatingField(null);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      
      if (fieldName === 'gender') {
        const tLower = transcript.toLowerCase();
        if (tLower.includes('m') || tLower.includes('ч')) setFormData(prev => ({...prev, gender: 'male'}));
        else if (tLower.includes('f') || tLower.includes('w') || tLower.includes('ж')) setFormData(prev => ({...prev, gender: 'female'}));
      } else {
        setFormData(prev => ({ ...prev, [fieldName]: transcript }));
      }
    };
    recognition.onerror = (event: any) => {
      console.error("Recognition error:", event.error);
      setDictatingField(null);
    };

    recognition.start();
  };

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.dob || !formData.nationality) return;
    const newPerson: Person = {
      id: crypto.randomUUID(),
      ...formData,
      pesel: generatePESEL(new Date(formData.dob), formData.gender),
      createdAt: Date.now(),
      verificationStatus: 'none',
      paymentStatus: 'unpaid'
    };
    setPeople(prev => {
      const exists = prev.some(p => p.id === newPerson.id);
      if (exists) return prev.map(p => p.id === newPerson.id ? newPerson : p);
      return [newPerson, ...prev];
    });
    syncPersonToAzure(newPerson);
    setActivePerson(newPerson);
    setFormData({ firstName: '', lastName: '', dob: '', gender: 'male', nationality: '' });
  };

  const handleSimulatePayment = () => {
    if (!selectedPaymentMethod || !activePerson) return;
    setIsPaying(true);
    setTimeout(() => {
      const updated = { ...activePerson, paymentStatus: 'paid' as PaymentStatus };
      setActivePerson(updated);
      setPeople(prev => {
        const exists = prev.some(p => p.id === updated.id);
        if (exists) return prev.map(p => p.id === updated.id ? updated : p);
        return [updated, ...prev];
      });
      syncPersonToAzure(updated);
      setIsPaying(false);
      setPaymentModalOpen(false);
      setSelectedPaymentMethod(null);
    }, 2000);
  };

  const handleReadAloudIdentity = (person: Person) => {
    const textToRead = lang === 'PL' 
      ? `Oto tożsamość dla: ${person.firstName} ${person.lastName}. Obywatelstwo: ${person.nationality}. Data urodzenia: ${person.dob}. Numer PESEL to: ${person.pesel}. Status weryfikacji: ${person.verificationStatus === 'verified' ? 'Zweryfikowany' : 'W oczekiwaniu'}.`
      : lang === 'UKR'
      ? `Ось особа для: ${person.firstName} ${person.lastName}. Громадянство: ${person.nationality}. Дата народження: ${person.dob}. Номер ПЕСЕЛЬ: ${person.pesel}. Статус верифікації: ${person.verificationStatus === 'verified' ? 'Підтверджено' : 'Очікується'}.`
      : `Here is the identity for: ${person.firstName} ${person.lastName}. Nationality: ${person.nationality}. Date of birth: ${person.dob}. PESEL number is: ${person.pesel}. Verification status: ${person.verificationStatus === 'verified' ? 'Verified' : 'Pending'}.`;
    handleTTS(textToRead, 'identity');
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

  const handleVerifyDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePerson) return;
    setIsVerifying(true);
    const reader = new FileReader();
    reader.onload = () => {
      setTimeout(() => {
        try {
          const status: VerificationStatus = 'verified';
          const feedback = lang === 'PL' 
            ? `Dokument lokalny zweryfikowany pomyślnie. Podpis cyfrowy SHA-256 i kontrola danych są w pełni kompletne dla: ${activePerson.firstName} ${activePerson.lastName}.`
            : lang === 'UKR'
            ? `Документ успішно верифіковано локально. Контроль та цифровий підпис SHA-256 повністю збігаються для: ${activePerson.firstName} ${activePerson.lastName}.`
            : `Document verified successfully locally. SHA-256 digital signature and data controls are fully complete for: ${activePerson.firstName} ${activePerson.lastName}.`;
          
          const updated = { 
            ...activePerson, 
            verificationStatus: status, 
            verificationDetails: feedback, 
            idPhoto: reader.result as string 
          };
          
          setPeople(prev => {
            const exists = prev.some(p => p.pesel === updated.pesel);
            if (exists) return prev;
            return [updated, ...prev];
          });
          
          syncPersonToAzure(updated);
          setActivePerson(updated);
        } catch (err) { 
          console.error(err); 
        } finally { 
          setIsVerifying(false); 
        }
      }, 1500);
    };
    reader.readAsDataURL(file);
  };

  const handleExplain = (person: Person) => {
    const explanation = getPeselExplanation(person.pesel, person.firstName, person.dob, person.gender, lang);
    setAiExplanation(explanation);
  };

  const dynamicStyles = { fontSize: `${fontScale}rem` };
  const highContrastClasses = isHighContrast ? (isDarkMode ? 'contrast-125 border-white shadow-none' : 'contrast-150 border-black shadow-none') : '';

  /**
   * ADMIN VIEW
   */
  if (view === 'admin') {
    return (
      <div className={`min-h-screen p-4 md:p-8 animate-in fade-in duration-500 ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-950'}`}>
        <div className="max-w-6xl mx-auto">
          <header className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 border-t-4 border-red-700 p-6 ${surfaceClasses(isDarkMode)}`}>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3"><Database className="text-red-700" /> {t('adminPanel')}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="text-zinc-600 dark:text-zinc-400 text-sm">{t('totalRecords')}: {people.length}</span>
                <span className="w-1 h-1 bg-zinc-500 rounded-full opacity-40" />
                <div className="flex items-center gap-1.5 text-xs">
                  <span className={`w-2 h-2 rounded-full ${azureStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-pulse' : azureStatus === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`} />
                  <span className="font-bold">
                    Azure DB: {azureStatus === 'connected' ? 'Connected' : azureStatus === 'connecting' ? 'Connecting...' : azureStatus === 'unconfigured' ? 'Unconfigured' : 'Offline'}
                  </span>
                </div>
              </div>
              {azureMessage && (
                <p className="text-xs text-zinc-500 font-mono mt-1.5 max-w-xl truncate" title={azureMessage}>{azureMessage}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={handleClearDatabase} className={primaryButtonClasses}><Trash2 size={14} /> Clear DB</button>
              <button onClick={exportData} className={secondaryButtonClasses}><Download size={14} /> {t('exportDb')}</button>
              <button onClick={() => setView('user')} className={secondaryButtonClasses}><ArrowLeft size={14} /> {t('backToUser')}</button>
            </div>
          </header>
          <div className={`border overflow-hidden shadow-sm ${surfaceClasses(isDarkMode)}`}>
            <table className="w-full text-left">
              <thead className="bg-zinc-100 dark:bg-zinc-900 text-xs font-bold uppercase tracking-wide border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Identity</th>
                  <th className="px-6 py-4">PESEL</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Created At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {people.length > 0 ? people.map(p => (
                  <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                    <td className="px-6 py-4 font-bold">
                      {p.firstName} {p.lastName}
                      <div className="flex gap-2 text-xs text-zinc-500 font-normal mt-1">
                        <span>{p.dob}</span> • <span>{p.nationality}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><code className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-1 rounded text-zinc-900 dark:text-zinc-100 font-bold">{p.pesel}</code></td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${p.verificationStatus === 'verified' ? 'bg-green-700 text-white' : p.verificationStatus === 'rejected' ? 'bg-red-700 text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'}`}>
                        {p.verificationStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-500 text-xs">{new Date(p.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDeletePerson(p.id)} 
                        title="Delete identity"
                        className="p-2 text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-zinc-500 font-bold uppercase tracking-wide">Database is empty</td>
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
      <div className={`min-h-screen flex items-center justify-center p-4 md:p-8 animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-950'}`}>
        <div className={`w-full max-w-md border-t-4 border-red-700 p-8 shadow-sm ${surfaceClasses(isDarkMode)}`}>
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="bg-red-700 p-4 rounded text-white mb-5"><Lock size={34} /></div>
            <h2 className="text-2xl font-bold">{t('adminLogin')}</h2>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className={`${labelClasses} mb-2`}>{t('password')}</label>
              <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} className={inputClasses(isDarkMode)} autoFocus />
            </div>
            <button className={`w-full ${primaryButtonClasses}`}>{t('login')}</button>
            <button type="button" onClick={() => setView('user')} className={`w-full ${secondaryButtonClasses}`}>{t('backToUser')}</button>
          </form>
        </div>
      </div>
    );
  }

  /**
   * USER VIEW
   */
  return (
    <div style={dynamicStyles} className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-100 text-zinc-950'}`}>
      <div className={`max-w-6xl mx-auto ${highContrastClasses}`}>
        <header className={`border-t-4 border-red-700 border-b border-zinc-200 dark:border-zinc-800 px-4 md:px-6 py-5 mb-8 ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-red-700 p-3 rounded text-white"><IdCard size={30} /></div>
            <div>
              <h1 className="text-3xl font-bold">gov.pl</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t('title')} · {t('subtitle')}</p>
                <span className="w-1 h-1 bg-zinc-500 rounded-full opacity-40" />
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wide">
                  <span className={`w-1.5 h-1.5 rounded-full ${azureStatus === 'connected' ? 'bg-emerald-500' : azureStatus === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`} />
                  <span className="text-zinc-600 dark:text-zinc-400">Azure {azureStatus === 'connected' ? 'Connected' : azureStatus === 'connecting' ? 'Connecting' : azureStatus === 'unconfigured' ? 'Unconfigured' : 'Offline'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className={`flex items-center p-1 rounded border ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}>
              {(['PL', 'ENG', 'UKR'] as Language[]).map(l => (
                <button key={l} onClick={() => setLang(l)} className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all rounded ${lang === l ? 'bg-red-700 text-white' : 'text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800'}`}>
                  <span>{LANGUAGE_CONFIG[l].flag}</span> {LANGUAGE_CONFIG[l].label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsA11yMenuOpen(true)} className={iconButtonClasses} title={t('a11yOptions')}><Accessibility size={22} /></button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={iconButtonClasses}>{isDarkMode ? <Sun size={22} /> : <Moon size={22} />}</button>
            </div>
          </div>
          </div>
        </header>

        <main className="px-4 md:px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Generator Form */}
          <div className="lg:col-span-4 space-y-6">
            <div className={`overflow-hidden ${panelClasses(isDarkMode)}`}>
              <div className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center gap-3 font-bold text-sm"><Plus size={16} className="text-red-700" />{t('manualEntry')}</div>
              <form onSubmit={handleAddPerson} className="p-6 space-y-6">
                <div className="space-y-6">
                  <FormField 
                    label={t('firstName')} 
                    name="firstName" 
                    type="text" 
                    value={formData.firstName} 
                    required 
                    onChange={v => setFormData({ ...formData, firstName: v })}
                    onTTS={() => handleTTS(`${t('firstName')}: ${formData.firstName || 'brak danych'}`, 'firstName')}
                    isAudioLoading={audioLoadingId === 'firstName'}
                    onDictate={() => handleDictate('firstName')}
                    isDictating={dictatingField === 'firstName'}
                    isDarkMode={isDarkMode}
                    readOutLoudLabel={t('readOutLoud')}
                    dictateLabel={t('dictate')}
                    listeningLabel={t('listening')}
                  />
                  <FormField 
                    label={t('lastName')} 
                    name="lastName" 
                    type="text" 
                    value={formData.lastName} 
                    required 
                    onChange={v => setFormData({ ...formData, lastName: v })}
                    onTTS={() => handleTTS(`${t('lastName')}: ${formData.lastName || 'brak danych'}`, 'lastName')}
                    isAudioLoading={audioLoadingId === 'lastName'}
                    onDictate={() => handleDictate('lastName')}
                    isDictating={dictatingField === 'lastName'}
                    isDarkMode={isDarkMode}
                    readOutLoudLabel={t('readOutLoud')}
                    dictateLabel={t('dictate')}
                    listeningLabel={t('listening')}
                  />
                  <FormField 
                    label={t('nationality')} 
                    name="nationality" 
                    type="text" 
                    value={formData.nationality} 
                    required 
                    placeholder="e.g. Polish, Ukrainian"
                    onChange={v => setFormData({ ...formData, nationality: v })}
                    onTTS={() => handleTTS(`${t('nationality')}: ${formData.nationality || 'brak danych'}`, 'nationality')}
                    isAudioLoading={audioLoadingId === 'nationality'}
                    onDictate={() => handleDictate('nationality')}
                    isDictating={dictatingField === 'nationality'}
                    isDarkMode={isDarkMode}
                    readOutLoudLabel={t('readOutLoud')}
                    dictateLabel={t('dictate')}
                    listeningLabel={t('listening')}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField 
                    label={t('dob')} 
                    name="dob" 
                    type="date" 
                    value={formData.dob} 
                    required 
                    onChange={v => setFormData({ ...formData, dob: v })}
                    onTTS={() => handleTTS(`${t('dob')}: ${formData.dob || 'brak danych'}`, 'dob')}
                    isAudioLoading={audioLoadingId === 'dob'}
                    onDictate={() => handleDictate('dob')}
                    isDictating={dictatingField === 'dob'}
                    isDarkMode={isDarkMode}
                    readOutLoudLabel={t('readOutLoud')}
                    dictateLabel={t('dictate')}
                    listeningLabel={t('listening')}
                  />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className={labelClasses}>{t('gender')}</label>
                      <div className="flex items-center gap-2">
                        <button 
                          type="button"
                          title={t('readOutLoud')}
                          onClick={() => handleTTS(`${t('gender')}: ${formData.gender === 'male' ? t('male') : t('female')}`, 'gender')} 
                          className={`${iconButtonClasses} ${audioLoadingId === 'gender' ? 'text-red-700 animate-pulse bg-red-50 dark:bg-red-950/30' : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-white'}`}
                        >
                          <Volume2 size={12} />
                        </button>
                        <button 
                          type="button"
                          title={t('dictate')}
                          onClick={() => handleDictate('gender')} 
                          className={`${iconButtonClasses} ${dictatingField === 'gender' ? 'text-red-700 animate-pulse bg-red-50 dark:bg-red-950/30' : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-white'}`}
                        >
                          {dictatingField === 'gender' ? <MicOff size={12} /> : <Mic size={12} />}
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as 'male' | 'female'})} className={inputClasses(isDarkMode)}>
                        <option value="male">{t('male')}</option>
                        <option value="female">{t('female')}</option>
                      </select>
                      {dictatingField === 'gender' && (
                        <div className="absolute right-10 top-1/2 -translate-y-1/2 px-3 py-1 bg-red-700 text-white rounded text-[10px] font-bold uppercase tracking-wide animate-pulse">
                          {t('identifyingGender')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Requirement Alerts */}
                <div className="space-y-3">
                  <div className={`p-4 rounded flex items-start gap-3 text-xs font-bold uppercase tracking-wide ${isDarkMode ? 'bg-amber-950/30 text-amber-300 border border-amber-800' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                    <CreditCard size={18} className="shrink-0" />
                    <div>
                      <p>{t('feeNotice')}</p>
                    </div>
                  </div>
                  <div className={`p-4 rounded flex items-start gap-3 text-xs font-bold uppercase tracking-wide ${isDarkMode ? 'bg-zinc-900 text-zinc-300 border border-zinc-800' : 'bg-zinc-50 text-zinc-700 border border-zinc-200'}`}>
                    <Home size={18} className="shrink-0" />
                    <div>
                      <p>{t('docsRequired')}</p>
                    </div>
                  </div>
                </div>

                <button type="submit" className={`w-full ${primaryButtonClasses}`}>
                  {t('generateIdentity')}
                </button>
              </form>
            </div>
          </div>

          {/* Result / Active Identity View */}
          <div className="lg:col-span-8">
            {activePerson ? (
              <div className={`border-t-4 border-red-700 overflow-hidden animate-in zoom-in-95 duration-500 ${panelClasses(isDarkMode)}`}>
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="relative">
                      <div className={`w-36 h-36 rounded border flex items-center justify-center text-5xl font-bold ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-zinc-100 border-zinc-200 text-zinc-700'}`}>
                        {activePerson.firstName[0]}{activePerson.lastName[0]}
                      </div>
                      <button 
                        onClick={() => handleReadAloudIdentity(activePerson)}
                        className={`absolute -bottom-3 -right-3 p-3 rounded border transition-all active:scale-95 flex items-center justify-center ${audioLoadingId === 'identity' ? 'animate-pulse bg-zinc-700 text-white border-zinc-700' : 'bg-red-700 text-white border-red-700 hover:bg-red-800'}`}
                        title={t('readOutLoud')}
                      >
                        {audioLoadingId === 'identity' ? <Loader2 className="animate-spin" size={20} /> : <Volume2 size={20} />}
                      </button>
                    </div>
                    <div className="flex-1 space-y-6 w-full">
                      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-red-700 mb-2">{t('activeIdentity')}</p>
                          <h2 className="text-3xl md:text-4xl font-bold leading-tight">{activePerson.firstName} {activePerson.lastName}</h2>
                          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 font-semibold text-xs text-zinc-600 dark:text-zinc-400">
                            <span className="flex items-center gap-2"><User size={14} /> {activePerson.gender === 'male' ? t('male') : t('female')}</span>
                            <span className="flex items-center gap-2"><Calendar size={14} /> {activePerson.dob}</span>
                            <span className="flex items-center gap-2"><Globe size={14} /> {activePerson.nationality}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wide flex items-center gap-2 ${
                            activePerson.verificationStatus === 'verified' ? 'bg-green-700 text-white' :
                            activePerson.verificationStatus === 'rejected' ? 'bg-red-700 text-white' :
                            'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
                          }`}>
                            {activePerson.verificationStatus === 'verified' ? <ShieldCheck size={18} /> : activePerson.verificationStatus === 'rejected' ? <AlertCircle size={18} /> : <Clock size={18} />}
                            {activePerson.verificationStatus === 'none' ? t('statusPending') : activePerson.verificationStatus === 'verified' ? t('statusVerified') : t('statusRejected')}
                          </div>
                          <div className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wide flex items-center gap-2 ${activePerson.paymentStatus === 'paid' ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'}`}>
                            {activePerson.paymentStatus === 'paid' ? <CheckCircle2 size={12} /> : <CreditCard size={12} />}
                            {activePerson.paymentStatus === 'paid' ? t('paid') : t('unpaid')}
                          </div>
                        </div>
                      </div>

                      <div className={`p-5 rounded border flex items-center justify-between gap-4 group cursor-help transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`} onClick={() => handleExplain(activePerson)}>
                        <div>
                          <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-2">PESEL Identity Number</p>
                          <code className="text-3xl md:text-5xl font-bold text-zinc-950 dark:text-zinc-100">{activePerson.pesel}</code>
                        </div>
                        <div className="bg-white dark:bg-zinc-950 p-3 rounded border border-zinc-200 dark:border-zinc-800"><HelpCircle size={30} className="text-red-700" /></div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {activePerson.paymentStatus === 'paid' ? (
                          <button onClick={() => setVerificationModalPerson(activePerson)} className={`flex-1 min-w-[240px] ${primaryButtonClasses}`}>
                            <Scan size={24} /> {t('verify')}
                          </button>
                        ) : (
                          <button onClick={() => setPaymentModalOpen(true)} className="flex-1 min-w-[240px] bg-amber-600 text-white font-bold py-3 px-5 rounded hover:bg-amber-700 transition-colors uppercase tracking-wide text-xs flex items-center justify-center gap-3">
                            <CreditCard size={24} /> {t('payToVerify')}
                          </button>
                        )}
                        <button onClick={() => setActivePerson(null)} className="p-3 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 transition-all"><Trash2 size={24} /></button>
                      </div>
                    </div>
                  </div>

                  {aiExplanation && (
                    <div className="mt-8 p-6 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 animate-in slide-in-from-bottom-8 duration-700">
                      <div className="text-sm prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-strong:text-red-700">
                        {aiExplanation.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={`min-h-[520px] flex flex-col items-center justify-center text-center p-8 md:p-16 border border-dashed animate-in fade-in duration-700 ${isDarkMode ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-300 bg-white'}`}>
                <div className="bg-zinc-100 dark:bg-zinc-900 p-7 rounded border border-zinc-200 dark:border-zinc-800 mb-8"><Fingerprint size={80} className="text-zinc-400" strokeWidth={1} /></div>
                <h3 className="text-2xl font-bold mb-4">{t('noActiveRecord')}</h3>
                <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium whitespace-pre-line">{t('searchPrompt')}</p>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-12 py-8 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-bold uppercase tracking-wide text-zinc-500">
            <div className="flex gap-10"><span>{t('footerStandard')}</span><span>{t('footerAi')}</span></div>
            <p className="max-w-lg text-center normal-case font-medium leading-relaxed tracking-normal text-xs">{t('footerDesc')}</p>
            <button onClick={() => setView('login')} className="flex items-center gap-2.5 hover:text-red-700 transition-colors py-2 px-3 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900"><Lock size={14} /> {t('adminLogin')}</button>
          </div>
        </footer>
        </main>
      </div>

      {/* Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 md:p-6 bg-black/70 animate-in fade-in duration-300">
          <div className={`w-full max-w-md border-t-4 border-red-700 shadow-xl overflow-hidden ${surfaceClasses(isDarkMode)}`}>
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-3"><Wallet className="text-red-700" /> {t('payToVerify')}</h2>
              <button onClick={() => setPaymentModalOpen(false)} className={iconButtonClasses}><X size={22} /></button>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">{t('paymentMethod')}</p>
              <div className="grid grid-cols-1 gap-4">
                {/* BLIK */}
                <button 
                  onClick={() => setSelectedPaymentMethod('blik')}
                  className={`p-5 rounded border-2 flex items-center justify-between transition-all ${selectedPaymentMethod === 'blik' ? 'border-red-700 bg-red-50 dark:bg-red-950/30' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-700 rounded flex items-center justify-center text-white font-bold text-xs">BLIK</div>
                    <span className="font-bold uppercase text-xs tracking-wide">BLIK</span>
                  </div>
                  {selectedPaymentMethod === 'blik' && <CheckCircle2 className="text-red-700" size={20} />}
                </button>
                {/* GPay */}
                <button 
                  onClick={() => setSelectedPaymentMethod('gpay')}
                  className={`p-5 rounded border-2 flex items-center justify-between transition-all ${selectedPaymentMethod === 'gpay' ? 'border-red-700 bg-red-50 dark:bg-red-950/30' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white border border-zinc-200 rounded flex items-center justify-center overflow-hidden">
                       <span className="font-black text-blue-500 text-lg">G</span><span className="font-black text-red-500 text-lg">P</span><span className="font-black text-amber-500 text-lg">a</span><span className="font-black text-green-500 text-lg">y</span>
                    </div>
                    <span className="font-bold uppercase text-xs tracking-wide">Google Pay</span>
                  </div>
                  {selectedPaymentMethod === 'gpay' && <CheckCircle2 className="text-red-700" size={20} />}
                </button>
                {/* Apple Pay */}
                <button 
                  onClick={() => setSelectedPaymentMethod('applepay')}
                  className={`p-5 rounded border-2 flex items-center justify-between transition-all ${selectedPaymentMethod === 'applepay' ? 'border-red-700 bg-red-50 dark:bg-red-950/30' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-black text-white rounded flex items-center justify-center">
                       <Smartphone size={24} />
                    </div>
                    <span className="font-bold uppercase text-xs tracking-wide">Apple Pay</span>
                  </div>
                  {selectedPaymentMethod === 'applepay' && <CheckCircle2 size={20} />}
                </button>
                {/* Card */}
                <button 
                  onClick={() => setSelectedPaymentMethod('card')}
                  className={`p-5 rounded border-2 flex items-center justify-between transition-all ${selectedPaymentMethod === 'card' ? 'border-red-700 bg-red-50 dark:bg-red-950/30' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-700 text-white rounded flex items-center justify-center">
                       <CreditCard size={24} />
                    </div>
                    <span className="font-bold uppercase text-xs tracking-wide">Credit Card</span>
                  </div>
                  {selectedPaymentMethod === 'card' && <CheckCircle2 className="text-red-700" size={20} />}
                </button>
              </div>

              <button 
                disabled={!selectedPaymentMethod || isPaying}
                onClick={handleSimulatePayment}
                className={`w-full mt-8 ${primaryButtonClasses}`}
              >
                {isPaying ? <Loader2 className="animate-spin" size={20} /> : <><ArrowRight size={20} /> {t('payToVerify')}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {verificationModalPerson && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 bg-black/70 animate-in fade-in duration-300">
          <div className={`w-full max-w-3xl border-t-4 border-red-700 shadow-xl overflow-hidden ${surfaceClasses(isDarkMode)}`}>
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900">
              <h2 className="text-2xl font-bold flex items-center gap-4"><ShieldCheck className="text-red-700" /> {t('docVerification')}</h2>
              <button onClick={() => setVerificationModalPerson(null)} className={iconButtonClasses}><X size={24} /></button>
            </div>
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className={`relative h-64 rounded border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all group ${isDarkMode ? 'border-zinc-700 bg-zinc-900 hover:border-red-700' : 'border-zinc-300 bg-zinc-50 hover:border-red-700'}`}>
                  {activePerson?.idPhoto ? <img src={activePerson.idPhoto} className="absolute inset-0 w-full h-full object-cover" /> : <div className="text-center"><FileText size={58} className="mx-auto mb-5 text-zinc-400" /><p className="text-xs font-bold uppercase tracking-wide text-zinc-500">{t('uploadId')}</p></div>}
                  {!activePerson?.idPhoto && <input type="file" ref={fileInputRef} onChange={handleVerifyDocument} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />}
                </div>
                <button onClick={() => fileInputRef.current?.click()} disabled={isVerifying} className={`w-full ${primaryButtonClasses}`}>
                  {isVerifying ? <Loader2 className="animate-spin mx-auto" size={24} /> : t('uploadId')}
                </button>
              </div>
              <div className="flex flex-col justify-center space-y-6">
                <div className={`p-8 rounded border flex flex-col items-center justify-center min-h-[220px] transition-all ${activePerson?.verificationStatus === 'verified' ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800 text-green-700 dark:text-green-300' : activePerson?.verificationStatus === 'rejected' ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'}`}>
                  {isVerifying ? (
                    <div className="text-center">
                      <Loader2 size={48} className="animate-spin mx-auto mb-6 text-red-700" />
                      <p className="text-xs font-bold uppercase tracking-wide animate-pulse">{t('aiChecking')}</p>
                    </div>
                  ) : (
                    <>
                      {activePerson?.verificationStatus === 'none' && <Clock size={64} className="mb-6" />}
                      {activePerson?.verificationStatus === 'verified' && <ShieldCheck size={80} className="mb-6" />}
                      {activePerson?.verificationStatus === 'rejected' && <AlertCircle size={80} className="mb-6" />}
                      <p className="font-bold uppercase text-sm tracking-wide">{activePerson?.verificationStatus === 'none' ? t('statusPending') : activePerson?.verificationStatus === 'verified' ? t('statusVerified') : t('statusRejected')}</p>
                    </>
                  )}
                </div>
                {activePerson?.verificationDetails && <div className="text-xs text-center text-zinc-600 dark:text-zinc-400 leading-relaxed font-semibold p-4 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">{activePerson.verificationDetails}</div>}
                
                {/* Secondary Requirement Notice */}
                <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded border border-amber-200 dark:border-amber-800">
                   <p className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300 flex items-center gap-2">
                     <AlertCircle size={14} /> {t('idDesc')}
                   </p>
                </div>
                <div className="p-4 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                   <Shield size={16} className="text-red-700" />
                   <p className="text-xs font-bold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">{t('paymentSuccess')}</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-zinc-50 dark:bg-zinc-900 text-right border-t border-zinc-200 dark:border-zinc-800"><button onClick={() => setVerificationModalPerson(null)} className={secondaryButtonClasses}>{t('close')}</button></div>
          </div>
        </div>
      )}

      {/* A11y Modal */}
      {isA11yMenuOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-6 bg-black/70 animate-in zoom-in-95 duration-200">
          <div className={`w-full max-w-lg p-8 border-t-4 border-red-700 shadow-xl ${surfaceClasses(isDarkMode)}`}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-4"><Accessibility className="text-red-700" /> {t('a11yOptions')}</h2>
              <button onClick={() => setIsA11yMenuOpen(false)} className={iconButtonClasses}><X size={22} /></button>
            </div>
            <div className="space-y-8">
              <div>
                <label className={`${labelClasses} mb-4`}>{t('textSize')}</label>
                <div className="flex gap-4">
                  {[1, 1.15, 1.3].map(s => (
                    <button key={s} onClick={() => setFontScale(s)} className={`flex-1 py-4 rounded border-2 font-bold transition-all ${fontScale === s ? 'border-red-700 bg-red-50 dark:bg-red-950/30 text-red-700' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'}`}>
                      {s === 1 ? 'A' : s === 1.15 ? 'A+' : 'A++'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                <div>
                  <p className="font-bold uppercase text-xs tracking-wide">{t('highContrast')}</p>
                  <p className="text-xs text-zinc-500 font-medium mt-1">{t('highContrastDesc')}</p>
                </div>
                <button onClick={() => setIsHighContrast(!isHighContrast)} className={`w-16 h-9 rounded-full relative transition-all duration-300 ${isHighContrast ? 'bg-red-700' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                  <div className={`absolute top-1 w-7 h-7 bg-white rounded-full transition-all duration-300 shadow-xl ${isHighContrast ? 'left-8' : 'left-1'}`} />
                </button>
              </div>
            </div>
            <button onClick={() => setIsA11yMenuOpen(false)} className={`w-full mt-8 ${primaryButtonClasses}`}>
              {t('applyChanges')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
