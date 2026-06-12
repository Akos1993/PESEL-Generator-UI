import { Language } from './types';

// ─── PESEL generation ─────────────────────────────────────────────────────────

export const generatePESEL = (dobDate: Date, gender: 'male' | 'female'): string => {
  const year = dobDate.getFullYear();
  let month = dobDate.getMonth() + 1;

  // Century encoding per PESEL standard
  if (year >= 1800 && year < 1900) month += 80;
  else if (year >= 2000 && year < 2100) month += 20;
  else if (year >= 2100 && year < 2200) month += 40;
  else if (year >= 2200 && year < 2300) month += 60;

  const yy  = (year % 100).toString().padStart(2, '0');
  const mm  = month.toString().padStart(2, '0');
  const dd  = dobDate.getDate().toString().padStart(2, '0');
  const zzz = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  const sexOptions = gender === 'male' ? [1, 3, 5, 7, 9] : [0, 2, 4, 6, 8];
  const sexDigit   = sexOptions[Math.floor(Math.random() * sexOptions.length)];

  const base    = `${yy}${mm}${dd}${zzz}${sexDigit}`;
  const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  let sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(base[i], 10) * weights[i];
  const checkDigit = (10 - (sum % 10)) % 10;

  return base + checkDigit.toString();
};

// ─── PESEL structure explanation ──────────────────────────────────────────────

export const getPeselExplanation = (
  pesel: string,
  dob: string,
  gender: 'male' | 'female',
  lang: Language,
): string => {
  const parts = {
    yy:   pesel.substring(0, 2),
    mm:   pesel.substring(2, 4),
    dd:   pesel.substring(4, 6),
    zzz:  pesel.substring(6, 9),
    g:    pesel.substring(9, 10),
    ctrl: pesel.substring(10, 11),
  };
  const isMale = gender === 'male';

  if (lang === 'PL') {
    return (
      `### Analiza PESEL: \`${pesel}\`\n\n` +
      `**Rocznik (\`${parts.yy}\`):** Końcówka roku z daty ${dob}.\n\n` +
      `**Miesiąc (\`${parts.mm}\`):** Miesiąc + 20 (dla urodz. po 1999 r.).\n\n` +
      `**Dzień (\`${parts.dd}\`):** Dzień urodzin.\n\n` +
      `**Seria (\`${parts.zzz}\`):** Unikalny numer porządkowy.\n\n` +
      `**Płeć (\`${parts.g}\`):** ${isMale ? 'Nieparzysta — mężczyzna' : 'Parzysta — kobieta'}.\n\n` +
      `**Cyfra kontrolna (\`${parts.ctrl}\`):** Weryfikacja wag 1-3-7-9-1-3-7-9-1-3.\n\n` +
      `*Obliczenia wykonane lokalnie.*`
    );
  }

  if (lang === 'UKR') {
    return (
      `### Аналіз PESEL: \`${pesel}\`\n\n` +
      `**Рік (\`${parts.yy}\`):** Кінець року з дати ${dob}.\n\n` +
      `**Місяць (\`${parts.mm}\`):** Місяць + 20 (для народжених після 1999).\n\n` +
      `**День (\`${parts.dd}\`):** День народження.\n\n` +
      `**Серія (\`${parts.zzz}\`):** Унікальний порядковий номер.\n\n` +
      `**Стать (\`${parts.g}\`):** ${isMale ? 'Непарна — чоловік' : 'Парна — жінка'}.\n\n` +
      `**Контрольна цифра (\`${parts.ctrl}\`):** Перевірка вагами 1-3-7-9-1-3-7-9-1-3.\n\n` +
      `*Розрахунки виконані локально.*`
    );
  }

  return (
    `### PESEL Analysis: \`${pesel}\`\n\n` +
    `**Year (\`${parts.yy}\`):** Last two digits of birth year from ${dob}.\n\n` +
    `**Month (\`${parts.mm}\`):** Birth month + 20 (for births after 1999).\n\n` +
    `**Day (\`${parts.dd}\`):** Day of birth.\n\n` +
    `**Series (\`${parts.zzz}\`):** Unique ordinal sequence.\n\n` +
    `**Gender (\`${parts.g}\`):** ${isMale ? 'Odd digit — Male' : 'Even digit — Female'}.\n\n` +
    `**Check digit (\`${parts.ctrl}\`):** Weighted verification 1-3-7-9-1-3-7-9-1-3.\n\n` +
    `*All calculations processed locally.*`
  );
};

// ─── Payment input formatters ─────────────────────────────────────────────────

/** Formats a raw digit string into groups of 4: "1234 5678 9012 3456" */
export const formatCardNumber = (raw: string): string =>
  raw
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

/** Formats a raw digit string into MM/YY: "12/27" */
export const formatExpiry = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  return digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

// ─── Async delay ──────────────────────────────────────────────────────────────

export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
