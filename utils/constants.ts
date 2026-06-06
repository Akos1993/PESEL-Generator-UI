export type Language = 'PL' | 'ENG' | 'UKR';

export const LANGUAGES = ['PL', 'ENG', 'UKR'] as const;

export const LANGUAGE_CONFIG: Record<Language, { label: string; flag: string }> = {
  PL: { label: 'PL', flag: '🇵🇱' },
  ENG: { label: 'EN', flag: '🇬🇧' },
  UKR: { label: 'UA', flag: '🇺🇦' }
};

export const FONT_SCALES = [1, 1.15, 1.3] as const;

export const surfaceClasses = (isDarkMode: boolean) =>
  isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-950';

export const panelClasses = (isDarkMode: boolean) =>
  `border shadow-sm ${surfaceClasses(isDarkMode)}`;

export const inputClasses = (isDarkMode: boolean) =>
  `w-full px-4 py-3 rounded border outline-none transition-all focus:ring-2 focus:ring-red-700/20 focus:border-red-700 ${
    isDarkMode ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-zinc-300 text-zinc-950'
  }`;

export const labelClasses = 'text-xs font-bold text-zinc-800 dark:text-zinc-200 block';

export const iconButtonClasses = 'p-2 rounded border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors';

export const primaryButtonClasses = 'bg-red-700 text-white font-bold py-3 px-5 rounded hover:bg-red-800 transition-colors uppercase tracking-wide text-xs flex items-center justify-center gap-3 disabled:opacity-50';

export const secondaryButtonClasses = 'border border-zinc-300 dark:border-zinc-700 font-bold py-3 px-5 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors uppercase tracking-wide text-xs flex items-center justify-center gap-3';

export const ADMIN_PASS = 'admin123';
