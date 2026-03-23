# GlobalReady - Phase 1: Core User Flows Implementation

## Overview
This document outlines the complete implementation of core user flows for GlobalReady mobile app using React Native + Supabase + Stripe.

**Duration:** Week 1-2  
**Goal:** Get all critical user journeys working end-to-end

---

## 1. Navigation & User Journey Testing

### Setup React Navigation
```bash
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
```

### Main Navigation Structure
```typescript
// navigation/AppNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main App Navigator
export default function AppNavigator() {
  const [isOnboarded, setIsOnboarded] = useState(false);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isOnboarded ? (
          // Onboarding Flow
          <Stack.Group>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="ChoosePath" component={ChoosePathScreen} />
          </Stack.Group>
        ) : (
          // Main App
          <Stack.Screen name="MainApp" component={MainTabNavigator} />
        )}
        
        {/* Modal Screens */}
        <Stack.Group screenOptions={{ presentation: 'modal' }}>
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="CVPreview" component={CVPreviewScreen} />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Bottom Tab Navigator
function MainTabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Jobs" component={JobsScreen} />
      <Tab.Screen name="Courses" component={CoursesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Work Abroad Assessment Stack
export const AssessmentNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="AssessmentIntro" component={AssessmentIntroScreen} />
    <Stack.Screen name="Targeting" component={TargetingScreen} />
    <Stack.Screen name="Experience" component={ExperienceScreen} />
    <Stack.Screen name="Language" component={LanguageScreen} />
    <Stack.Screen name="Results" component={ResultsScreen} />
  </Stack.Navigator>
);

// CV Builder Stack
export const CVBuilderNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="CVIntro" component={CVIntroScreen} />
    <Stack.Screen name="Personal" component={PersonalDetailsScreen} />
    <Stack.Screen name="WorkExperience" component={WorkExperienceScreen} />
    <Stack.Screen name="Education" component={EducationScreen} />
    <Stack.Screen name="Skills" component={SkillsScreen} />
    <Stack.Screen name="Languages" component={LanguagesScreen} />
    <Stack.Screen name="Certifications" component={CertificationsScreen} />
    <Stack.Screen name="Download" component={DownloadScreen} />
  </Stack.Navigator>
);

// CV Tailoring Stack
export const CVTailorNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="Upload" component={UploadCVScreen} />
    <Stack.Screen name="Analyzing" component={AnalyzingScreen} />
    <Stack.Screen name="MatchReport" component={MatchReportScreen} />
    <Stack.Screen name="Payment" component={PaymentScreen} />
    <Stack.Screen name="Optimizing" component={OptimizingScreen} />
    <Stack.Screen name="Preview" component={PreviewScreen} />
    <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
  </Stack.Navigator>
);
```

### Test User Flows
```typescript
// __tests__/navigation/UserFlows.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native';

describe('User Flow Tests', () => {
  it('completes Work Abroad assessment flow', async () => {
    const { getByText, getByTestId } = render(<AppNavigator />);
    
    // 1. Choose Work Abroad path
    fireEvent.press(getByText('Work Abroad'));
    
    // 2. Complete 5-step assessment
    expect(getByText('Step 1 of 5')).toBeTruthy();
    // ... continue testing each step
  });

  it('completes CV builder flow', async () => {
    // Test 6-step CV creation
  });

  it('completes CV tailoring with payment', async () => {
    // Test upload → analysis → payment → download
  });
});
```

**Action Items:**
- [ ] Test navigation between all screens
- [ ] Verify back button behavior
- [ ] Test progress indicators (1/5, 2/5, etc.)
- [ ] Ensure data persists when navigating back
- [ ] Test modal presentations (Payment, Preview)

---

## 2. Form Validation & Data Persistence

### Install Dependencies
```bash
npm install react-hook-form yup @hookform/resolvers
npm install @react-native-async-storage/async-storage
```

### Validation Schemas
```typescript
// utils/validation/schemas.ts
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
```

### Multi-Step Form Hook
```typescript
// hooks/useCVBuilder.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useCVBuilder = () => {
  const [cvData, setCVData] = useState({
    personal: {},
    experience: [],
    education: [],
    skills: [],
    languages: [],
    certifications: [],
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Load draft from AsyncStorage
  useEffect(() => {
    loadDraft();
  }, []);

  const loadDraft = async () => {
    try {
      const draft = await AsyncStorage.getItem('cv_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        setCVData(parsed.data);
        setCurrentStep(parsed.currentStep || 1);
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  };

  // Auto-save draft (call this every 30 seconds or on field change)
  const saveDraft = async () => {
    try {
      const draft = {
        data: cvData,
        currentStep,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem('cv_draft', JSON.stringify(draft));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  // Save to Supabase
  const saveToDatabase = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('cvs')
        .insert({
          user_id: user.id,
          type: 'built',
          cv_data: cvData,
          payment_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Clear draft after successful save
      await AsyncStorage.removeItem('cv_draft');

      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePersonal = (data: any) => {
    setCVData(prev => ({ ...prev, personal: data }));
  };

  const addExperience = (exp: any) => {
    setCVData(prev => ({ 
      ...prev, 
      experience: [...prev.experience, exp] 
    }));
  };

  const updateExperience = (index: number, exp: any) => {
    setCVData(prev => {
      const newExp = [...prev.experience];
      newExp[index] = exp;
      return { ...prev, experience: newExp };
    });
  };

  const removeExperience = (index: number) => {
    setCVData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  // Similar methods for education, skills, languages, certifications...

  return {
    cvData,
    currentStep,
    loading,
    setCurrentStep,
    updatePersonal,
    addExperience,
    updateExperience,
    removeExperience,
    saveDraft,
    saveToDatabase,
  };
};
```

### Auto-Save Implementation
```typescript
// components/forms/AutoSaveForm.tsx
import { useEffect } from 'react';
import { useCVBuilder } from '@/hooks/useCVBuilder';

export const AutoSaveForm = ({ children }) => {
  const { saveDraft } = useCVBuilder();
  const [lastSaved, setLastSaved] = useState(null);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      await saveDraft();
      setLastSaved(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <View>
      {children}
      {lastSaved && (
        <Text style={styles.saveIndicator}>
          Draft saved at {lastSaved.toLocaleTimeString()}
        </Text>
      )}
    </View>
  );
};
```

### Form Example with Validation
```typescript
// screens/CVBuilder/PersonalDetailsScreen.tsx
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { personalDetailsSchema } from '@/utils/validation/schemas';

const PersonalDetailsScreen = ({ navigation }) => {
  const { updatePersonal, saveDraft } = useCVBuilder();
  
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(personalDetailsSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      country: '',
      linkedIn: '',
    },
  });

  const onSubmit = async (data) => {
    updatePersonal(data);
    await saveDraft();
    navigation.navigate('WorkExperience');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.step}>Step 1 of 6</Text>
      <Text style={styles.title}>Personal Details</Text>

      <Controller
        control={control}
        name="fullName"
        render={({ field: { onChange, value } }) => (
          <View>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={value}
              onChangeText={onChange}
            />
            {errors.fullName && (
              <Text style={styles.error}>{errors.fullName.message}</Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <View>
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              value={value}
              onChangeText={onChange}
            />
            {errors.email && (
              <Text style={styles.error}>{errors.email.message}</Text>
            )}
          </View>
        )}
      />

      {/* Similar for phone, country, linkedIn */}

      <TouchableOpacity 
        style={styles.button}
        onPress={handleSubmit(onSubmit)}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
```

**Action Items:**
- [ ] Add Yup validation to all forms
- [ ] Implement auto-save every 30 seconds
- [ ] Show "Draft saved" indicator
- [ ] Handle form errors gracefully
- [ ] Test form data persistence across screens

---

## 3. Payment Flow with Stripe (End-to-End)

### Install Stripe Dependencies
```bash
npm install @stripe/stripe-react-native
```

### Stripe Setup in App.tsx
```typescript
// App.tsx
import { StripeProvider } from '@stripe/stripe-react-native';

const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;

export default function App() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </StripeProvider>
  );
}
```

### Supabase Edge Function: Create Payment Intent
```bash
# Create Edge Function
supabase functions new create-payment-intent
```
```typescript
// supabase/functions/create-payment-intent/index.ts
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  try {
    const { amount, cvId, userId, email } = await req.json();

    // Validate inputs
    if (!amount || !cvId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // 500 for $5
      currency: 'usd',
      metadata: {
        cv_id: cvId,
        user_id: userId,
        service: 'cv_tailoring',
      },
      receipt_email: email,
    });

    // Store payment record in Supabase
    const { data: payment, error: dbError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        cv_id: cvId,
        amount: amount,
        currency: 'USD',
        payment_method: 'stripe',
        reference: paymentIntent.id,
        status: 'pending',
        metadata: { 
          client_secret: paymentIntent.client_secret 
        },
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentId: payment.id,
        paymentIntentId: paymentIntent.id,
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Payment intent error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
```

### Deploy Edge Function
```bash
# Set secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx
supabase secrets set SUPABASE_URL=https://xxxxx.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Deploy
supabase functions deploy create-payment-intent
```

### Payment Screen Implementation
```typescript
// screens/Payment/StripePaymentScreen.tsx
import { useStripe, CardField } from '@stripe/stripe-react-native';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

const StripePaymentScreen = ({ route, navigation }) => {
  const { cvId, amount = 500, jobDescription } = route.params;
  const { confirmPayment } = useStripe();
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const handlePayment = async () => {
    if (!cardComplete) return;

    setLoading(true);

    try {
      // 1. Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // 2. Create payment intent via Edge Function
      const { data: intentData, error: intentError } = await supabase.functions.invoke(
        'create-payment-intent',
        {
          body: {
            amount,
            cvId,
            userId: user.id,
            email: user.email,
          },
        }
      );

      if (intentError) throw intentError;

      // 3. Confirm payment with Stripe
      const { error: confirmError, paymentIntent } = await confirmPayment(
        intentData.clientSecret,
        {
          paymentMethodType: 'Card',
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      // 4. Payment successful! Update Supabase
      await supabase
        .from('payments')
        .update({ 
          status: 'successful',
          metadata: { payment_intent_id: paymentIntent.id },
        })
        .eq('reference', paymentIntent.id);

      // 5. Update CV payment status
      await supabase
        .from('cvs')
        .update({ payment_status: 'completed' })
        .eq('id', cvId);

      // 6. Trigger CV tailoring if job description provided
      if (jobDescription) {
        await triggerCVTailoring(cvId, jobDescription);
      }

      // 7. Navigate to success screen
      navigation.replace('PaymentSuccess', { cvId });

    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert(
        'Payment Failed',
        error.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const triggerCVTailoring = async (cvId: string, jobDesc: string) => {
    try {
      // Get CV data
      const { data: cv } = await supabase
        .from('cvs')
        .select('cv_data')
        .eq('id', cvId)
        .single();

      if (!cv) throw new Error('CV not found');

      // Call tailor-cv Edge Function
      const { data: tailoredCV, error } = await supabase.functions.invoke(
        'tailor-cv',
        {
          body: {
            cvData: cv.cv_data,
            jobDescription: jobDesc,
          },
        }
      );

      if (error) throw error;

      // Update CV with tailored version
      await supabase
        .from('cvs')
        .update({ 
          cv_data: tailoredCV,
          job_description: jobDesc,
        })
        .eq('id', cvId);

    } catch (error) {
      console.error('CV tailoring error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment</Text>
      <Text style={styles.amount}>${(amount / 100).toFixed(2)}</Text>
      <Text style={styles.description}>ATS-Optimized CV Tailoring</Text>

      <CardField
        postalCodeEnabled={false}
        placeholders={{
          number: '4242 4242 4242 4242',
        }}
        cardStyle={{
          backgroundColor: '#FFFFFF',
          textColor: '#000000',
          borderWidth: 1,
          borderColor: '#CCCCCC',
          borderRadius: 8,
        }}
        style={{
          width: '100%',
          height: 50,
          marginVertical: 30,
        }}
        onCardChange={(cardDetails) => {
          setCardComplete(cardDetails.complete);
        }}
      />

      <TouchableOpacity
        style={[
          styles.payButton,
          (!cardComplete || loading) && styles.payButtonDisabled,
        ]}
        onPress={handlePayment}
        disabled={!cardComplete || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            Pay ${(amount / 100).toFixed(2)}
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.securityBadge}>
        <Text style={styles.securityText}>🔒 Secured by Stripe</Text>
        <Text style={styles.securitySubtext}>
          Your payment information is encrypted
        </Text>
      </View>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101722',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  amount: {
    fontSize: 48,
    fontWeight: '800',
    color: '#0d6cf2',
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    color: '#90a9cb',
    marginBottom: 30,
  },
  payButton: {
    backgroundColor: '#0d6cf2',
    height: 56,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0d6cf2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  payButtonDisabled: {
    backgroundColor: '#314868',
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  securityBadge: {
    marginTop: 30,
    alignItems: 'center',
  },
  securityText: {
    fontSize: 14,
    color: '#90a9cb',
    marginBottom: 5,
  },
  securitySubtext: {
    fontSize: 12,
    color: '#90a9cb',
  },
  cancelText: {
    fontSize: 16,
    color: '#0d6cf2',
    textAlign: 'center',
    marginTop: 20,
  },
});
```

### Payment Success Screen
```typescript
// screens/Payment/PaymentSuccessScreen.tsx
const PaymentSuccessScreen = ({ route, navigation }) => {
  const { cvId } = route.params;

  useEffect(() => {
    // Generate PDF in background
    generateCVPDF(cvId);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.successIcon}>✅</Text>
      <Text style={styles.title}>Payment Successful!</Text>
      <Text style={styles.subtitle}>
        Your CV is being optimized and will be ready shortly
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('DownloadCV', { cvId })}
      >
        <Text style={styles.buttonText}>View & Download CV</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Jobs')}
      >
        <Text style={styles.linkText}>Browse Jobs →</Text>
      </TouchableOpacity>
    </View>
  );
};
```

**Action Items:**
- [ ] Test with Stripe test card: 4242 4242 4242 4242
- [ ] Test payment failure: 4000 0000 0000 0002
- [ ] Verify payment record in Supabase
- [ ] Verify CV payment_status updates to 'completed'
- [ ] Test CV tailoring triggers after payment
- [ ] Test navigation to success screen

---

## 4. CV Generation & Download

### Install PDF Dependencies
```bash
npm install react-native-html-to-pdf
npm install react-native-fs
npm install react-native-share
```

### PDF Generator Utility
```typescript
// utils/cvGenerator.ts
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import { supabase } from '@/lib/supabase';

export const generateCVPDF = async (cvId: string) => {
  try {
    // 1. Fetch CV data from Supabase
    const { data: cv, error } = await supabase
      .from('cvs')
      .select('*')
      .eq('id', cvId)
      .single();

    if (error) throw error;

    const cvData = cv.cv_data;

    // 2. Generate ATS-optimized HTML
    const htmlContent = generateATSOptimizedHTML(cvData);

    // 3. Convert HTML to PDF
    const options = {
      html: htmlContent,
      fileName: `${cvData.personal.fullName.replace(/\s+/g, '_')}_CV`,
      directory: 'Documents',
      base64: true,
    };

    const file = await RNHTMLtoPDF.convert(options);

    // 4. Read file as blob/buffer for Supabase
    const fileContent = await RNFS.readFile(file.filePath, 'base64');
    const buffer = Buffer.from(fileContent, 'base64');

    // 5. Upload to Supabase Storage
    const { data: { user } } = await supabase.auth.getUser();
    const fileName = `${user.id}/${cvId}.pdf`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cv-pdfs')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // 6. Update CV record with PDF URL
    await supabase
      .from('cvs')
      .update({ pdf_url: fileName })
      .eq('id', cvId);

    return {
      filePath: file.filePath,
      cloudUrl: fileName,
    };

  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
};

// Generate ATS-Optimized HTML Template
const generateATSOptimizedHTML = (cvData: any) => {
  const { personal, experience, education, skills, languages, certifications } = cvData;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Arial', 'Helvetica', sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #000;
          padding: 40px;
          background: #fff;
        }
        h1 {
          font-size: 26pt;
          font-weight: 700;
          margin-bottom: 8px;
          color: #000;
          letter-spacing: -0.5px;
        }
        h2 {
          font-size: 14pt;
          font-weight: 700;
          margin-top: 24px;
          margin-bottom: 12px;
          border-bottom: 2px solid #000;
          padding-bottom: 6px;
          text-transform: uppercase;
        }
        h3 {
          font-size: 12pt;
          font-weight: 700;
          margin-top: 12px;
          margin-bottom: 4px;
        }
        .contact-info {
          font-size: 10pt;
          margin-bottom: 24px;
          line-height: 1.4;
        }
        .contact-info a {
          color: #000;
          text-decoration: none;
        }
        ul {
          margin-left: 20px;
          margin-top: 8px;
          margin-bottom: 12px;
        }
        li {
          margin-bottom: 6px;
        }
        .date-range {
          font-style: italic;
          color: #333;
          font-size: 10pt;
        }
        .company-name {
          font-weight: 600;
        }
        .section-item {
          margin-bottom: 18px;
        }
        .skills-list {
          line-height: 1.8;
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <h1>${personal.fullName}</h1>
      <div class="contact-info">
        ${personal.email} | ${personal.phone} | ${personal.country}
        ${personal.linkedIn ? `| <a href="${personal.linkedIn}">LinkedIn Profile</a>` : ''}
      </div>

      ${cvData.summary ? `
        <h2>Professional Summary</h2>
        <p>${cvData.summary}</p>
      ` : ''}

      <!-- Work Experience -->
      <h2>Work Experience</h2>
      ${experience.map(exp => `
        <div class="section-item">
          <h3>${exp.jobTitle} | <span class="company-name">${exp.company}</span></h3>
          <div class="date-range">
            ${formatDate(exp.startDate)} - ${exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}
          </div>
          <ul>
            ${exp.responsibilities.map(resp => `<li>${resp}</li>`).join('')}
          </ul>
        </div>
      `).join('')}

      <!-- Education -->
      <h2>Education</h2>
      ${education.map(edu => `
        <div class="section-item">
          <h3>${edu.degree} - ${edu.fieldOfStudy}</h3>
          <div class="company-name">${edu.institution}</div>
          <div class="date-range">${formatDate(edu.graduationDate)}</div>
        </div>
      `).join('')}

      <!-- Skills -->
      <h2>Skills</h2>
      <div class="skills-list">
        ${skills.join(' • ')}
      </div>

      ${languages && languages.length > 0 ? `
        <h2>Languages</h2>
        <div class="skills-list">
          ${languages.map(lang => `${lang.language} (${lang.proficiency})`).join(' • ')}
        </div>
      ` : ''}

      ${certifications && certifications.length > 0 ? `
        <h2>Certifications</h2>
        ${certifications.map(cert => `
          <div class="section-item">
            <strong>${cert.name}</strong> - ${cert.issuer} (${formatDate(cert.date)})
          </div>
        `).join('')}
      ` : ''}
    </body>
    </html>
  `;
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};
```

### Download Screen
```typescript
// screens/CV/DownloadScreen.tsx
import Share from 'react-native-share';
import { supabase } from '@/lib/supabase';
import RNFS from 'react-native-fs';

const DownloadScreen = ({ route, navigation }) => {
  const { cvId } = route.params;
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCV();
  }, []);

  const loadCV = async () => {
    try {
      // Get CV data
      const { data: cv, error: cvError } = await supabase
        .from('cvs')
        .select('pdf_url, cv_data')
        .eq('id', cvId)
        .single();

      if (cvError) throw cvError;

      if (cv.pdf_url) {
        // Get signed download URL from Supabase Storage
        const { data, error: urlError } = await supabase.storage
          .from('cv-pdfs')
          .createSignedUrl(cv.pdf_url, 3600); // 1 hour expiry

        if (urlError) throw urlError;
        setPdfUrl(data.signedUrl);
      } else {
        // Generate PDF if doesn't exist
        const result = await generateCVPDF(cvId);
        
        // Get signed URL for newly generated PDF
        const { data, error: urlError } = await supabase.storage
          .from('cv-pdfs')
          .createSignedUrl(result.cloudUrl, 3600);

        if (urlError) throw urlError;
        setPdfUrl(data.signedUrl);
      }
    } catch (err) {
      console.error('Load CV error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!pdfUrl) return;

    try {
      // Download to device
      const localFile = `${RNFS.DocumentDirectoryPath}/GlobalReady_CV_${Date.now()}.pdf`;
      
      const downloadResult = await RNFS.downloadFile({
        fromUrl: pdfUrl,
        toFile: localFile,
      }).promise;

      if (downloadResult.statusCode === 200) {
        Alert.alert(
          'Success',
          'CV downloaded successfully!',
          [
            { text: 'OK', onPress: () => console.log('Download confirmed') }
          ]
        );
      } else {
        throw new Error('Download failed');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to download CV. Please try again.');
      console.error('Download error:', err);
    }
  };

  const handleShare = async () => {
    if (!pdfUrl) return;

    try {
      await Share.open({
        url: pdfUrl,
        type: 'application/pdf',
        title: 'Share CV',
        subject: 'My Professional CV',
      });
    } catch (err) {
      if (err.message !== 'User did not share') {
        console.error('Share error:', err);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0d6cf2" />
        <Text style={styles.loadingText}>Preparing your CV...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={loadCV}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.successSection}>
        <Text style={styles.successIcon}>🎉</Text>
        <Text style={styles.title}>Your CV is Ready!</Text>
        <Text style={styles.subtitle}>
          Download your ATS-optimized CV and start applying to jobs
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.downloadButton}
        onPress={handleDownload}
      >
        <Text style={styles.buttonText}>Download CV</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.shareButton}
        onPress={handleShare}
      >
        <Text style={styles.buttonText}>Share CV</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.nextStepsTitle}>What's Next?</Text>
      
      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.navigate('Jobs')}
      >
        <Text style={styles.linkText}>Browse Jobs →</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.navigate('SkillsHub')}
      >
        <Text style={styles.linkText}>Explore Courses →</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101722',
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#101722',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  successIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#90a9cb',
    textAlign: 'center',
    lineHeight: 24,
  },
  downloadButton: {
    backgroundColor: '#0d6cf2',
    height: 56,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#0d6cf2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  shareButton: {
    backgroundColor: '#182434',
    height: 56,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#314868',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#314868',
    marginVertical: 30,
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 15,
  },
  linkButton: {
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 16,
    color: '#0d6cf2',
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#90a9cb',
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#90a9cb',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0d6cf2',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 9999,
  },
});
```

**Action Items:**
- [ ] Test PDF generation with sample CV data
- [ ] Verify ATS readability (text is selectable, not images)
- [ ] Test download to device storage
- [ ] Test share functionality (email, messaging apps)
- [ ] Verify PDF uploads to Supabase Storage
- [ ] Test signed URL generation and expiry

---

## 5. Job Match Report Logic (Critical Business Rule)

This is the **core monetization logic** - must be implemented correctly!

### Match Report Screen Router
```typescript
// screens/CVTailor/JobMatchReportScreen.tsx
const JobMatchReportScreen = ({ route, navigation }) => {
  const { analysisResult, cvId, jobDescription } = route.params;
  const matchScore = analysisResult.match_score;

  // CRITICAL BUSINESS RULE:
  // - <60% match = No tailoring offer, show upskilling path
  // - ≥60% match = Offer $5 CV tailoring

  if (matchScore < 60) {
    return (
      <NotFitYetReport 
        analysisResult={analysisResult}
        navigation={navigation}
      />
    );
  } else {
    return (
      <GoodFitReport 
        analysisResult={analysisResult}
        cvId={cvId}
        jobDescription={jobDescription}
        navigation={navigation}
      />
    );
  }
};
```

### NOT FIT YET Screen (<60% Match)
```typescript
// components/reports/NotFitYetReport.tsx
const NotFitYetReport = ({ analysisResult, navigation }) => {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreText}>{analysisResult.match_score}%</Text>
        </View>
        <Text style={styles.verdict}>Not a Fit Yet</Text>
        <Text style={styles.message}>
          You need to build some skills before applying to this role
        </Text>
      </View>

      {/* Matched Skills */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✅ What You Have</Text>
        <View style={styles.skillsContainer}>
          {analysisResult.matched_skills.map((skill, index) => (
            <View key={index} style={styles.skillChip}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Missing Skills (HIGH priority first) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚠️ What You're Missing</Text>
        {analysisResult.missing_skills
          .sort((a, b) => {
            const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          })
          .map((item, index) => (
            <View key={index} style={styles.missingSkillCard}>
              <View style={[
                styles.priorityBadge,
                item.priority === 'HIGH' && styles.priorityHigh,
                item.priority === 'MEDIUM' && styles.priorityMedium,
                item.priority === 'LOW' && styles.priorityLow,
              ]}>
                <Text style={styles.priorityText}>{item.priority}</Text>
              </View>
              <View style={styles.skillContent}>
                <Text style={styles.skillName}>{item.skill}</Text>
                <Text style={styles.skillReason}>{item.reason}</Text>
              </View>
            </View>
          ))}
      </View>

      {/* Recommended Courses */}
      {analysisResult.recommended_courses && analysisResult.recommended_courses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Build These Skills</Text>
          {analysisResult.recommended_courses.map((course, index) => (
            <TouchableOpacity
              key={index}
              style={styles.courseCard}
              onPress={() => navigation.navigate('CourseDetail', { 
                courseId: course.course_id 
              })}
            >
              <Text style={styles.courseTitle}>{course.title}</Text>
              <View style={styles.courseMetaWrapper}>
                <Text style={styles.courseDuration}>
                  ⏱ {course.duration_hours} hours
                </Text>
                <Text style={styles.courseRating}>⭐ {course.rating}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* CTAs - NO PAYMENT PROMPT! */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate('SkillsHub')}
      >
        <Text style={styles.buttonText}>Check Courses to Upskill</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('InfoSessionSignup')}
      >
        <Text style={styles.buttonText}>Sign Up for Free Info Session</Text>
      </TouchableOpacity>

      {/* Disclaimer */}
      <Text style={styles.disclaimer}>
        GlobalReady improves preparation quality. It does not guarantee 
        interviews, offers, visas, or admissions.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101722',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#182434',
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1c2533',
    borderWidth: 4,
    borderColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ff6b6b',
  },
  verdict: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#90a9cb',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 15,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skillChip: {
    backgroundColor: '#1c2533',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#314868',
  },
  skillText: {
    color: '#fff',
    fontSize: 14,
  },
  missingSkillCard: {
    backgroundColor: '#182434',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  priorityHigh: {
    backgroundColor: '#ff6b6b',
  },
  priorityMedium: {
    backgroundColor: '#ffa500',
  },
  priorityLow: {
    backgroundColor: '#90a9cb',
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  skillContent: {
    flex: 1,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  skillReason: {
    fontSize: 14,
    color: '#90a9cb',
    lineHeight: 20,
  },
  courseCard: {
    backgroundColor: '#182434',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#314868',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  courseMetaWrapper: {
    flexDirection: 'row',
    gap: 15,
  },
  courseDuration: {
    fontSize: 14,
    color: '#90a9cb',
  },
  courseRating: {
    fontSize: 14,
    color: '#90a9cb',
  },
  primaryButton: {
    backgroundColor: '#0d6cf2',
    height: 56,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 15,
    shadowColor: '#0d6cf2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: '#182434',
    height: 56,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#314868',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 12,
    color: '#90a9cb',
    textAlign: 'center',
    paddingHorizontal: 30,
    paddingBottom: 40,
    lineHeight: 18,
  },
});
```

### GOOD FIT Screen (≥60% Match)
```typescript
// components/reports/GoodFitReport.tsx
const GoodFitReport = ({ analysisResult, cvId, jobDescription, navigation }) => {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreText}>{analysisResult.match_score}%</Text>
        </View>
        <Text style={styles.verdict}>Good Fit! 🎯</Text>
        <Text style={styles.message}>
          You meet most requirements for this role
        </Text>
      </View>

      {/* Matched Skills */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✅ Your Strengths</Text>
        <View style={styles.skillsContainer}>
          {analysisResult.matched_skills.map((skill, index) => (
            <View key={index} style={styles.skillChip}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Nice-to-Have Skills (Optional gaps) */}
      {analysisResult.nice_to_have_skills && 
       analysisResult.nice_to_have_skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Nice to Have</Text>
          <View style={styles.niceToHaveList}>
            {analysisResult.nice_to_have_skills.map((skill, index) => (
              <Text key={index} style={styles.niceToHaveText}>
                • {skill}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Overall Assessment */}
      {analysisResult.overall_assessment && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Assessment</Text>
          <Text style={styles.assessmentText}>
            {analysisResult.overall_assessment}
          </Text>
        </View>
      )}

      {/* CTA Box - OFFER $5 TAILORING */}
      <View style={styles.ctaBox}>
        <Text style={styles.ctaIcon}>✨</Text>
        <Text style={styles.ctaTitle}>Optimize Your CV for This Job</Text>
        <Text style={styles.ctaDescription}>
          Get an ATS-optimized CV tailored to match this exact job description.
          Increase your chances of getting past automated screening.
        </Text>
        
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>One-time payment</Text>
          <Text style={styles.price}>$5</Text>
        </View>

        <TouchableOpacity
          style={styles.payButton}
          onPress={() => navigation.navigate('Payment', {
            cvId,
            jobDescription,
            amount: 500, // $5 in cents
          })}
        >
          <Text style={styles.buttonText}>Tailor My CV for This Job</Text>
        </TouchableOpacity>

        <Text style={styles.ctaNote}>
          Your tailored CV will be ready in ~2 minutes
        </Text>
      </View>

      {/* Disclaimer */}
      <Text style={styles.disclaimer}>
        GlobalReady improves preparation quality. It does not guarantee 
        interviews, offers, visas, or admissions.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // ... similar styles as NotFitYetReport ...
  
  ctaBox: {
    backgroundColor: '#182434',
    margin: 20,
    padding: 25,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#0d6cf2',
    alignItems: 'center',
  },
  ctaIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  ctaDescription: {
    fontSize: 14,
    color: '#90a9cb',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  priceBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 12,
    color: '#90a9cb',
    marginBottom: 5,
  },
  price: {
    fontSize: 40,
    fontWeight: '800',
    color: '#0d6cf2',
  },
  payButton: {
    backgroundColor: '#0d6cf2',
    height: 56,
    width: '100%',
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0d6cf2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  ctaNote: {
    fontSize: 12,
    color: '#90a9cb',
    marginTop: 12,
    textAlign: 'center',
  },
});
```

**Action Items:**
- [ ] Test with match score = 45% → Must show NotFitYetReport
- [ ] Test with match score = 75% → Must show GoodFitReport
- [ ] Verify NO payment prompt appears for <60%
- [ ] Verify $5 payment CTA appears for ≥60%
- [ ] Test course recommendations display
- [ ] Test navigation to Skills Hub from <60% report

---

## 6. Skills Hub Course Registration

### Course Registration Screen
```typescript
// screens/SkillsHub/CourseRegistrationScreen.tsx
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

const CourseRegistrationScreen = ({ route, navigation }) => {
  const { courseId, courseTitle } = route.params;
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    preferredDate: null,
  });
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSubmit = async () => {
    // Validate form
    if (!formData.fullName || !formData.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Insert registration
      const { data, error } = await supabase
        .from('course_registrations')
        .insert({
          user_id: user.id,
          course_id: courseId,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          preferred_date: formData.preferredDate,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        // Handle duplicate registration
        if (error.code === '23505') {
          Alert.alert(
            'Already Registered',
            "You've already signed up for this course!"
          );
          return;
        }
        throw error;
      }

      // Navigate to confirmation
      navigation.navigate('RegistrationConfirmation', {
        registrationId: data.id,
        courseTitle,
      });

    } catch (err) {
      console.error('Registration error:', err);
      Alert.alert('Error', 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Register for Free Orientation Session</Text>
      <Text style={styles.subtitle}>{courseTitle}</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Full Name *"
          placeholderTextColor="#90a9cb"
          value={formData.fullName}
          onChangeText={(text) => setFormData({ ...formData, fullName: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Email *"
          placeholderTextColor="#90a9cb"
          keyboardType="email-address"
          autoCapitalize="none"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          placeholderTextColor="#90a9cb"
          keyboardType="phone-pad"
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
        />

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>
            {formData.preferredDate
              ? `Preferred Date: ${formData.preferredDate.toLocaleDateString()}`
              : 'Select Preferred Date (Optional)'}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={formData.preferredDate || new Date()}
            mode="date"
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setFormData({ ...formData, preferredDate: selectedDate });
              }
            }}
          />
        )}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Register Now</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.note}>
        * Required fields
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101722',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#90a9cb',
    marginBottom: 30,
  },
  form: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#182434',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#fff',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#314868',
  },
  dateButton: {
    backgroundColor: '#182434',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#314868',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#90a9cb',
  },
  submitButton: {
    backgroundColor: '#0d6cf2',
    height: 56,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0d6cf2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  note: {
    fontSize: 12,
    color: '#90a9cb',
    marginTop: 15,
    textAlign: 'center',
  },
});
```

### Registration Confirmation Screen
```typescript
// screens/SkillsHub/RegistrationConfirmationScreen.tsx
const RegistrationConfirmationScreen = ({ route, navigation }) => {
  const { registrationId, courseTitle } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✅</Text>
      <Text style={styles.title}>Registration Successful!</Text>
      <Text style={styles.message}>
        You've successfully registered for the free orientation session for{' '}
        <Text style={styles.courseName}>{courseTitle}</Text>
      </Text>

      <View style={styles.nextStepsBox}>
        <Text style={styles.nextStepsTitle}>What's Next?</Text>
        <Text style={styles.nextStepsItem}>
          • Check your email for session details
        </Text>
        <Text style={styles.nextStepsItem}>
          • You'll receive a calendar invite
        </Text>
        <Text style={styles.nextStepsItem}>
          • Our team will contact you soon
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('SkillsHub')}
      >
        <Text style={styles.buttonText}>Explore More Courses</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.linkText}>Go to Home</Text>
      </TouchableOpacity>
    </View>
  );
};
```

**Action Items:**
- [ ] Test registration submission
- [ ] Verify duplicate prevention (UNIQUE constraint works)
- [ ] Test confirmation screen navigation
- [ ] Verify data is stored in Supabase
- [ ] Test optional fields (phone, date) work correctly

---

## 7. Error Handling & Loading States

### Reusable Components
```typescript
// components/LoadingState.tsx
export const LoadingState = ({ 
  message = 'Loading...',
  size = 'large',
}) => (
  <View style={styles.container}>
    <ActivityIndicator size={size} color="#0d6cf2" />
    <Text style={styles.text}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#101722',
    padding: 20,
  },
  text: {
    marginTop: 15,
    fontSize: 16,
    color: '#90a9cb',
    textAlign: 'center',
  },
});
```
```typescript
// components/ErrorState.tsx
export const ErrorState = ({ 
  message,
  onRetry,
  showIcon = true,
}) => (
  <View style={styles.container}>
    {showIcon && <Text style={styles.icon}>⚠️</Text>}
    <Text style={styles.message}>{message}</Text>
    {onRetry && (
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#101722',
    padding: 30,
  },
  icon: {
    fontSize: 60,
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#90a9cb',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0d6cf2',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 9999,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
```

### Usage in Screens
```typescript
// screens/Example/SomeScreen.tsx
const SomeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchSomeData();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Analyzing your CV..." />;
  }

  if (error) {
    return (
      <ErrorState 
        message={error}
        onRetry={loadData}
      />
    );
  }

  return <View>{/* Normal screen content */}</View>;
};
```

**Action Items:**
- [ ] Create LoadingState component
- [ ] Create ErrorState component
- [ ] Add loading states to all async operations
- [ ] Add error handling to all API calls
- [ ] Test retry functionality

---

## 8. Analytics Implementation

### Analytics Utility
```typescript
// utils/analytics.ts
import { supabase } from '@/lib/supabase';

export const trackEvent = async (
  eventName: string,
  properties: Record<string, any> = {}
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('analytics_events').insert({
      event_name: eventName,
      user_id: user?.id || null,
      properties,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Don't throw - analytics should never break the app
    console.log('Analytics error:', error);
  }
};

// Helper functions for common events
export const analytics = {
  // CV Builder events
  cvBuilderStarted: () => trackEvent('cv_builder_started'),
  cvBuilderStepCompleted: (step: number) => 
    trackEvent('cv_builder_step_completed', { step }),
  cvBuilderCompleted: (cvId: string) => 
    trackEvent('cv_builder_completed', { cv_id: cvId }),

  // CV Tailoring events
  tailorEntryViewed: () => trackEvent('tailor_entry_viewed'),
  tailorOptionSelected: (option: string) => 
    trackEvent('tailor_option_selected', { option }),
  jobMatchGenerated: (matchScore: number) => 
    trackEvent('job_match_generated', { match_score: matchScore }),
  upskillClicked: () => trackEvent('upskill_clicked'),
  infoSessionClicked: () => trackEvent('info_session_clicked'),
  tailorClicked: () => trackEvent('tailor_clicked'),

  // Payment events
  paymentStarted: (amount: number, cvId: string) => 
    trackEvent('payment_started', { amount, cv_id: cvId }),
  paymentSuccess: (amount: number, cvId: string, paymentId: string) => 
    trackEvent('payment_success', { amount, cv_id: cvId, payment_id: paymentId }),
  paymentFailed: (amount: number, error: string) => 
    trackEvent('payment_failed', { amount, error }),

  // Download events
  cvDownloaded: (cvId: string) => 
    trackEvent('cv_downloaded', { cv_id: cvId }),
  cvShared: (cvId: string) => 
    trackEvent('cv_shared', { cv_id: cvId }),

  // Course events
  courseViewed: (courseId: string) => 
    trackEvent('course_viewed', { course_id: courseId }),
  courseRegistered: (courseId: string) => 
    trackEvent('course_registered', { course_id: courseId }),

  // Job events
  jobViewed: (jobId: string) => 
    trackEvent('job_viewed', { job_id: jobId }),
  jobSaved: (jobId: string) => 
    trackEvent('job_saved', { job_id: jobId }),
  jobApplied: (jobId: string) => 
    trackEvent('job_applied', { job_id: jobId }),
};
```

### Usage in Screens
```typescript
// Example: Track CV Builder flow
import { analytics } from '@/utils/analytics';

const PersonalDetailsScreen = () => {
  useEffect(() => {
    analytics.cvBuilderStepCompleted(1);
  }, []);

  // ... rest of component
};

// Example: Track payment flow
const PaymentScreen = () => {
  const handlePayment = async () => {
    analytics.paymentStarted(500, cvId);
    
    try {
      // ... payment logic
      analytics.paymentSuccess(500, cvId, paymentIntent.id);
    } catch (error) {
      analytics.paymentFailed(500, error.message);
    }
  };
};

// Example: Track job match
const MatchReportScreen = () => {
  useEffect(() => {
    analytics.jobMatchGenerated(analysisResult.match_score);
  }, []);
};
```

**Action Items:**
- [ ] Create analytics_events table in Supabase
- [ ] Implement trackEvent utility
- [ ] Add analytics to all key screens
- [ ] Test events are being recorded
- [ ] Create analytics dashboard (optional)

---

## ✅ Phase 1 Completion Checklist

### Navigation & Flow
- [ ] All screens navigate correctly
- [ ] Back button works everywhere
- [ ] Progress bars show correct steps (1/5, 2/5, etc.)
- [ ] Data persists when navigating back
- [ ] Modal screens present correctly

### Forms & Validation
- [ ] All forms validate inputs with Yup
- [ ] Error messages show clearly
- [ ] Auto-save works (every 30 seconds)
- [ ] Can resume from draft
- [ ] Form data persists in AsyncStorage

### CV Functionality
- [ ] CV builder saves data to Supabase
- [ ] CV upload works (file picker)
- [ ] Job match analysis returns correct scores
- [ ] PDF generation works with ATS-readable text
- [ ] Download to device works
- [ ] Share functionality works

### Payment with Stripe
- [ ] Edge Function deployed (create-payment-intent)
- [ ] Payment screen loads correctly
- [ ] Test card 4242 4242 4242 4242 works
- [ ] Payment success updates Supabase
- [ ] CV tailoring triggers after payment
- [ ] Error handling for payment failures

### Business Logic (CRITICAL)
- [ ] <60% match → Show NotFitYetReport (NO payment)
- [ ] ≥60% match → Show GoodFitReport (WITH $5 payment)
- [ ] Disclaimers show on correct screens
- [ ] Course registration works
- [ ] Duplicate registrations prevented

### Technical
- [ ] Supabase queries work correctly
- [ ] Edge Functions deploy successfully
- [ ] RLS policies prevent unauthorized access
- [ ] Error handling is graceful
- [ ] Loading states show everywhere
- [ ] Analytics events track correctly

### Testing
- [ ] Test complete CV builder flow
- [ ] Test complete CV tailoring flow
- [ ] Test payment end-to-end
- [ ] Test download and share
- [ ] Test course registration
- [ ] Test all error scenarios

---

## 🚀 Next Steps After Phase 1

Once Phase 1 is complete and tested:

1. **Phase 2: Jobs Feed & Search**
   - Implement jobs listing
   - Add filters (country, sector, visa)
   - Job save/bookmark feature
   - Job detail pages

2. **Phase 3: Skills Hub Polish**
   - Course catalog with filters
   - Course detail pages
   - Curriculum display
   - Admin CMS for courses

3. **Phase 4: Polish & Optimization**
   - Performance optimization
   - Offline mode
   - Push notifications
   - App Store submission

---

## Environment Variables
```bash
# .env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# Supabase Edge Function Secrets (set via CLI)
STRIPE_SECRET_KEY=sk_test_xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

---

## Test Cards (Stripe)
```
✅ Success: 4242 4242 4242 4242
❌ Decline: 4000 0000 0000 0002
⚠️ 3D Secure: 4000 0025 0000 3155

Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
```

---

**That's Phase 1 complete with Stripe integration!** 🎉

Save this to `PHASE_1_COMPLETE.md` in your Cursor project and start implementing. Let me know when you're ready for Phase 2!