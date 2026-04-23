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
          <Text style={styles.lastUpdated}>Last updated: April 2026</Text>

          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing and using GlobalReady ("the Service"), you accept and agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.
          </Text>

          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.paragraph}>
            GlobalReady offers a free plan with limited access and a paid subscription called GlobalReady Pro at €9.99 per month. GlobalReady Pro gives access to premium features within GlobalReady, including:
          </Text>
          <Text style={styles.bulletPoint}>• Full access to CV building and tailoring tools</Text>
          <Text style={styles.bulletPoint}>• Unlimited CV downloads</Text>
          <Text style={styles.bulletPoint}>• Unlimited AI job-fit checks</Text>
          <Text style={styles.bulletPoint}>• Full job board access (all listings)</Text>
          <Text style={styles.bulletPoint}>• Unlimited AI interview practice sessions</Text>
          <Text style={styles.paragraph}>
            Some job listings on GlobalReady link to third-party platforms that may require separate registration, subscriptions, fees, or additional steps. GlobalReady Pro does not grant access to any third-party platform.
          </Text>

          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.paragraph}>You are responsible for:</Text>
          <Text style={styles.bulletPoint}>• Maintaining the confidentiality of your account</Text>
          <Text style={styles.bulletPoint}>• All activities under your account</Text>
          <Text style={styles.bulletPoint}>• Providing accurate and current information</Text>

          <Text style={styles.sectionTitle}>4. Subscription and Billing</Text>
          <Text style={styles.paragraph}>
            GlobalReady Pro is charged at €9.99 per month. Your subscription renews automatically each month unless you cancel before the next billing date. Payments are processed securely through Stripe. We reserve the right to change pricing with at least 30 days' prior notice before the new price takes effect.
          </Text>

          <Text style={styles.sectionTitle}>5. Cancellation</Text>
          <Text style={styles.paragraph}>
            You may cancel your subscription at any time by going to Profile → Billing in the app and selecting "Cancel Subscription", or by contacting us at contact@globalready.tech. Cancellation stops future renewals. Your Pro access continues until the end of the current billing period.
          </Text>

          <Text style={styles.sectionTitle}>6. Refunds</Text>
          <Text style={styles.paragraph}>
            Subscription fees are generally non-refundable once a billing period has started and access to the digital service has been made available. We will review requests on a case-by-case basis where a billing error has occurred or applicable law requires a remedy. Contact contact@globalready.tech for billing support.
          </Text>

          <Text style={styles.sectionTitle}>7. AI Features</Text>
          <Text style={styles.paragraph}>
            AI-generated feedback, interview practice, and CV suggestions are provided for informational and training purposes only and may not always be accurate, complete, or suitable for every situation. GlobalReady does not guarantee any particular outcome from AI-powered features. You are responsible for reviewing AI-generated content before relying on it.
          </Text>

          <Text style={styles.sectionTitle}>8. Third-Party Platforms</Text>
          <Text style={styles.paragraph}>
            Some job listings link to external third-party platforms. GlobalReady is not responsible for the content, availability, pricing, or requirements of those platforms. Accessing them is subject to their own terms and conditions.
          </Text>

          <Text style={styles.sectionTitle}>9. Service Availability</Text>
          <Text style={styles.paragraph}>We strive to provide reliable service but do not guarantee:</Text>
          <Text style={styles.bulletPoint}>• Uninterrupted or error-free service</Text>
          <Text style={styles.bulletPoint}>• Accuracy of job listings or assessments</Text>
          <Text style={styles.bulletPoint}>• Job offers, visa approvals, or admissions</Text>

          <Text style={styles.sectionTitle}>10. Intellectual Property</Text>
          <Text style={styles.bulletPoint}>• All platform content and materials are owned by GlobalReady</Text>
          <Text style={styles.bulletPoint}>• CVs you create belong to you</Text>
          <Text style={styles.bulletPoint}>• You grant us a limited licence to use your CV data solely to provide the Service</Text>

          <Text style={styles.sectionTitle}>11. Prohibited Uses</Text>
          <Text style={styles.paragraph}>You may not:</Text>
          <Text style={styles.bulletPoint}>• Use the service for illegal purposes</Text>
          <Text style={styles.bulletPoint}>• Attempt to reverse engineer or hack the service</Text>
          <Text style={styles.bulletPoint}>• Share your account credentials with others</Text>
          <Text style={styles.bulletPoint}>• Upload malicious content or viruses</Text>

          <Text style={styles.sectionTitle}>12. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            GlobalReady is not liable for job application outcomes, visa or immigration decisions, decisions made by third-party platforms, or indirect, incidental, or consequential damages. To the maximum extent permitted by law, GlobalReady's total liability is limited to the amount you paid in the 12 months preceding the claim.
          </Text>

          <Text style={styles.sectionTitle}>13. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We may modify these Terms at any time. We will notify you of material changes via the app or email. Continued use after changes constitutes acceptance.
          </Text>

          <Text style={styles.sectionTitle}>14. Contact and Support</Text>
          <Text style={styles.paragraph}>
            For billing, cancellation, refund questions, or general support:
          </Text>
          <Text style={styles.contactInfo}>Email: contact@globalready.tech</Text>
          <Text style={styles.contactInfo}>Website: globalready.com</Text>
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
