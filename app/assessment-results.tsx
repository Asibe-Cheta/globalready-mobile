import { LoadingState } from '@/components/LoadingState';
import { AppHeader } from '@/components/ui/app-header';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Results {
  matchScore: number;
  skillGaps: Array<{ skill: string; priority: string; reason: string }>;
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    action: string;
  }>;
  eligibility: 'strong' | 'moderate' | 'weak';
}

export default function AssessmentResultsScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { assessmentData, saveAssessment } = useAssessment();
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateResults();
  }, []);

  const generateResults = async () => {
    try {
      // Calculate match score based on assessment data
      const matchScore = calculateMatchScore(assessmentData);

      // Identify skill gaps
      const skillGaps = identifySkillGaps(assessmentData);

      // Generate recommendations
      const recommendations = generateRecommendations(
        assessmentData,
        matchScore
      );

      const resultsData: Results = {
        matchScore,
        skillGaps,
        recommendations,
        eligibility:
          matchScore >= 70 ? 'strong' : matchScore >= 50 ? 'moderate' : 'weak',
      };

      setResults(resultsData);

      // Save to database
      await saveAssessment();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate results');
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendationAction = (rec: {
    type: string;
    action: string;
  }) => {
    if (rec.type === 'next_step') {
      return;
    } else if (rec.action === 'Browse Jobs') {
      router.push('/jobs-feed');
    } else if (rec.action === 'Build CV') {
      router.push('/cv-education');
    } else if (rec.action === 'View Courses') {
      router.push('/skills-hub-welcome');
    }
  };

  if (loading) {
    return <LoadingState message="Analyzing your profile..." />;
  }

  if (!results) {
    return null;
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Assessment Results"
        onBack={router.back}
        right={
          <TouchableOpacity onPress={() => router.push('/landing')} accessibilityRole="button">
            <Text style={{ fontSize: 18 }}>🏠</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView style={styles.scrollView}>
        {/* Match Score */}
        <View style={styles.scoreSection}>
          <View
            style={[
              styles.scoreCircle,
              results.eligibility === 'strong' && styles.scoreCircleStrong,
              results.eligibility === 'moderate' && styles.scoreCircleModerate,
              results.eligibility === 'weak' && styles.scoreCircleWeak,
            ]}
          >
            <Text style={styles.scoreNumber}>{results.matchScore}%</Text>
          </View>
          <Text style={styles.eligibilityText}>
            {results.eligibility === 'strong' && '🎯 Strong Candidate'}
            {results.eligibility === 'moderate' && '📊 Moderate Candidate'}
            {results.eligibility === 'weak' && '📚 Build Your Profile'}
          </Text>
        </View>

        {/* Skill Gaps */}
        {results.skillGaps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Areas to Improve</Text>
            {results.skillGaps.map((gap, index) => (
              <View key={index} style={styles.gapCard}>
                <View style={styles.priorityBadge}>
                  <Text style={styles.priorityText}>{gap.priority}</Text>
                </View>
                <View style={styles.gapContent}>
                  <Text style={styles.gapSkill}>{gap.skill}</Text>
                  <Text style={styles.gapReason}>{gap.reason}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Next Steps</Text>
          {results.recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendationCard}>
              <Text style={styles.recIcon}>
                {rec.type === 'next_step' && '🚀'}
                {rec.type === 'cv' && '📄'}
                {rec.type === 'upskill' && '📚'}
              </Text>
              <View style={styles.recContent}>
                <Text style={styles.recTitle}>{rec.title}</Text>
                <Text style={styles.recDescription}>{rec.description}</Text>
                <TouchableOpacity
                  style={styles.recButton}
                  onPress={() => handleRecommendationAction(rec)}
                >
                  <Text style={styles.recButtonText}>{rec.action} →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          This assessment is for guidance only. GlobalReady does not guarantee
          job offers, visa approvals, or admissions.
        </Text>
      </ScrollView>
    </View>
  );
}

// Helper functions (same as in AssessmentContext)
const calculateMatchScore = (data: any): number => {
  let score = 0;

  if (data.educationLevel === 'masters' || data.educationLevel === 'phd')
    score += 30;
  else if (data.educationLevel === 'bachelors') score += 20;
  else score += 10;

  if ((data.yearsExperience || 0) >= 5) score += 40;
  else if ((data.yearsExperience || 0) >= 3) score += 30;
  else if ((data.yearsExperience || 0) >= 1) score += 20;
  else score += 10;

  const hasEnglish = data.languages?.some(
    (l: any) =>
      l.language === 'English' && ['Fluent', 'Native'].includes(l.proficiency)
  );
  if (hasEnglish) score += 20;

  const countryLanguages: Record<string, string> = {
    Germany: 'German',
    Netherlands: 'Dutch',
    Canada: 'French',
  };
  const targetLang = countryLanguages[data.targetCountry || ''];
  if (targetLang && data.languages?.some((l: any) => l.language === targetLang)) {
    score += 10;
  }

  return Math.min(score, 100);
};

const identifySkillGaps = (data: any) => {
  const gaps: Array<{ skill: string; priority: string; reason: string }> = [];

  if ((data.yearsExperience || 0) < 3) {
    gaps.push({
      skill: 'Professional Experience',
      priority: 'HIGH',
      reason: 'Most positions require 3+ years of experience',
    });
  }

  const hasEnglish = data.languages?.some((l: any) => l.language === 'English');
  if (!hasEnglish) {
    gaps.push({
      skill: 'English Language',
      priority: 'HIGH',
      reason:
        'English proficiency is required for most international positions',
    });
  }

  return gaps;
};

const generateRecommendations = (data: any, score: number) => {
  const recommendations: Array<{
    type: string;
    title: string;
    description: string;
    action: string;
  }> = [];

  if (score >= 70) {
    recommendations.push({
      type: 'next_step',
      title: 'Start Applying',
      description:
        'You have a strong profile. Browse curated jobs and start applying.',
      action: 'Browse Jobs',
    });
    recommendations.push({
      type: 'cv',
      title: 'Build Your CV',
      description: 'Create an ATS-optimized CV to increase your chances.',
      action: 'Build CV',
    });
  } else if (score >= 50) {
    recommendations.push({
      type: 'upskill',
      title: 'Build Missing Skills',
      description: 'Take courses to strengthen your profile.',
      action: 'View Courses',
    });
    recommendations.push({
      type: 'cv',
      title: 'Build Your CV',
      description: 'Highlight your existing strengths effectively.',
      action: 'Build CV',
    });
  } else {
    recommendations.push({
      type: 'upskill',
      title: 'Focus on Skills First',
      description: 'Your profile needs strengthening before applying.',
      action: 'View Courses',
    });
  }

  return recommendations;
};

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  scrollView: {
    flex: 1,
  },
  scoreSection: {
    alignItems: 'center',
    padding: 30,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: c.surface,
    borderWidth: 4,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  scoreCircleStrong: {
    borderColor: '#4ade80',
  },
  scoreCircleModerate: {
    borderColor: '#fbbf24',
  },
  scoreCircleWeak: {
    borderColor: '#ff6b6b',
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: c.textPrimary,
  },
  eligibilityText: {
    fontSize: 18,
    fontWeight: '600',
    color: c.textPrimary,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 15,
  },
  gapCard: {
    flexDirection: 'row',
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: c.border,
    gap: 12,
  },
  priorityBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    height: 28,
    justifyContent: 'center',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  gapContent: {
    flex: 1,
  },
  gapSkill: {
    fontSize: 16,
    fontWeight: '600',
    color: c.textPrimary,
    marginBottom: 4,
  },
  gapReason: {
    fontSize: 14,
    color: c.textSecondary,
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: c.border,
    gap: 12,
  },
  recIcon: {
    fontSize: 32,
  },
  recContent: {
    flex: 1,
  },
  recTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 6,
  },
  recDescription: {
    fontSize: 14,
    color: c.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  recButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0d6cf2',
  },
  recButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  disclaimer: {
    fontSize: 12,
    color: c.textSecondary,
    textAlign: 'center',
    padding: 20,
    paddingTop: 0,
    lineHeight: 18,
  },
});
