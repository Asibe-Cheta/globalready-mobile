import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/ui/app-header';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';

export default function SupportScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();

  return (
    <View style={styles.container}>
      <AppHeader title="Help & Support" onBack={router.back} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => Linking.openURL('mailto:contact@globalready.tech')}
          >
            <Text style={styles.icon}>📧</Text>
            <View style={styles.contactInfo}>
              <Text style={styles.label}>Email Support</Text>
              <Text style={styles.value}>contact@globalready.tech</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.faqSection}>
            <Text style={styles.sectionTitle}>
              Frequently Asked Questions
            </Text>

            <FAQItem
              question="How much does it cost?"
              answer="CV Builder and CV Tailoring are both €5. Jobs browsing and assessment are free."
              colors={colors}
            />

            <FAQItem
              question="How do I download my CV?"
              answer="After payment, you'll see a download button. The CV is also saved to your account and can be accessed from the 'My CVs' section in your profile."
              colors={colors}
            />

            <FAQItem
              question="Can I get a refund?"
              answer="We do not offer refunds. All purchases are final."
              colors={colors}
            />

            <FAQItem
              question="What makes your CVs ATS-optimized?"
              answer="Our CVs are formatted with proper headings, keywords, and structure that Applicant Tracking Systems can easily parse and understand."
              colors={colors}
            />

            <FAQItem
              question="How long does CV tailoring take?"
              answer="CV tailoring typically takes 2-3 minutes after payment. You'll receive a notification when your tailored CV is ready."
              colors={colors}
            />

            <FAQItem
              question="Do you guarantee job offers?"
              answer="No. GlobalReady provides tools to help you create better CVs and find opportunities, but we cannot guarantee job offers, visa approvals, or admissions."
              colors={colors}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const FAQItem = ({
  question,
  answer,
  colors,
}: {
  question: string;
  answer: string;
  colors: AppColors;
}) => {
  const [expanded, setExpanded] = useState(false);
  const styles = makeStyles(colors);

  return (
    <TouchableOpacity
      style={styles.faqItem}
      onPress={() => setExpanded(!expanded)}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.question}>{question}</Text>
        <Text style={styles.expandIcon}>{expanded ? '−' : '+'}</Text>
      </View>
      {expanded && <Text style={styles.answer}>{answer}</Text>}
    </TouchableOpacity>
  );
};

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
  contactCard: {
    backgroundColor: c.surface,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  icon: {
    fontSize: 32,
    marginRight: 15,
  },
  contactInfo: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: c.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0d6cf2',
  },
  faqSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 20,
  },
  faqItem: {
    backgroundColor: c.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: c.border,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: c.textPrimary,
    flex: 1,
    marginRight: 10,
  },
  expandIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0d6cf2',
  },
  answer: {
    fontSize: 14,
    color: c.textSecondary,
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
});
