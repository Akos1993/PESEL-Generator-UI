export type Language = 'PL' | 'ENG' | 'UKR';
export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';
export type PaymentStatus = 'unpaid' | 'processing' | 'paid';
export type PaymentMethod = 'card' | 'gpay' | 'applepay' | 'blik' | null;
export type PaymentStep = 'method' | 'details' | 'processing' | 'success';
export type View = 'user' | 'login' | 'admin';
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
}