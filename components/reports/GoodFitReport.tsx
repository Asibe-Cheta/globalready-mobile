import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { PrimaryButton } from '../ui/primary-button';

interface AnalysisResult {
  match_score: number;
  matched_skills: string[];
  nice_to_have_skills?: string[];
  overall_assessment?: string;
}

interface GoodFitReportProps {
  analysisResult: AnalysisResult;
  cvId: string;
  jobDescription: string;
  navigation: any;
}

export const GoodFitReport: React.FC<GoodFitReportProps> = ({
  analysisResult,
  cvId,
  jobDescription,
  navigation,
}) => {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
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

        <PrimaryButton
          label="Tailor My CV for This Job"
          onPress={() => navigation.push('/complete-purchase', {
            cvId,
            jobDescription,
            amount: 500, // $5 in cents
          })}
          style={styles.payButton}
        />

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

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      alignItems: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
      backgroundColor: c.surface,
    },
    scoreCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: c.surfaceAlt,
      borderWidth: 4,
      borderColor: c.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    scoreText: {
      fontSize: 36,
      fontWeight: '800',
      color: c.primary,
    },
    verdict: {
      fontSize: 24,
      fontWeight: '700',
      color: c.textPrimary,
      marginBottom: 10,
    },
    message: {
      fontSize: 16,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    section: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: c.textPrimary,
      marginBottom: 15,
    },
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    skillChip: {
      backgroundColor: c.surfaceAlt,
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: c.border,
    },
    skillText: {
      color: c.textPrimary,
      fontSize: 14,
    },
    niceToHaveList: {
      marginTop: 10,
    },
    niceToHaveText: {
      fontSize: 14,
      color: c.textSecondary,
      lineHeight: 24,
      marginBottom: 8,
    },
    assessmentText: {
      fontSize: 14,
      color: c.textSecondary,
      lineHeight: 24,
    },
    ctaBox: {
      backgroundColor: c.surface,
      margin: 20,
      padding: 25,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: c.primary,
      alignItems: 'center',
    },
    ctaIcon: {
      fontSize: 48,
      marginBottom: 15,
    },
    ctaTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: c.textPrimary,
      textAlign: 'center',
      marginBottom: 10,
    },
    ctaDescription: {
      fontSize: 14,
      color: c.textSecondary,
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
      color: c.textSecondary,
      marginBottom: 5,
    },
    price: {
      fontSize: 40,
      fontWeight: '800',
      color: c.primary,
    },
    payButton: {
      width: '100%',
    },
    ctaNote: {
      fontSize: 12,
      color: c.textSecondary,
      marginTop: 12,
      textAlign: 'center',
    },
    disclaimer: {
      fontSize: 12,
      color: c.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 30,
      paddingBottom: 40,
      lineHeight: 18,
    },
  });
