export type Language = 'PL' | 'ENG' | 'UKR';
export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';
export type View = 'generator' | 'mydata' | 'help' | 'login' | 'admin' | 'review';
export type DbStatus = 'connecting' | 'connected' | 'disconnected' | 'unconfigured';

export interface Person {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: 'male' | 'female';
  nationality: string;
  pesel: string;
  created_at: number;
  verification_status: VerificationStatus;
  verification_details?: string;
  id_photo?: string;

  // ── Wnioskodawca (Applicant Info - Section 1)
  applicant_first_name: string;
  applicant_last_name: string;
  applicant_street: string;
  applicant_house_number: string;
  applicant_apartment_number?: string;
  applicant_postal_code: string;
  applicant_city: string;

  // ── Person Additional Info (Section 2)
  second_name?: string;
  other_names?: string;
  maiden_name?: string;
  birth_place?: string;
  country_of_birth?: string;
  country_of_residence?: string;
  citizenship_status?: 'polish' | 'stateless' | 'other';

  // ── Family Info (Section 3)
  father_first_name?: string;
  father_maiden_name?: string;
  mother_first_name?: string;
  mother_maiden_name?: string;
  civ_registry_office?: string;

  // ── Document Info (Section 3)
  id_series_number?: string;
  id_validity_date?: string;
  id_issuing_authority?: string;
  passport_series_number?: string;
  passport_validity_date?: string;
  other_doc_series_number?: string;
  other_doc_validity_date?: string;

  // ── Marital Status (Section 4)
  marital_status?: 'single' | 'married' | 'divorced' | 'widow' | 'widower';
  spouse_first_name?: string;
  spouse_maiden_name?: string;
  spouse_pesel?: string;

  // ── Notification (Section 6)
  notification_method?: 'paper' | 'electronic';
  email_address?: string;
  epuap_address?: string;
}