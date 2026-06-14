export type Language = 'PL' | 'ENG' | 'UKR';
export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';
export type PaymentStatus = 'unpaid' | 'processing' | 'paid';
export type PaymentMethod = 'card' | 'gpay' | 'applepay' | 'blik' | null;
export type PaymentStep = 'method' | 'details' | 'processing' | 'success';
export type View = 'user' | 'login' | 'admin' | 'review';
export type DbStatus = 'connecting' | 'connected' | 'disconnected' | 'unconfigured';

export interface Person {
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

  // ── Wnioskodawca (Applicant Info - Section 1)
  applicantFirstName: string;
  applicantLastName: string;
  applicantStreet: string;
  applicantHouseNumber: string;
  applicantApartmentNumber?: string;
  applicantPostalCode: string;
  applicantCity: string;

  // ── Person Additional Info (Section 2)
  secondName?: string;
  otherNames?: string;
  maidenName?: string;
  birthPlace?: string;
  countryOfBirth?: string;
  countryOfResidence?: string;
  citizenshipStatus?: 'polish' | 'stateless' | 'other';

  // ── Family Info (Section 3)
  fatherFirstName?: string;
  fatherMaidenName?: string;
  motherFirstName?: string;
  motherMaidenName?: string;
  civRegistryOffice?: string;

  // ── Document Info (Section 3)
  idSeriesNumber?: string;
  idValidityDate?: string;
  idIssuingAuthority?: string;
  passportSeriesNumber?: string;
  passportValidityDate?: string;
  otherDocSeriesNumber?: string;
  otherDocValidityDate?: string;

  // ── Marital Status (Section 4)
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widow' | 'widower';
  spouseFirstName?: string;
  spouseMaidenName?: string;
  spousePesel?: string;

  // ── Notification (Section 6)
  notificationMethod?: 'paper' | 'electronic';
  emailAddress?: string;
  epuapAddress?: string;
}