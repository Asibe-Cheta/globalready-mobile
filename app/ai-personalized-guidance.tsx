import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { loadSkillsHubDraft, SkillsHubDraft } from '@/services/storage/progress';
import { coursesService } from '@/services/supabase/courses';

const pathLabels: Record<string, string> = {
  side_income: 'Side Income Path',
  remote_work: 'Remote Work Path',
  relocate: 'Relocation Path',
  career_tech: 'Tech Career Path',
};

const getAIContent = (
  draft: SkillsHubDraft | null,
  targetCountry?: string,
) => {
  const path = draft?.selected_path;
  const pathLabel = pathLabels[path ?? ''] || 'Your Personalized Path';
  const country = targetCountry || '';

  let title = pathLabel;
  if (country) title = `${pathLabel}: ${country}`;

  let body = 'Based on your profile and goals, here are the best paths forward.';
  let tipTitle = 'Strategic Recommendation';
  let tipBody = 'Start with the courses below to build the skills you need.';

  if (path === 'side_income') {
    body = 'Quick income streams can help fund your bigger goals. AI-powered side hustles are the fastest route.';
    tipTitle = 'Quick Win';
    tipBody = 'Start with AI Side Hustles — many learners earn their first income within 30 days.';
  } else if (path === 'remote_work') {
    body = 'Remote work gives you location independence. Focus on high-demand tech skills that companies hire for globally.';
    tipTitle = 'Top Priority';
    tipBody = 'Companies prioritize candidates with verifiable tech skills. Pick one path and commit for 3-6 months.';
  } else if (path === 'relocate') {
    body = country
      ? `Relocating to ${country} requires strong credentials. Build the right skills and certifications to strengthen your application.`
      : 'Relocating abroad requires strong credentials. Build the right skills and certifications to strengthen your visa application.';
    tipTitle = 'Visa Advantage';
    tipBody = 'Language proficiency + a tech certification significantly increases your chances. Consider German or IELTS training.';
  } else if (path === 'career_tech') {
    body = 'A tech career opens doors globally. Choose a specialization based on your interests and commit to 6-12 months of learning.';
    tipTitle = 'Career Tip';
    tipBody = 'Software Development and Data Analysis have the highest demand and best job placement rates.';
  }

  if (draft?.reason) {
    body += ` You mentioned: "${draft.reason}" — we'll keep that in focus.`;
  }

  return { title, body, tipTitle, tipBody };
};

type Section = {
  key: string;
  title: string;
  items: Array<{
    id: string;
    title: string;
    subtitle: string | null;
    icon: string;
    tint_color: string;
  }>;
};

export default function AIPersonalizedGuidanceScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [draft, setDraft] = useState<SkillsHubDraft | null>(null);
  const [targetCountry, setTargetCountry] = useState('');
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .maybeSingle();

          if (profile?.full_name) {
            setUserName(profile.full_name.split(' ')[0]);
          } else if (user.user_metadata?.full_name) {
            setUserName(user.user_metadata.full_name.split(' ')[0]);
          } else if (user.email) {
            setUserName(user.email.split('@')[0]);
          }

          if (profile?.avatar_url) {
            setAvatarUrl(profile.avatar_url);
          }

          const { data: assessment } = await supabase
            .from('assessments')
            .select('target_country')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (assessment?.target_country) {
            setTargetCountry(assessment.target_country);
          }
        }

        const hubDraft = await loadSkillsHubDraft();
        setDraft(hubDraft);

        const courseSections = await coursesService.getCoursesByPathCategory();
        setSections(courseSections);
      } catch {
        // Silently fail — we'll show generic content
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const ai = getAIContent(draft, targetCountry);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.brandRow}>
          <MaterialIcons name="rocket-launch" size={18} color={colors.primary} />
          <Text style={styles.brandText}>GLOBALREADY</Text>
        </View>
        <View style={styles.avatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <MaterialIcons name="person" size={22} color={colors.textSecondary} />
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>
            Strategy for{' '}
            <Text style={styles.heroAccent}>{userName || 'You'}</Text>
          </Text>
          <View style={styles.aiCard}>
            <View style={styles.aiBadge}>
              <MaterialIcons name="auto-awesome" size={16} color={colors.primary} />
              <Text style={styles.aiBadgeText}>AI ANALYSIS</Text>
            </View>
            <Text style={styles.aiTimestamp}>Updated just now</Text>
            <Text style={styles.aiTitle}>{ai.title}</Text>
            <Text style={styles.aiBody}>{ai.body}</Text>
            <View style={styles.aiTip}>
              <MaterialIcons name="lightbulb" size={18} color={colors.primary} />
              <View style={styles.aiTipText}>
                <Text style={styles.aiTipTitle}>{ai.tipTitle}</Text>
                <Text style={styles.aiTipBody}>{ai.tipBody}</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionIntro}>
          Here are various paths you can choose from. These are high-demand skills and tech career paths.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          sections.map((section) => (
            <View key={section.key} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionList}>
                {section.items.map((item) => (
                  <View key={item.id} style={styles.card}>
                    <View style={styles.cardLeft}>
                      <View style={[styles.cardIcon, { backgroundColor: `${item.tint_color}22` }]}>
                        <MaterialIcons name={item.icon as never} size={22} color={item.tint_color} />
                      </View>
                      <View style={styles.cardText}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.cardButton}
                      onPress={() => router.push(`/course-detail?courseId=${item.id}`)}
                      accessibilityRole="button"
                    >
                      <Text style={styles.cardButtonText}>Learn More</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.surface,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    color: c.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.surface,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  hero: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: c.textPrimary,
    marginBottom: 12,
  },
  heroAccent: {
    color: c.primary,
  },
  aiCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    gap: 10,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(13,108,242,0.12)',
  },
  aiBadgeText: {
    color: c.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  aiTimestamp: {
    color: c.textSecondary,
    fontSize: 11,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: c.textPrimary,
  },
  aiBody: {
    color: c.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  aiTip: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(13,108,242,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(13,108,242,0.2)',
  },
  aiTipText: {
    flex: 1,
    gap: 4,
  },
  aiTipTitle: {
    color: c.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  aiTipBody: {
    color: c.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionIntro: {
    paddingHorizontal: 16,
    marginTop: 20,
    color: c.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginTop: 22,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 12,
  },
  sectionList: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: c.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  cardButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  cardButtonText: {
    color: c.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
});
