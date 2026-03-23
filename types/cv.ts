export type CVData = {
  personal?: {
    fullName?: string;
    email?: string;
    phone?: string;
    country?: string;
    linkedIn?: string;
    portfolio?: string;
  };
  experience?: Array<{
    title: string;
    company: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    achievements?: string[];
  }>;
  education?: Array<{
    school: string;
    degree: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
  }>;
  skills?: string[];
  languages?: Array<{
    name: string;
    proficiency: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer?: string;
    issuedAt?: string;
    expiresAt?: string;
  }>;
  summary?: string;
};
