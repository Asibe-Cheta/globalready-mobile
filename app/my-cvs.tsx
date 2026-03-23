import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/ui/app-header';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/lib/supabase';

export default function MyCVsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const { isPro, loading: subLoading } = useSubscription();
  const [cvs, setCVs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subLoading) loadCVs();
  }, [subLoading]);

  const loadCVs = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.back();
        return;
      }

      let query = supabase
        .from('cvs')
        .select('*')
        .eq('user_id', user.id);

      if (!isPro) {
        query = query.in('payment_status', ['paid', 'completed']);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setCVs(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load CVs');
    } finally {
      setLoading(false);
    }
  };

  const downloadCV = async (cvId: string) => {
    // Navigate to download screen or trigger download
    router.push({
      pathname: '/download-cv',
      params: { cvId },
    });
  };

  if (loading) {
    return <LoadingState message="Loading your CVs..." />;
  }

  return (
    <View style={styles.container}>
      <AppHeader title="My CVs" onBack={router.back} />
      {cvs.length === 0 ? (
        <View style={styles.emptyWrap}>
          <ErrorState
            message="You don't have any paid CVs yet. Complete a CV and payment to see it here."
            onRetry={loadCVs}
          />
          {!isPro ? (
            <View style={styles.proHint}>
              <Text style={styles.proHintText}>Unlock unlimited downloads and AI tailoring with Pro.</Text>
              <TouchableOpacity onPress={() => router.push('/billing')} accessibilityRole="button">
                <Text style={styles.proHintLink}>Learn more</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={cvs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CVCard
              cv={item}
              styles={styles}
              onView={() => router.push({ pathname: '/view-cv', params: { cvId: item.id } })}
              onDownload={() => downloadCV(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const CVCard = ({
  cv,
  styles,
  onView,
  onDownload,
}: {
  cv: any;
  styles: ReturnType<typeof makeStyles>;
  onView: () => void;
  onDownload: () => void;
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.cvCard}>
      <View style={styles.cvCardContent}>
        <Text style={styles.cvTitle}>
          {cv.type === 'built' ? 'Built CV' : 'Tailored CV'}
        </Text>
        <Text style={styles.cvDate}>Created {formatDate(cv.created_at)}</Text>
      </View>
      <View style={styles.cvCardActions}>
        <TouchableOpacity style={styles.viewButton} onPress={onView}>
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.downloadButton} onPress={onDownload}>
          <Text style={styles.downloadButtonText}>Download</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    emptyWrap: {
      flex: 1,
    },
    proHint: {
      paddingHorizontal: 24,
      paddingBottom: 24,
      alignItems: 'center',
      gap: 8,
    },
    proHintText: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
    },
    proHintLink: {
      fontSize: 15,
      fontWeight: '600',
      color: c.primary,
    },
    listContent: {
      padding: 20,
    },
    cvCard: {
      backgroundColor: c.surface,
      padding: 20,
      borderRadius: 12,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: c.border,
    },
    cvCardContent: {
      marginBottom: 12,
    },
    cvTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: c.textPrimary,
      marginBottom: 6,
    },
    cvDate: {
      fontSize: 14,
      color: c.textSecondary,
    },
    cvCardActions: {
      flexDirection: 'row',
      gap: 12,
    },
    viewButton: {
      backgroundColor: c.surfaceAlt,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    viewButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textPrimary,
    },
    downloadButton: {
      backgroundColor: c.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
    },
    downloadButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
    },
  });
