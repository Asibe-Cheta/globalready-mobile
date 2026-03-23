import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/ui/app-header';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';

export default function TermsOfServiceScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();

  return (
    <View style={styles.container}>
      <AppHeader title="Terms of Service" onBack={router.back} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.lastUpdated}>Last updated: January 2026</Text>

          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing and using GlobalReady ("the Service"), you accept and
            agree to be bound by these Terms of Service. If you do not agree
            to these terms, please do not use the Service.
          </Text>

          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.paragraph}>
            GlobalReady provides:
          </Text>
          <Text style={styles.bulletPoint}>
            • CV building and tailoring services ($5 per service)
          </Text>
          <Text style={styles.bulletPoint}>
            • Job listings and search functionality
          </Text>
          <Text style={styles.bulletPoint}>
            • Work abroad assessment tools
          </Text>
          <Text style={styles.bulletPoint}>
            • Skills training and course information
          </Text>

          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.paragraph}>
            You are responsible for:
          </Text>
          <Text style={styles.bulletPoint}>
            • Maintaining the confidentiality of your account
          </Text>
          <Text style={styles.bulletPoint}>
            • All activities under your account
          </Text>
          <Text style={styles.bulletPoint}>
            • Providing accurate and current information
          </Text>

          <Text style={styles.sectionTitle}>4. Payment Terms</Text>
          <Text style={styles.paragraph}>
            • Services are charged at $5 USD per transaction
          </Text>
          <Text style={styles.paragraph}>
            • Payments are processed securely through Stripe
          </Text>
          <Text style={styles.paragraph}>
            • All sales are final - no refunds for completed services
          </Text>
          <Text style={styles.paragraph}>
            • We reserve the right to change pricing with 30 days notice
          </Text>

          <Text style={styles.sectionTitle}>5. Service Availability</Text>
          <Text style={styles.paragraph}>
            We strive to provide reliable service but do not guarantee:
          </Text>
          <Text style={styles.bulletPoint}>
            • Uninterrupted or error-free service
          </Text>
          <Text style={styles.bulletPoint}>
            • Accuracy of job listings or assessments
          </Text>
          <Text style={styles.bulletPoint}>
            • Job offers, visa approvals, or admissions
          </Text>

          <Text style={styles.sectionTitle}>6. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            • All content and materials are owned by GlobalReady
          </Text>
          <Text style={styles.paragraph}>
            • CVs created through our service belong to you
          </Text>
          <Text style={styles.paragraph}>
            • You grant us license to use your CV data to provide services
          </Text>

          <Text style={styles.sectionTitle}>7. Prohibited Uses</Text>
          <Text style={styles.paragraph}>You may not:</Text>
          <Text style={styles.bulletPoint}>
            • Use the service for illegal purposes
          </Text>
          <Text style={styles.bulletPoint}>
            • Attempt to reverse engineer or hack the service
          </Text>
          <Text style={styles.bulletPoint}>
            • Share your account with others
          </Text>
          <Text style={styles.bulletPoint}>
            • Upload malicious content or viruses
          </Text>

          <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            GlobalReady is not liable for:
          </Text>
          <Text style={styles.bulletPoint}>
            • Job application outcomes
          </Text>
          <Text style={styles.bulletPoint}>
            • Visa or immigration decisions
          </Text>
          <Text style={styles.bulletPoint}>
            • Indirect, incidental, or consequential damages
          </Text>

          <Text style={styles.sectionTitle}>9. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify these terms at any time. Continued
            use of the service after changes constitutes acceptance.
          </Text>

          <Text style={styles.sectionTitle}>10. Contact Information</Text>
          <Text style={styles.paragraph}>
            For questions about these Terms of Service:
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
