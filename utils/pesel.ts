type Language = 'PL' | 'ENG' | 'UKR';

export const decode = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

export const generatePESEL = (dobDate: Date, gender: 'male' | 'female'): string => {
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

export const getPeselExplanation = (pesel: string, firstName: string, dob: string, gender: 'male' | 'female', lang: Language): string => {
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
