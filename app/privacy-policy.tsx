import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/ui/app-header';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';

export default function PrivacyPolicyScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();

  return (
    <View style={styles.container}>
      <AppHeader title="Privacy Policy" onBack={router.back} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.lastUpdated}>Last updated: April 2026</Text>

          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.paragraph}>
            GlobalReady ("we", "our", "us") is committed to protecting your
            privacy. We collect the following information:
          </Text>
          <Text style={styles.bulletPoint}>
            • Personal information (name, email, phone number)
          </Text>
          <Text style={styles.bulletPoint}>
            • CV data and professional information
          </Text>
          <Text style={styles.bulletPoint}>
            • Usage analytics and app interactions
          </Text>
          <Text style={styles.bulletPoint}>
            • Payment information (processed securely through Stripe)
          </Text>

          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use your information to:
          </Text>
          <Text style={styles.bulletPoint}>
            • Provide CV building and tailoring services
          </Text>
          <Text style={styles.bulletPoint}>
            • Process payments securely
          </Text>
          <Text style={styles.bulletPoint}>
            • Send course information and updates
          </Text>
          <Text style={styles.bulletPoint}>
            • Improve our services and user experience
          </Text>
          <Text style={styles.bulletPoint}>
            • Send important service notifications
          </Text>

          <Text style={styles.sectionTitle}>3. Data Security</Text>
          <Text style={styles.paragraph}>
            We implement industry-standard security measures:
          </Text>
          <Text style={styles.bulletPoint}>
            • All data is encrypted in transit and at rest
          </Text>
          <Text style={styles.bulletPoint}>
            • Data is stored on Supabase (EU servers)
          </Text>
          <Text style={styles.bulletPoint}>
            • Payment processing through Stripe (PCI DSS compliant)
          </Text>
          <Text style={styles.bulletPoint}>
            • Regular security audits and updates
          </Text>

          <Text style={styles.sectionTitle}>4. Your Rights</Text>
          <Text style={styles.paragraph}>
            You have the right to:
          </Text>
          <Text style={styles.bulletPoint}>
            • Access your personal data
          </Text>
          <Text style={styles.bulletPoint}>
            • Request correction of inaccurate data
          </Text>
          <Text style={styles.bulletPoint}>
            • Delete your account and data
          </Text>
          <Text style={styles.bulletPoint}>
            • Export your data in a portable format
          </Text>
          <Text style={styles.bulletPoint}>
            • Opt-out of marketing communications
          </Text>

          <Text style={styles.sectionTitle}>5. AI-Powered Features</Text>
          <Text style={styles.paragraph}>
            GlobalReady uses AI to power CV tailoring, job-fit analysis, and interview practice. AI-generated outputs are provided for informational and training purposes only and may not always be accurate, complete, or suitable for every situation. You are responsible for reviewing AI-generated content before relying on it. Your data may be processed by our AI providers (including Anthropic) solely to deliver these features to you.
          </Text>

          <Text style={styles.sectionTitle}>6. Third-Party Services</Text>
          <Text style={styles.paragraph}>
            We use the following third-party services:
          </Text>
          <Text style={styles.bulletPoint}>• Supabase: Database and authentication (EU servers)</Text>
          <Text style={styles.bulletPoint}>• Stripe: Payment processing (PCI DSS compliant)</Text>
          <Text style={styles.bulletPoint}>• Anthropic: AI-powered CV and interview features</Text>
          <Text style={styles.bulletPoint}>• VAPI: AI voice interview sessions</Text>

          <Text style={styles.sectionTitle}>7. Data Retention</Text>
          <Text style={styles.paragraph}>
            We retain your data while your account is active. On account deletion, we delete or anonymise your personal data within a reasonable period, except where retention is required by law. You can delete your account via Profile → Delete Account in the app.
          </Text>

          <Text style={styles.sectionTitle}>8. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have questions about this Privacy Policy, please contact us:
          </Text>
          <Text style={styles.contactInfo}>
            Email: contact@globalready.tech
          </Text>
          <Text style={styles.contactInfo}>
            Website: globalready.com
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: c.textSecondary,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: c.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    color: c.textSecondary,
    lineHeight: 24,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 16,
    color: c.textSecondary,
    lineHeight: 24,
    marginBottom: 8,
    paddingLeft: 20,
  },
  contactInfo: {
    fontSize: 16,
    color: '#0d6cf2',
    lineHeight: 24,
    marginBottom: 8,
  },
});
