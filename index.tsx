
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback
} from "react";
import { createRoot } from "react-dom/client";

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
} from "lucide-react";

// GOV.PL UI Components
import { GovContainer } from "./components/gov/gov-container";
import { GovHeader } from "./components/gov/gov-header";
import { GovSection } from "./components/gov/gov-select";
import { GovInput } from "./components/gov/gov-input";
import { GovButton } from "./components/gov/gov-button";
import "./components/gov/gov-theme.css";

// Core logic
import { generatePESEL, getPeselExplanation } from "./utils/pesel";
import { TRANSLATIONS } from "./locales/translations";

// UI + App Constants
import {
  LANGUAGES,
  LANGUAGE_CONFIG,
  FONT_SCALES,
  surfaceClasses,
  panelClasses,
  inputClasses,
  labelClasses,
  iconButtonClasses,
  primaryButtonClasses,
  secondaryButtonClasses,
  ADMIN_PASS,
  Language
} from "./utils/constants";

// Hooks
import { useAudio } from "./hooks/useAudio";

// Types
type VerificationStatus = "none" | "pending" | "verified" | "rejected";
type PaymentStatus = "unpaid" | "processing" | "paid";
type PaymentMethod = "card" | "gpay" | "applepay" | "blik" | null;
type View = "user" | "login" | "admin";

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: "male" | "female";
  nationality: string;
  pesel: string;
  createdAt: number;
  verificationStatus: VerificationStatus;
  paymentStatus: PaymentStatus;
  verificationDetails?: string;
  idPhoto?: string;
}


// Update a person in the list or prepend if new
const updatePersonInList = (people: Person[], updated: Person): Person[] => {
  return people.some(p => p.id === updated.id)
    ? people.map(p => (p.id === updated.id ? updated : p))
    : [updated, ...people];
};

// Shared form field props for reusable components
interface FormFieldProps {
  label: string;
  name: string;
  type: string;
  value: string;
  required?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;

  // Accessibility + Audio
  onTTS: () => void;
  isAudioLoading: boolean;
  onDictate: () => void;
  isDictating: boolean;

  // UI
  isDarkMode: boolean;
  readOutLoudLabel: string;
  dictateLabel: string;
  listeningLabel: string;
}


const FormFieldMemo = React.memo((props: FormFieldProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className={labelClasses}>{props.label}</label>
        <div className="flex items-center gap-2">
          <button type="button" title={props.readOutLoudLabel} onClick={props.onTTS} className={`${iconButtonClasses} ${props.isAudioLoading ? 'text-red-700 animate-pulse bg-red-50 dark:bg-red-950/30' : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-white'}`}>
            <Volume2 size={12} />
          </button>
          <button type="button" title={props.dictateLabel} onClick={props.onDictate} className={`${iconButtonClasses} ${props.isDictating ? 'text-red-700 animate-pulse bg-red-50 dark:bg-red-950/30' : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-white'}`}>
            {props.isDictating ? <MicOff size={12} /> : <Mic size={12} />}
          </button>
        </div>
      </div>
      <div className="relative">
        <input type={props.type} required={props.required} placeholder={props.placeholder} value={props.value} onChange={e => props.onChange(e.target.value)} className={inputClasses(props.isDarkMode)} />
        {props.isDictating && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1 bg-red-700 text-white rounded text-[10px] font-bold uppercase tracking-wide animate-in fade-in zoom-in">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            {props.listeningLabel}
          </div>
        )}
      </div>
    </div>
  );
});

const FormField: React.FC<FormFieldProps> = (props) => <FormFieldMemo {...props} />;

/**
 * Main App
 */
const App: React.FC = () => {
  // View / Navigation
  const [view, setView] = useState<View>("user");

  // People & Active Identity
  const [people, setPeople] = useState<Person[]>([]);
  const [activePerson, setActivePerson] = useState<Person | null>(null);

  // Theme & Accessibility
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("pesel_theme") === "dark"
  );
  const [lang, setLang] = useState<Language>(
    () => (localStorage.getItem("pesel_lang") as Language) || "PL"
  );
  const [isA11yMenuOpen, setIsA11yMenuOpen] = useState(false);
  const [fontScale, setFontScale] = useState(
    () => Number(localStorage.getItem("pesel_font_scale")) || 1
  );
  const [isHighContrast, setIsHighContrast] = useState(
    () => localStorage.getItem("pesel_high_contrast") === "true"
  );

  // Form Data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "male" as "male" | "female",
    nationality: ""
  });

  // Admin
  const [adminPass, setAdminPass] = useState("");

  // Verification & Payment
  const [verificationModalPerson, setVerificationModalPerson] =
    useState<Person | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // AI Explanation
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  // File Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio Hook
  const {
    audioLoadingId,
    dictatingField,
    handleTTS: hookHandleTTS,
    handleDictate: hookHandleDictate
  } = useAudio(lang);

  // Azure Backend Status
  const [azureStatus, setAzureStatus] = useState<
    "connecting" | "connected" | "disconnected" | "unconfigured"
  >("connecting");
  const [azureMessage, setAzureMessage] = useState<string>("");


  // Translation helper (clean + safe fallback)
const t = (key: keyof typeof TRANSLATIONS["PL"]) =>
  TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS["PL"][key];

/**
 * Upload a document to Supabase Storage via backend route.
 * Returns a signed URL for immediate preview.
 */
const uploadDocumentToSupabase = async (
  file: File,
  personId: string
): Promise<string | null> => {
  try {
    const fileExtension = file.name.split(".").pop();
    const fileName = `${personId}_${Date.now()}.${fileExtension}`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", fileName);

    const res = await fetch("/api/upload-document", {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      throw new Error("HTTP " + res.status);
    }

    const { signedUrl } = await res.json();
    console.log("Document uploaded to Supabase Storage:", signedUrl);

    return signedUrl;
  } catch (err) {
    console.error("Failed to upload document to Supabase Storage:", err);
    return null;
  }
};

/**
 * Sync a person record to Supabase via backend route.
 * Replaces old Azure Cosmos DB sync.
 */
const syncPersonToSupabase = async (person: Person) => {
  try {
    const res = await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(person)
    });

    if (!res.ok) {
      throw new Error("HTTP " + res.status);
    }

    console.log("Successfully synchronized to Supabase:", person.pesel);
  } catch (err) {
    console.warn("Could not sync to Supabase:", err);
  }
};


  const handleDeletePerson = async (id: string) => {
  if (confirm("Permanently delete this record from Supabase and local vault?")) {
    try {
      await fetch(`/api/people/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete from Supabase:", err);
    }

    setPeople(prev => prev.filter(p => p.id !== id));
  }
};

const handleClearDatabase = async () => {
  if (
    confirm(
      "Are you absolutely sure you want to delete ALL records from the Supabase database and local cache?"
    )
  ) {
    try {
      await fetch("/api/people", { method: "DELETE" });
    } catch (err) {
      console.error("Failed to clear database on Supabase:", err);
    }

    setPeople([]);
    localStorage.removeItem("pesel_vault_admin");
  }
};

useEffect(() => {
  const controller = new AbortController();

  // Backend health check
  fetch("/api/health", { signal: controller.signal })
    .then(res => res.json())
    .then(data => {
      if (data.status === "connected") {
        setAzureStatus("connected");
        setAzureMessage(data.message);
      } else {
        const unconfigured =
          data.message.includes("Config") ||
          data.message.includes("Missing");

        setAzureStatus(unconfigured ? "unconfigured" : "disconnected");
        setAzureMessage(data.message);
      }
    })
    .catch(err => {
      if (err.name !== "AbortError") {
        setAzureStatus("disconnected");
        setAzureMessage(err.message || "Error checking connection.");
      }
    });

  // Fetch people list
  fetch("/api/people", { signal: controller.signal })
    .then(res => {
      if (!res.ok) throw new Error("Query failure");
      return res.json();
    })
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setPeople(data);
      } else {
        const saved = localStorage.getItem("pesel_vault_admin");
        if (saved) setPeople(JSON.parse(saved));
      }
    })
    .catch(err => {
      if (err.name !== "AbortError") {
        console.warn("Using offline localStorage fallback for lists:", err);
        const saved = localStorage.getItem("pesel_vault_admin");
        if (saved) setPeople(JSON.parse(saved));
      }
    });

  return () => controller.abort();
}, []);


 // Persist admin vault to localStorage
useEffect(() => {
  localStorage.setItem("pesel_vault_admin", JSON.stringify(people));
}, [people]);

// Persist theme, language, accessibility settings
useEffect(() => {
  document.documentElement.classList.toggle("dark", isDarkMode);

  localStorage.setItem("pesel_theme", isDarkMode ? "dark" : "light");
  localStorage.setItem("pesel_lang", lang);
  localStorage.setItem("pesel_font_scale", fontScale.toString());
  localStorage.setItem("pesel_high_contrast", isHighContrast.toString());
}, [isDarkMode, lang, fontScale, isHighContrast]);

// Text‑to‑speech wrapper
const handleTTS = useCallback(
  (text: string, id: string = "tts") => hookHandleTTS(text, id),
  [hookHandleTTS]
);

// Dictation handler
const handleDictate = useCallback(
  (fieldName: keyof typeof formData) => {
    hookHandleDictate(fieldName, transcript => {
      if (fieldName === "gender") {
        const tLower = transcript.toLowerCase();

        if (tLower.includes("m") || tLower.includes("ч")) {
          setFormData(prev => ({ ...prev, gender: "male" }));
        } else if (
          tLower.includes("f") ||
          tLower.includes("w") ||
          tLower.includes("ж")
        ) {
          setFormData(prev => ({ ...prev, gender: "female" }));
        }
      } else {
        setFormData(prev => ({ ...prev, [fieldName]: transcript }));
      }
    });
  },
  [hookHandleDictate]
);

// Add new person
const handleAddPerson = (e: React.FormEvent) => {
  e.preventDefault();

  if (
    !formData.firstName ||
    !formData.lastName ||
    !formData.dob ||
    !formData.nationality
  )
    return;

  const newPerson: Person = {
    id: crypto.randomUUID(),
    ...formData,
    pesel: generatePESEL(new Date(formData.dob), formData.gender),
    createdAt: Date.now(),
    verificationStatus: "none",
    paymentStatus: "unpaid"
  };

  setPeople(prev => {
    const exists = prev.some(p => p.id === newPerson.id);
    return exists
      ? prev.map(p => (p.id === newPerson.id ? newPerson : p))
      : [newPerson, ...prev];
  });

  // Supabase sync (replaces Azure)
  syncPersonToSupabase(newPerson);

  setActivePerson(newPerson);

  setFormData({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "male",
    nationality: ""
  });
};

  const handleSimulatePayment = () => {
  if (!selectedPaymentMethod || !activePerson) return;

  setIsPaying(true);

  setTimeout(() => {
    const updated: Person = {
      ...activePerson,
      paymentStatus: "paid"
    };

    setActivePerson(updated);

    setPeople(prev => {
      const exists = prev.some(p => p.id === updated.id);
      return exists
        ? prev.map(p => (p.id === updated.id ? updated : p))
        : [updated, ...prev];
    });

    // Supabase sync (replaces Azure)
    syncPersonToSupabase(updated);

    setIsPaying(false);
    setPaymentModalOpen(false);
    setSelectedPaymentMethod(null);
  }, 2000);
};

const handleReadAloudIdentity = (person: Person) => {
  const textToRead =
    lang === "PL"
      ? `Oto tożsamość dla: ${person.firstName} ${person.lastName}. Obywatelstwo: ${person.nationality}. Data urodzenia: ${person.dob}. Numer PESEL to: ${person.pesel}. Status weryfikacji: ${
          person.verificationStatus === "verified"
            ? "Zweryfikowany"
            : "W oczekiwaniu"
        }.`
      : lang === "UKR"
      ? `Ось особа для: ${person.firstName} ${person.lastName}. Громадянство: ${person.nationality}. Дата народження: ${person.dob}. Номер ПЕСЕЛЬ: ${person.pesel}. Статус верифікації: ${
          person.verificationStatus === "verified"
            ? "Підтверджено"
            : "Очікується"
        }.`
      : `Here is the identity for: ${person.firstName} ${person.lastName}. Nationality: ${person.nationality}. Date of birth: ${person.dob}. PESEL number is: ${person.pesel}. Verification status: ${
          person.verificationStatus === "verified" ? "Verified" : "Pending"
        }.`;

  handleTTS(textToRead, "identity");
};

const handleLogin = (e: React.FormEvent) => {
  e.preventDefault();

  if (adminPass === ADMIN_PASS) {
    setView("admin");
    setAdminPass("");
  } else {
    alert(t("invalidPass"));
  }
};

const exportData = () => {
  const blob = new Blob([JSON.stringify(people, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `pesel_vault_export_${new Date()
    .toISOString()
    .split("T")[0]}.json`;

  a.click();
};

const handleVerifyDocument = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];
  if (!file || !activePerson) return;

  setIsVerifying(true);

  try {
    const documentUrl = await uploadDocumentToSupabase(
      file,
      activePerson.id
    );

    const status: VerificationStatus = "pending";

    const feedback =
      lang === "PL"
        ? `Dokument wgrany i oczekuje na ręczną weryfikację dla: ${activePerson.firstName} ${activePerson.lastName}.`
        : lang === "UKR"
        ? `Документ завантажено і очікує ручної верифікації для: ${activePerson.firstName} ${activePerson.lastName}.`
        : `Document uploaded and pending manual verification for: ${activePerson.firstName} ${activePerson.lastName}.`;

    const updated: Person = {
      ...activePerson,
      verificationStatus: status,
      verificationDetails: feedback,
      idPhoto: documentUrl || ""
    };

    setActivePerson(updated);

    setPeople(prev => {
      const exists = prev.some(p => p.id === updated.id);
      return exists
        ? prev.map(p => (p.id === updated.id ? updated : p))
        : [updated, ...prev];
    });

    // Supabase sync (replaces Azure)
    syncPersonToSupabase(updated);
  } finally {
    setIsVerifying(false);
    setVerificationModalPerson(null);
  }
};

      setPeople(prev => {
  const exists = prev.some(p => p.pesel === updated.pesel);
  return exists ? prev : [updated, ...prev];
});

// Supabase sync (replaces Azure)
try {
  const run = async () => {
    await syncPersonToSupabase(updated);
    setActivePerson(updated);
  };

  run();
} catch (err) {
  console.error("Document upload error:", err);
} finally {
  setIsVerifying(false);
}


const handleExplain = (person: Person) => {
  const explanation = getPeselExplanation(
    person.pesel,
    person.firstName,
    person.dob,
    person.gender,
    lang
  );
  setAiExplanation(explanation);
};

const dynamicStyles = useMemo(
  () => ({ fontSize: `${fontScale}rem` }),
  [fontScale]
);

const highContrastClasses = useMemo(
  () =>
    isHighContrast
      ? isDarkMode
        ? "contrast-125 border-white shadow-none"
        : "contrast-150 border-black shadow-none"
      : "",
  [isHighContrast, isDarkMode]
);

if (view === "admin") {
  return (
    <div
      className={`min-h-screen p-4 md:p-8 animate-in fade-in duration-500 ${
        isDarkMode
          ? "bg-zinc-950 text-white"
          : "bg-zinc-100 text-zinc-950"
      }`}
    >
      <GovContainer className={`space-y-8 ${highContrastClasses}`}>
        <GovHeader
          className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b ${surfaceClasses(
            isDarkMode
          )}`}
        >
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Database className="text-red-700" /> {t("adminPanel")}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="text-zinc-600 dark:text-zinc-400 text-sm">
                {t("totalRecords")}: {people.length}
              </span>

              <span className="w-1 h-1 bg-zinc-500 rounded-full opacity-40" />

              {/* Supabase DB Status */}
              <div className="flex items-center gap-1.5 text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    azureStatus === "connected"
                      ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-pulse"
                      : azureStatus === "connecting"
                      ? "bg-amber-500 animate-pulse"
                      : azureStatus === "unconfigured"
                      ? "bg-zinc-500"
                      : "bg-rose-500"
                  }`}
                />

                <span className="font-bold">
                  Supabase DB:{" "}
                  {azureStatus === "connected"
                    ? "Connected"
                    : azureStatus === "connecting"
                    ? "Connecting..."
                    : azureStatus === "unconfigured"
                    ? "Unconfigured"
                    : "Offline"}
                </span>
              </div>
            </div>

            {azureMessage && (
              <p
                className="text-xs text-zinc-500 font-mono mt-1.5 max-w-xl truncate"
                title={azureMessage}
              >
                {azureMessage}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <GovButton onClick={handleClearDatabase} variant="danger">
              <Trash2 size={14} /> Clear DB
            </GovButton>

            <GovButton onClick={exportData} variant="secondary">
              <Download size={14} /> {t("exportDb")}
            </GovButton>

            <GovButton onClick={() => setView("user")} variant="secondary">
              <ArrowLeft size={14} /> {t("backToUser")}
            </GovButton>
          </div>
        </GovHeader>

        {/* Admin Table */}
        <div
          className={`border overflow-hidden shadow-sm ${surfaceClasses(
            isDarkMode
          )}`}
        >
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
              {people.length > 0 ? (
                people.map(p => (
                  <tr
                    key={p.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold">
                      {p.firstName} {p.lastName}
                      <div className="flex gap-2 text-xs text-zinc-500 font-normal mt-1">
                        <span>{p.dob}</span> •{" "}
                        <span>{p.nationality}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <code className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-1 rounded text-zinc-900 dark:text-zinc-100 font-bold">
                        {p.pesel}
                      </code>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${
                          p.verificationStatus === "verified"
                            ? "bg-green-700 text-white"
                            : p.verificationStatus === "rejected"
                            ? "bg-red-700 text-white"
                            : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800"
                        }`}
                      >
                        {p.verificationStatus}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right text-zinc-500 text-xs">
                      {new Date(p.createdAt).toLocaleString()}
                    </td>

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
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-20 text-center text-zinc-500 font-bold uppercase tracking-wide"
                  >
                    Database is empty
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GovContainer>
    </div>
  );
}


  if (view === "login") {
  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 md:p-8 animate-in zoom-in-95 duration-300 ${
        isDarkMode
          ? "bg-zinc-950 text-white"
          : "bg-zinc-100 text-zinc-950"
      }`}
    >
      <div
        className={`w-full max-w-md border-t-4 border-red-700 p-8 shadow-sm ${surfaceClasses(
          isDarkMode
        )}`}
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-red-700 p-4 rounded text-white mb-5">
            <Lock size={34} />
          </div>
          <h2 className="text-2xl font-bold">{t("adminLogin")}</h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <GovInput
            type="password"
            label={t("password")}
            value={adminPass}
            onChange={e => setAdminPass(e.target.value)}
            autoFocus
          />

          <GovButton type="submit" variant="primary" className="w-full">
            {t("login")}
          </GovButton>

          <GovButton
            type="button"
            onClick={() => setView("user")}
            variant="secondary"
            className="w-full"
          >
            {t("backToUser")}
          </GovButton>
        </form>
      </div>
    </div>
  );
}


  return (
  <div
    style={dynamicStyles}
    className={`min-h-screen transition-colors duration-500 ${
      isDarkMode
        ? "bg-zinc-950 text-zinc-100"
        : "bg-zinc-100 text-zinc-950"
    }`}
  >
   <GovContainer className={highContrastClasses}>
  <GovHeader
    className={`border-b border-zinc-200 dark:border-zinc-800 mb-8 ${
      isDarkMode ? "bg-zinc-950" : "bg-white"
    }`}
  >
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
      
      {/* Left side: Logo + Title */}
      <div className="flex items-center gap-4">
        <div className="bg-red-700 p-3 rounded text-white">
          <IdCard size={30} />
        </div>

        <div>
          <h1 className="text-3xl font-bold">gov.pl</h1>

          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {t("title")} · {t("subtitle")}
            </p>

            <span className="w-1 h-1 bg-zinc-500 rounded-full opacity-40" />

            {/* Supabase DB Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wide">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  azureStatus === "connected"
                    ? "bg-emerald-500"
                    : azureStatus === "connecting"
                    ? "bg-amber-500 animate-pulse"
                    : azureStatus === "unconfigured"
                    ? "bg-zinc-500"
                    : "bg-rose-500"
                }`}
              />

              <span className="text-zinc-600 dark:text-zinc-400">
                Supabase{" "}
                {azureStatus === "connected"
                  ? "Connected"
                  : azureStatus === "connecting"
                  ? "Connecting"
                  : azureStatus === "unconfigured"
                  ? "Unconfigured"
                  : "Offline"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Language selector */}
      <div className="flex flex-wrap items-center gap-4">
        <div
          className={`flex items-center p-1 rounded border ${
            isDarkMode
              ? "bg-zinc-900 border-zinc-700"
              : "bg-zinc-50 border-zinc-200"
          }`}
        >
          {(["PL", "ENG", "UKR"] as Language[]).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all rounded ${
                lang === l
                  ? "bg-red-700 text-white"
                  : "text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"
              }`}
            >
              <span>{LANGUAGE_CONFIG[l].flag}</span>
              {LANGUAGE_CONFIG[l].label}
            </button>
          ))}
        </div>
      </div>

    </div> {/* ← THIS was missing */}
  </GovHeader>


{/* A11y + Theme Controls */}
<div className="flex gap-2">
  <button
    onClick={() => setIsA11yMenuOpen(true)}
    className={iconButtonClasses}
    title={t("a11yOptions")}
  >
    <Accessibility size={22} />
  </button>

  <button
    onClick={() => setIsDarkMode(!isDarkMode)}
    className={iconButtonClasses}
  >
    {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
  </button>
</div>

<main className="pb-12">
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
    {/* Generator Form */}
    <div className="lg:col-span-4 space-y-6">
      <GovSection
        className={`overflow-hidden border ${panelClasses(isDarkMode)}`}
      >
        <div className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center gap-3 font-bold text-sm">
          <Plus size={16} className="text-red-700" />
          {t("manualEntry")}
        </div>

        <form onSubmit={handleAddPerson} className="p-6 space-y-6">
          <GovSection>
            {/* First Name */}
            <FormField
              label={t("firstName")}
              name="firstName"
              type="text"
              value={formData.firstName}
              required
              onChange={v => setFormData({ ...formData, firstName: v })}
              onTTS={() =>
                handleTTS(
                  `${t("firstName")}: ${
                    formData.firstName || "brak danych"
                  }`,
                  "firstName"
                )
              }
              isAudioLoading={audioLoadingId === "firstName"}
              onDictate={() => handleDictate("firstName")}
              isDictating={dictatingField === "firstName"}
              isDarkMode={isDarkMode}
              readOutLoudLabel={t("readOutLoud")}
              dictateLabel={t("dictate")}
              listeningLabel={t("listening")}
            />

            {/* Last Name */}
            <FormField
              label={t("lastName")}
              name="lastName"
              type="text"
              value={formData.lastName}
              required
              onChange={v => setFormData({ ...formData, lastName: v })}
              onTTS={() =>
                handleTTS(
                  `${t("lastName")}: ${
                    formData.lastName || "brak danych"
                  }`,
                  "lastName"
                )
              }
              isAudioLoading={audioLoadingId === "lastName"}
              onDictate={() => handleDictate("lastName")}
              isDictating={dictatingField === "lastName"}
              isDarkMode={isDarkMode}
              readOutLoudLabel={t("readOutLoud")}
              dictateLabel={t("dictate")}
              listeningLabel={t("listening")}
            />

            {/* Nationality */}
            <FormField
              label={t("nationality")}
              name="nationality"
              type="text"
              value={formData.nationality}
              required
              placeholder="e.g. Polish, Ukrainian"
              onChange={v => setFormData({ ...formData, nationality: v })}
              onTTS={() =>
                handleTTS(
                  `${t("nationality")}: ${
                    formData.nationality || "brak danych"
                  }`,
                  "nationality"
                )
              }
              isAudioLoading={audioLoadingId === "nationality"}
              onDictate={() => handleDictate("nationality")}
              isDictating={dictatingField === "nationality"}
              isDarkMode={isDarkMode}
              readOutLoudLabel={t("readOutLoud")}
              dictateLabel={t("dictate")}
              listeningLabel={t("listening")}
            />
          </GovSection>

          {/* DOB + Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Date of Birth */}
            <FormField
              label={t("dob")}
              name="dob"
              type="date"
              value={formData.dob}
              required
              onChange={v => setFormData({ ...formData, dob: v })}
              onTTS={() =>
                handleTTS(
                  `${t("dob")}: ${formData.dob || "brak danych"}`,
                  "dob"
                )
              }
              isAudioLoading={audioLoadingId === "dob"}
              onDictate={() => handleDictate("dob")}
              isDictating={dictatingField === "dob"}
              isDarkMode={isDarkMode}
              readOutLoudLabel={t("readOutLoud")}
              dictateLabel={t("dictate")}
              listeningLabel={t("listening")}
            />

            {/* Gender */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={labelClasses}>{t("gender")}</label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title={t("readOutLoud")}
                    onClick={() =>
                      handleTTS(
                        `${t("gender")}: ${
                          formData.gender === "male"
                            ? t("male")
                            : t("female")
                        }`,
                        "gender"
                      )
                    }
                    className={`${iconButtonClasses} ${
                      audioLoadingId === "gender"
                        ? "text-red-700 animate-pulse bg-red-50 dark:bg-red-950/30"
                        : "text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
                    }`}
                  >
                    <Volume2 size={12} />
                  </button>

                  <button
                    type="button"
                    title={t("dictate")}
                    onClick={() => handleDictate("gender")}
                    className={`${iconButtonClasses} ${
                      dictatingField === "gender"
                        ? "text-red-700 animate-pulse bg-red-50 dark:bg-red-950/30"
                        : "text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
                    }`}
                  >
                    {dictatingField === "gender" ? (
                      <MicOff size={12} />
                    ) : (
                      <Mic size={12} />
                    )}
                  </button>
                </div>
              </div>

              <div className="relative">
                <select
                  value={formData.gender}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      gender: e.target.value as "male" | "female"
                    })
                  }
                  className={inputClasses(isDarkMode)}
                >
                  <option value="male">{t("male")}</option>
                  <option value="female">{t("female")}</option>
                </select>

                {dictatingField === "gender" && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2 px-3 py-1 bg-red-700 text-white rounded text-[10px] font-bold uppercase tracking-wide animate-pulse">
                    {t("identifyingGender")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </GovSection>
    </div>

                     {/* Requirement Alerts */}
{activePerson.paymentStatus === "paid" && (
  <>
    {/* PESEL Panel */}
    <div
      className={`p-5 rounded border flex items-center justify-between gap-4 group cursor-help transition-all ${
        isDarkMode
          ? "bg-zinc-900 border-zinc-800"
          : "bg-zinc-50 border-zinc-200"
      }`}
      onClick={() => handleExplain(activePerson)}
    >
      <div>
        <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-2">
          PESEL Identity Number
        </p>
        <code className="text-3xl md:text-5xl font-bold text-zinc-950 dark:text-zinc-100">
          {activePerson.pesel}
        </code>
      </div>

      <div className="bg-white dark:bg-zinc-950 p-3 rounded border border-zinc-200 dark:border-zinc-800">
        <HelpCircle size={30} className="text-red-700" />
      </div>
    </div>

    {/* Action Buttons */}
    <div className="flex flex-wrap gap-3">
      <GovButton
        onClick={() => setVerificationModalPerson(activePerson)}
        variant="primary"
        className="flex-1 min-w-[240px]"
      >
        <Scan size={24} /> {t("verify")}
      </GovButton>

      <button
        onClick={() => setActivePerson(null)}
        className="p-3 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 transition-all"
      >
        <Trash2 size={24} />
      </button>
    </div>
  </>
)}

{activePerson.paymentStatus !== "paid" && (
  <div className="flex flex-wrap gap-3">
    <button
      onClick={() => setPaymentModalOpen(true)}
      className="flex-1 min-w-[240px] bg-amber-600 text-white font-bold py-3 px-5 rounded hover:bg-amber-700 transition-colors uppercase tracking-wide text-xs flex items-center justify-center gap-3"
    >
      <CreditCard size={24} /> {t("payToVerify")}
    </button>

    <button
      onClick={() => setActivePerson(null)}
      className="p-3 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 transition-all"
    >
      <Trash2 size={24} />
    </button>
  </div>
)}


{/* AI Explanation */}
{aiExplanation && (
  <div className="mt-8 p-6 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 animate-in slide-in-from-bottom-8 duration-700">
    <div className="text-sm prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-strong:text-red-700">
      {aiExplanation.split("\n").map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </div>
  </div>
)}

{/* CLOSE ONLY ONE WRAPPER — NOT TWO */}
</div> {/* closes the inner content wrapper */}

{/* AI Explanation */}
{aiExplanation && (
  <div className="mt-8 p-6 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 animate-in slide-in-from-bottom-8 duration-700">
    <div className="text-sm prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-strong:text-red-700">
      {aiExplanation.split("\n").map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </div>
  </div>
)}

{/* CLOSE ONLY ONE WRAPPER — NOT TWO */}
</div> {/* closes the inner content wrapper */}

{/* Correct conditional structure */}
) : (
  <div
    className={`min-h-[520px] flex flex-col items-center justify-center text-center p-8 md:p-16 border border-dashed animate-in fade-in duration-700 ${
      isDarkMode
        ? "border-zinc-800 bg-zinc-950"
        : "border-zinc-300 bg-white"
    }`}
  >
    <div className="bg-zinc-100 dark:bg-zinc-900 p-7 rounded border border-zinc-200 dark:border-zinc-800 mb-8">
      <Fingerprint size={80} className="text-zinc-400" strokeWidth={1} />
    </div>

    <h3 className="text-2xl font-bold mb-4">{t("noActiveRecord")}</h3>

    <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium whitespace-pre-line">
      {t("searchPrompt")}
    </p>
  </div>
)}

</div> {/* closes lg:col-span-8 */}
</div> {/* closes grid wrapper */}


{/* Footer */}
<footer className="mt-12 py-8 border-t border-zinc-200 dark:border-zinc-800">
  <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-bold uppercase tracking-wide text-zinc-500">
    <div className="flex gap-10">
      <span>{t("footerStandard")}</span>
      <span>{t("footerAi")}</span>
    </div>

    <p className="max-w-lg text-center normal-case font-medium leading-relaxed tracking-normal text-xs">
      {t("footerDesc")}
    </p>

    <button
      onClick={() => setView("login")}
      className="flex items-center gap-2.5 hover:text-red-700 transition-colors py-2 px-3 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900"
    >
      <Lock size={14} /> {t("adminLogin")}
    </button>
  </div>
</footer>

</main>
</GovContainer>

      {activePerson.paymentStatus === "paid" && (
  <>
    {/* PESEL Panel */}
    <div
      className={`p-5 rounded border flex items-center justify-between gap-4 group cursor-help transition-all ${
        isDarkMode
          ? "bg-zinc-900 border-zinc-800"
          : "bg-zinc-50 border-zinc-200"
      }`}
      onClick={() => handleExplain(activePerson)}
    >
      <div>
        <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-2">
          PESEL Identity Number
        </p>
        <code className="text-3xl md:text-5xl font-bold text-zinc-950 dark:text-zinc-100">
          {activePerson.pesel}
        </code>
      </div>

      <div className="bg-white dark:bg-zinc-950 p-3 rounded border border-zinc-200 dark:border-zinc-800">
        <HelpCircle size={30} className="text-red-700" />
      </div>
    </div>

    {/* Action Buttons */}
    <div className="flex flex-wrap gap-3">
      <GovButton
        onClick={() => setVerificationModalPerson(activePerson)}
        variant="primary"
        className="flex-1 min-w-[240px]"
      >
        <Scan size={24} /> {t("verify")}
      </GovButton>

      <button
        onClick={() => setActivePerson(null)}
        className="p-3 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 transition-all"
      >
        <Trash2 size={24} />
      </button>
    </div>
  </>
)}



     {/* Verification Modal */}
{verificationModalPerson && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 bg-black/70 animate-in fade-in duration-300">
    <div
      className={`w-full max-w-3xl border-t-4 border-red-700 shadow-xl overflow-hidden ${surfaceClasses(
        isDarkMode
      )}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900">
        <h2 className="text-2xl font-bold flex items-center gap-4">
          <ShieldCheck className="text-red-700" /> {t("docVerification")}
        </h2>

        <button
          onClick={() => setVerificationModalPerson(null)}
          className={iconButtonClasses}
        >
          <X size={24} />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <div
            className={`relative h-64 rounded border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all group ${
              isDarkMode
                ? "border-zinc-700 bg-zinc-900 hover:border-red-700"
                : "border-zinc-300 bg-zinc-50 hover:border-red-700"
            }`}
          >
            {activePerson?.idPhoto ? (
              <img
                src={activePerson.idPhoto}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <FileText
                  size={58}
                  className="mx-auto mb-5 text-zinc-400"
                />
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                  {t("uploadId")}
                </p>
              </div>
            )}

            {!activePerson?.idPhoto && (
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleVerifyDocument}
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            )}
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isVerifying}
            className={`w-full ${primaryButtonClasses}`}
          >
            {isVerifying ? (
              <Loader2 className="animate-spin mx-auto" size={24} />
            ) : (
              t("uploadId")
            )}
          </button>
        </div>

        {/* Status Section */}
        <div className="flex flex-col justify-center space-y-6">
          <div
            className={`p-8 rounded border flex flex-col items-center justify-center min-h-[220px] transition-all ${
              activePerson?.verificationStatus === "verified"
                ? "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800 text-green-700 dark:text-green-300"
                : activePerson?.verificationStatus === "rejected"
                ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300"
                : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500"
            }`}
          >
            {isVerifying ? (
              <div className="text-center">
                <Loader2
                  size={48}
                  className="animate-spin mx-auto mb-6 text-red-700"
                />
                <p className="text-xs font-bold uppercase tracking-wide animate-pulse">
                  {t("aiChecking")}
                </p>
              </div>
            ) : (
              <>
                {activePerson?.verificationStatus === "none" && (
                  <Clock size={64} className="mb-6" />
                )}
                {activePerson?.verificationStatus === "verified" && (
                  <ShieldCheck size={80} className="mb-6" />
                )}
                {activePerson?.verificationStatus === "rejected" && (
                  <AlertCircle size={80} className="mb-6" />
                )}

                <p className="font-bold uppercase text-sm tracking-wide">
                  {activePerson?.verificationStatus === "none"
                    ? t("statusPending")
                    : activePerson?.verificationStatus === "verified"
                    ? t("statusVerified")
                    : t("statusRejected")}
                </p>
              </>
            )}
          </div>

          {/* Verification Details */}
          {activePerson?.verificationDetails && (
            <div className="text-xs text-center text-zinc-600 dark:text-zinc-400 leading-relaxed font-semibold p-4 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              {activePerson.verificationDetails}
            </div>
          )}

          {/* Notices */}
          <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded border border-amber-200 dark:border-amber-800">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <AlertCircle size={14} /> {t("idDesc")}
            </p>
          </div>

          <div className="p-4 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
            <Shield size={16} className="text-red-700" />
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
              {t("paymentSuccess")}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-zinc-50 dark:bg-zinc-900 text-right border-t border-zinc-200 dark:border-zinc-800">
        <GovButton
          onClick={() => setVerificationModalPerson(null)}
          variant="secondary"
        >
          {t("close")}
        </GovButton>
      </div>
    </div>
  </div>
)}


     {/* A11y Modal */}
{isA11yMenuOpen && (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-6 bg-black/70 animate-in zoom-in-95 duration-200">
    <div
      className={`w-full max-w-lg p-8 border-t-4 border-red-700 shadow-xl ${surfaceClasses(
        isDarkMode
      )}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold flex items-center gap-4">
          <Accessibility className="text-red-700" /> {t("a11yOptions")}
        </h2>

        <button
          onClick={() => setIsA11yMenuOpen(false)}
          className={iconButtonClasses}
        >
          <X size={22} />
        </button>
      </div>

      {/* Body */}
      <div className="space-y-8">
        {/* Text Size */}
        <div>
          <label className={`${labelClasses} mb-4`}>{t("textSize")}</label>

          <div className="flex gap-4">
            {[1, 1.15, 1.3].map(scale => (
              <button
                key={scale}
                onClick={() => setFontScale(scale)}
                className={`flex-1 py-4 rounded border-2 font-bold transition-all ${
                  fontScale === scale
                    ? "border-red-700 bg-red-50 dark:bg-red-950/30 text-red-700"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
                }`}
              >
                {scale === 1 ? "A" : scale === 1.15 ? "A+" : "A++"}
              </button>
            ))}
          </div>
        </div>

        {/* High Contrast Toggle */}
        <div className="flex items-center justify-between p-5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <div>
            <p className="font-bold uppercase text-xs tracking-wide">
              {t("highContrast")}
            </p>
            <p className="text-xs text-zinc-500 font-medium mt-1">
              {t("highContrastDesc")}
            </p>
          </div>

          <button
            onClick={() => setIsHighContrast(!isHighContrast)}
            className={`w-16 h-9 rounded-full relative transition-all duration-300 ${
              isHighContrast
                ? "bg-red-700"
                : "bg-zinc-300 dark:bg-zinc-700"
            }`}
          >
            <div
              className={`absolute top-1 w-7 h-7 bg-white rounded-full transition-all duration-300 shadow-xl ${
                isHighContrast ? "left-8" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Footer */}
      <GovButton
        onClick={() => setIsA11yMenuOpen(false)}
        variant="primary"
        className="w-full mt-8"
      >
        {t("applyChanges")}
      </GovButton>
    </div>
  </div>
)}
</div>
);
};

createRoot(document.getElementById('root')!).render(<App />);
