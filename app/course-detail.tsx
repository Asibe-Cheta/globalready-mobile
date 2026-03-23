import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { coursesService, type Course, type VirtualSession } from '@/services/supabase/courses';

function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = days[date.getUTCDay()];
  const month = months[date.getUTCMonth()];
  const dateNum = date.getUTCDate();
  const suffix = dateNum === 1 || dateNum === 21 || dateNum === 31 ? 'st'
    : dateNum === 2 || dateNum === 22 ? 'nd'
    : dateNum === 3 || dateNum === 23 ? 'rd' : 'th';
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  const minStr = minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : ':00';
  return `${day}, ${month} ${dateNum}${suffix} at ${hour12}${minStr} ${ampm} GMT`;
}

export default function CourseDetailScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ courseId: string }>();
  const courseId = params?.courseId;

  const [course, setCourse] = useState<Course | null>(null);
  const [session, setSession] = useState<VirtualSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!courseId) {
      setError(true);
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const [courseData, sessionData] = await Promise.all([
          coursesService.getCourseById(courseId),
          coursesService.getVirtualSession(courseId),
        ]);
        setCourse(courseData);
        setSession(sessionData);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [courseId]);

  const handleShare = async () => {
    if (!course) return;
    try {
      await Share.share({ message: `Check out ${course.title} on GlobalReady!` });
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !course) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
              <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Course Not Found</Text>
            <View style={styles.iconButton} />
          </View>
          <View style={styles.loadingContainer}>
            <MaterialIcons name="error-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.subtitle, { textAlign: 'center', marginTop: 12 }]}>
              This course could not be found. It may have been removed.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const modules = Array.isArray(course.syllabus) ? course.syllabus : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{course.title}</Text>
          <TouchableOpacity style={styles.iconButton} onPress={handleShare} accessibilityRole="button">
            <MaterialIcons name="share" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.title}>{course.title}</Text>
            <Text style={styles.subtitle}>
              {course.description || course.subtitle || ''}
            </Text>
            {course.duration && (
              <View style={styles.durationBadge}>
                <MaterialIcons name="schedule" size={14} color={colors.primary} />
                <Text style={styles.durationText}>{course.duration}</Text>
              </View>
            )}
          </View>

          {modules.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>What you will learn</Text>
              <View style={styles.moduleList}>
                {modules.map((mod, i) => (
                  <View key={i} style={styles.moduleCard}>
                    <View style={styles.moduleRow}>
                      <View style={[styles.moduleIcon, { backgroundColor: `${mod.accent || colors.primary}33` }]}>
                        <MaterialIcons name={(mod.icon || 'school') as never} size={20} color={mod.accent || colors.primary} />
                      </View>
                      <View style={styles.moduleContent}>
                        <Text style={styles.moduleTitle}>{mod.title}</Text>
                        <Text style={styles.moduleDescription}>{mod.description}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.noticeCard}>
            <MaterialIcons name="event" size={18} color={colors.primary} />
            <View style={styles.noticeContent}>
              {session ? (
                <>
                  <Text style={styles.noticeTitle}>
                    Our next free orientation session is on {formatSessionDate(session.session_date)}
                  </Text>
                  <Text style={styles.noticeSubtitle}>
                    Meet the instructors and learn about the career path.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.noticeTitle}>Next live orientation session announced soon</Text>
                  <Text style={styles.noticeSubtitle}>
                    Register below to be notified when the next session is scheduled.
                  </Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.ctaContainer}>
            <PrimaryButton
              label="Register for orientation session"
              icon="arrow-forward"
              onPress={() =>
                router.push(
                  `/hub-info-session?courseId=${course.id}&courseName=${encodeURIComponent(course.title)}`
                )
              }
            />
            <View style={styles.secureRow}>
              <MaterialIcons name="lock" size={14} color={colors.textSecondary} />
              <Text style={styles.secureText}>Your data is secure & private</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: c.background,
  },
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: c.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 8,
  },
  hero: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: c.textSecondary,
    lineHeight: 22,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(13,108,242,0.12)',
  },
  durationText: {
    color: '#0d6cf2',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    color: c.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 12,
  },
  moduleList: {
    gap: 10,
  },
  moduleCard: {
    backgroundColor: c.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    padding: 14,
  },
  moduleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  moduleIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleContent: {
    flex: 1,
  },
  moduleTitle: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  moduleDescription: {
    color: c.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  noticeCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(13, 108, 242, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(13, 108, 242, 0.3)',
    padding: 16,
    marginBottom: 18,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textPrimary,
    marginBottom: 6,
  },
  noticeSubtitle: {
    fontSize: 12,
    color: c.textSecondary,
  },
  ctaContainer: {
    gap: 12,
    marginTop: 8,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    opacity: 0.7,
  },
  secureText: {
    color: c.textSecondary,
    fontSize: 12,
  },
});
