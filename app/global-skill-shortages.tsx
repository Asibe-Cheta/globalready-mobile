import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { Screen } from '@/components/ui/screen';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { inDemandRolesService } from '@/services/supabase/in-demand-roles';
import { InDemandRole } from '@/types/job';

export default function GlobalSkillShortagesScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const [roles, setRoles] = useState<InDemandRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inDemandRolesService.getRoles();
      setRoles(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GLOBALREADY</Text>
          <View style={styles.iconSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>
            Top 10 In-Demand{'\n'}
            <Text style={styles.titleAccent}>Tech Roles</Text>
          </Text>

          <View style={styles.heroCard}>
            <View style={styles.heroContent}>
              <View style={styles.heroHeader}>
                <MaterialIcons name="rocket-launch" size={20} color={colors.primary} />
                <Text style={styles.heroTitle}>Global Digital Talent Gap</Text>
              </View>
              <Text style={styles.heroText}>
                Top Western economies are facing a massive shortage of tech talent. These roles
                currently offer the highest probability for visa sponsorship and remote work
                opportunities.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>High Demand Roles</Text>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading roles...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorWrap}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadRoles}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cardList}>
              {roles.map((role) => (
                <View key={role.id} style={styles.roleCard}>
                  <View style={[styles.roleIcon, { backgroundColor: `${role.accent_color}1A` }]}>
                    <MaterialIcons name={role.icon as any} size={20} color={role.accent_color} />
                  </View>
                  <View style={styles.roleContent}>
                    <Text style={styles.roleTitle}>{role.rank}. {role.title}</Text>
                    <Text style={styles.roleReason}>
                      <Text style={styles.roleWhyLabel}>Why:</Text> {role.reason}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.note}>
            Note: We are currently focusing on tech roles. Other domains like healthcare and
            logistics will follow later.
          </Text>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.ctaButton, (loading || roles.length === 0) && styles.ctaButtonDisabled]}
            accessibilityRole="button"
            disabled={loading || roles.length === 0}
            onPress={() => router.push('/jobs-feed')}
          >
            <Text style={styles.ctaText}>Continue</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: c.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    paddingRight: 40,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 160,
  },
  title: {
    color: c.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 18,
  },
  titleAccent: {
    color: c.primary,
  },
  heroCard: {
    backgroundColor: '#0f1b2d',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 22,
  },
  heroContent: {
    gap: 10,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  heroText: {
    color: c.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionLabel: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    color: c.textSecondary,
    fontSize: 14,
  },
  errorWrap: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: c.primary,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  cardList: {
    gap: 12,
  },
  roleCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: c.surfaceAlt,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    color: c.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  roleReason: {
    marginTop: 6,
    color: c.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  roleWhyLabel: {
    color: c.primary,
    fontWeight: '700',
  },
  note: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 12,
    color: c.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 28,
    backgroundColor: c.navBg,
  },
  ctaButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ctaButtonDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
