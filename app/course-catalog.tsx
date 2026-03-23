import { LoadingState } from '@/components/LoadingState';
import { AppHeader } from '@/components/ui/app-header';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { coursesService } from '@/services/supabase/courses';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function CourseCatalogScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [registeringCourseId, setRegisteringCourseId] = useState<string | null>(null);

  const categories = [
    { value: 'all', label: 'All Courses', icon: '📚' },
    { value: 'IELTS', label: 'IELTS', icon: '🇬🇧' },
    { value: 'German', label: 'German', icon: '🇩🇪' },
    { value: 'Tech', label: 'Tech', icon: '💻' },
    { value: 'Business', label: 'Business', icon: '💼' },
  ];

  useEffect(() => {
    loadCourses();
  }, [selectedCategory]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const filters =
        selectedCategory !== 'all' ? { category: selectedCategory } : undefined;
      const courseData = await coursesService.getCourses(filters);
      setCourses(courseData || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRegister = async (course: any) => {
    try {
      setRegisteringCourseId(course.id);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', user.id)
        .single();

      const full_name = profile?.full_name || user.user_metadata?.full_name;
      const email = profile?.email || user.email;
      const phone = profile?.phone || undefined;

      if (!full_name || !email) {
        router.push({ pathname: '/hub-info-session', params: { courseId: course.id, courseName: course.title } });
        return;
      }

      await coursesService.registerForCourse(course.id, {
        full_name,
        email,
        phone,
      });
      router.push('/registration-confirmed');
    } catch (error: any) {
      Alert.alert('Unable to register', error?.message || 'Please try again.');
    } finally {
      setRegisteringCourseId(null);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Skills Hub"
        onBack={router.back}
        right={
          <TouchableOpacity onPress={() => router.push('/landing')} accessibilityRole="button">
            <MaterialIcons name="home" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        }
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Skills Hub</Text>
        <Text style={styles.subtitle}>
          Build in-demand skills for global opportunities
        </Text>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryTab,
                selectedCategory === item.value && styles.categoryTabActive,
              ]}
              onPress={() => setSelectedCategory(item.value)}
            >
              <Text style={styles.categoryIcon}>{item.icon}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === item.value &&
                    styles.categoryLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categories}
        />
      </View>

      {/* Courses Grid */}
      {loading ? (
        <LoadingState message="Loading courses..." />
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <CourseCard
              course={item}
              colors={colors}
              onPress={() =>
                router.push({
                  pathname: '/course-detail',
                  params: { courseId: item.id },
                })
              }
              onRegister={() => handleQuickRegister(item)}
              registering={registeringCourseId === item.id}
            />
          )}
          contentContainerStyle={styles.coursesGrid}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyText}>No courses found</Text>
              <Text style={styles.emptySubtext}>
                Try selecting a different category
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const CourseCard = ({
  course,
  colors,
  onPress,
  onRegister,
  registering,
}: {
  course: any;
  colors: AppColors;
  onPress: () => void;
  onRegister: () => void;
  registering: boolean;
}) => {
  const styles = makeStyles(colors);
  return (
    <TouchableOpacity style={styles.courseCard} onPress={onPress}>
      {course.thumbnail_url && (
        <Image source={{ uri: course.thumbnail_url }} style={styles.thumbnail} />
      )}
      <Text style={styles.courseTitle} numberOfLines={2}>
        {course.title}
      </Text>
      <Text style={styles.courseDuration}>
        ⏱ {course.duration_hours || 0} hours
      </Text>
      <View style={styles.courseFooter}>
        <Text style={styles.learnMoreText}>Learn More →</Text>
        <TouchableOpacity
          style={[styles.registerButton, registering && styles.registerButtonDisabled]}
          onPress={onRegister}
          disabled={registering}
        >
          <Text style={styles.registerButtonText}>{registering ? 'Saving...' : 'Register'}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: c.textSecondary,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categories: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    gap: 8,
    marginRight: 12,
  },
  categoryTabActive: {
    backgroundColor: '#0d6cf2',
    borderColor: '#0d6cf2',
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryLabel: {
    fontSize: 14,
    color: c.textSecondary,
    fontWeight: '600',
  },
  categoryLabelActive: {
    color: c.textPrimary,
  },
  coursesGrid: {
    padding: 20,
    paddingTop: 0,
    gap: 15,
  },
  courseCard: {
    flex: 1,
    backgroundColor: c.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    padding: 15,
    marginHorizontal: 5,
    marginBottom: 15,
  },
  thumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: c.surfaceAlt,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 8,
    minHeight: 40,
  },
  courseDuration: {
    fontSize: 12,
    color: c.textSecondary,
    marginBottom: 12,
  },
  courseFooter: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  learnMoreText: {
    fontSize: 14,
    color: '#0d6cf2',
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#0d6cf2',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: c.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 100,
    width: '100%',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: c.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: c.textSecondary,
  },
});
