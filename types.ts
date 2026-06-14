export type Language = 'PL' | 'ENG' | 'UKR';
export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';
export type View = 'generator' | 'mydata' | 'help' | 'login' | 'admin' | 'review';
export type DbStatus = 'connecting' | 'connected' | 'disconnected' | 'unconfigured';

export interface Person {
  id: string;
  dob: string;
  gender: 'male' | 'female';
  nationality: string;
  pesel: string;
  createdAt: number;
  verificationdetails?: string;
  idphoto?: string;

  // ── Wnioskodawca (Applicant Info - Section 1)
  applicantfirstname: string;
  applicantlastname: string;
  applicantstreet: string;
  applicanthousenumber: string;
  applicantapartmentnumber?: string;
  applicantpostalcode: string;
  applicantcity: string;

  // ── Person Additional Info (Section 2)
  secondname?: string;
  othernames?: string;
  maidenname?: string;
  birthplace?: string;
  countryofbirth?: string;
  countryofresidence?: string;
  citizenshipstatus?: 'polish' | 'stateless' | 'other';

  // ── Family Info (Section 3)
  fatherfirstname?: string;
  fathermaidenname?: string;
  motherfirstname?: string;
  mothermaidenname?: string;
  civregistryoffice?: string;

  // ── Document Info (Section 3)
  idseriesnumber?: string;
  idvaliditydate?: string;
  idissuingauthority?: string;
  passportseriesnumber?: string;
  passportvaliditydate?: string;
  otherdocseriesnumber?: string;
  otherdocvaliditydate?: string;

  // ── Marital Status (Section 4)
  maritalstatus?: 'single' | 'married' | 'divorced' | 'widow' | 'widower';
  spousefirstname?: string;
  spousemaidenname?: string;
  spousepesel?: string;

  // ── Notification (Section 6)
  notificationmethod?: 'paper' | 'electronic';
  emailaddress?: string;
  epuapaddress?: string;

  // ── Verification Status
  verificationstatus?: VerificationStatus;
}