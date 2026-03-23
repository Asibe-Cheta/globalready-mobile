import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { AppHeader } from '@/components/ui/app-header';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function MyCoursesScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.back();
        return;
      }

      const { data, error } = await supabase
        .from('course_registrations')
        .select('*, courses(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (_error: any) {
      // Permission denied or other errors: show empty state instead of error alert
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading your courses..." />;
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="My Courses"
        onBack={router.back}
        right={
          <TouchableOpacity onPress={() => router.push('/landing')} accessibilityRole="button">
            <MaterialIcons name="home" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        }
      />
      {registrations.length === 0 ? (
        <ErrorState
          message="You haven't registered for any courses yet"
          onRetry={loadRegistrations}
        />
      ) : (
        <FlatList
          data={registrations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CourseRegistrationCard registration={item} colors={colors} />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const CourseRegistrationCard = ({ registration, colors }: { registration: any; colors: AppColors }) => {
  const styles = makeStyles(colors);
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const course = registration.courses || {};

  return (
    <View style={styles.registrationCard}>
      <Text style={styles.courseTitle}>{course.title || 'Course'}</Text>
      <Text style={styles.registrationDate}>
        Registered: {formatDate(registration.created_at)}
      </Text>
      {registration.preferred_date && (
        <Text style={styles.preferredDate}>
          Preferred Date: {registration.preferred_date}
        </Text>
      )}
      <Text style={styles.status}>
        Status: {registration.status || 'pending'}
      </Text>
    </View>
  );
};

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  listContent: {
    padding: 20,
  },
  registrationCard: {
    backgroundColor: c.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: c.border,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 8,
  },
  registrationDate: {
    fontSize: 14,
    color: c.textSecondary,
    marginBottom: 4,
  },
  preferredDate: {
    fontSize: 14,
    color: c.textSecondary,
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
    color: c.textSecondary,
    marginTop: 8,
  },
});
