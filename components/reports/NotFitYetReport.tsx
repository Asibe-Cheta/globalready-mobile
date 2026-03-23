import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { PrimaryButton } from '../ui/primary-button';
import { SecondaryButton } from '../ui/secondary-button';

interface MissingSkill {
  skill: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
}

interface AnalysisResult {
  match_score: number;
  matched_skills: string[];
  missing_skills: MissingSkill[];
  recommended_courses?: Array<{
    course_id: string;
    title: string;
    duration_hours: number;
    rating: number;
  }>;
}

interface NotFitYetReportProps {
  analysisResult: AnalysisResult;
  navigation: any;
}

export const NotFitYetReport: React.FC<NotFitYetReportProps> = ({ analysisResult, navigation }) => {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const sortedMissingSkills = [...analysisResult.missing_skills].sort((a, b) => {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

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
        {sortedMissingSkills.map((item, index) => (
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
      <View style={styles.buttonContainer}>
        <PrimaryButton
          label="Check Courses to Upskill"
          onPress={() => navigation.push('/skills-hub-welcome')}
          style={styles.primaryButton}
        />

        <SecondaryButton
          label="Sign Up for Free Info Session"
          onPress={() => navigation.push('/hub-info-session')}
          style={styles.secondaryButton}
        />
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
    missingSkillCard: {
      backgroundColor: c.surface,
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
      backgroundColor: c.textSecondary,
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
      color: c.textPrimary,
      marginBottom: 5,
    },
    skillReason: {
      fontSize: 14,
      color: c.textSecondary,
      lineHeight: 20,
    },
    courseCard: {
      backgroundColor: c.surface,
      padding: 20,
      borderRadius: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    courseTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: c.textPrimary,
      marginBottom: 10,
    },
    courseMetaWrapper: {
      flexDirection: 'row',
      gap: 15,
    },
    courseDuration: {
      fontSize: 14,
      color: c.textSecondary,
    },
    courseRating: {
      fontSize: 14,
      color: c.textSecondary,
    },
    buttonContainer: {
      paddingHorizontal: 20,
      marginBottom: 30,
    },
    primaryButton: {
      marginBottom: 15,
    },
    secondaryButton: {
      marginBottom: 0,
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
