import * as yup from 'yup';

// Personal Details Schema
export const personalDetailsSchema = yup.object({
  fullName: yup.string()
    .required('Full name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  phone: yup.string()
    .required('Phone number is required')
    .matches(/^[+]?[\d\s-()]+$/, 'Invalid phone number'),
  country: yup.string()
    .required('Country is required'),
  linkedIn: yup.string()
    .url('Invalid LinkedIn URL')
    .optional(),
});

// Work Experience Schema
export const workExperienceSchema = yup.object({
  jobTitle: yup.string()
    .required('Job title is required'),
  company: yup.string()
    .required('Company name is required'),
  startDate: yup.date()
    .required('Start date is required'),
  endDate: yup.date()
    .nullable()
    .when('currentlyWorking', {
      is: false,
      then: (schema) => schema.required('End date is required'),
    }),
  currentlyWorking: yup.boolean(),
  responsibilities: yup.array()
    .of(yup.string())
    .min(3, 'Add at least 3 bullet points')
    .required('Responsibilities are required'),
});

// Education Schema
export const educationSchema = yup.object({
  institution: yup.string()
    .required('Institution name is required'),
  degree: yup.string()
    .required('Degree is required'),
  fieldOfStudy: yup.string()
    .required('Field of study is required'),
  graduationDate: yup.date()
    .required('Graduation date is required'),
});

// Skills Schema
export const skillsSchema = yup.object({
  skills: yup.array()
    .of(yup.string())
    .min(3, 'Add at least 3 skills')
    .required('Skills are required'),
  availability: yup.date()
    .required('Availability date is required'),
});

// Language Schema
export const languageSchema = yup.object({
  languages: yup.array()
    .of(yup.object({
      language: yup.string().required(),
      proficiency: yup.string()
        .oneOf(['Basic', 'Conversational', 'Fluent', 'Native'])
        .required(),
    }))
    .min(1, 'Add at least one language'),
});

// Certification Schema
export const certificationSchema = yup.object({
  name: yup.string()
    .required('Certification name is required'),
  issuer: yup.string()
    .required('Issuing body is required'),
  dateIssued: yup.date()
    .required('Date issued is required'),
  expirationDate: yup.date()
    .nullable()
    .optional(),
  noExpiration: yup.boolean(),
});
