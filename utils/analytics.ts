import { supabase } from '@/lib/supabase';

export const trackEvent = async (
  eventName: string,
  properties: Record<string, any> = {}
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    // Note: You'll need to create an analytics_events table in Supabase
    // For now, we'll just log to console
    console.log('Analytics Event:', eventName, properties);

    // Uncomment when analytics_events table is created:
    // await supabase.from('analytics_events').insert({
    //   event_name: eventName,
    //   user_id: user?.id || null,
    //   properties,
    //   timestamp: new Date().toISOString(),
    // });
  } catch (error) {
    // Don't throw - analytics should never break the app
    console.log('Analytics error:', error);
  }
};

// Helper functions for common events
export const analytics = {
  // CV Builder events
  cvBuilderStarted: () => trackEvent('cv_builder_started'),
  cvBuilderStepCompleted: (step: number) => 
    trackEvent('cv_builder_step_completed', { step }),
  cvBuilderCompleted: (cvId: string) => 
    trackEvent('cv_builder_completed', { cv_id: cvId }),

  // CV Tailoring events
  tailorEntryViewed: () => trackEvent('tailor_entry_viewed'),
  tailorOptionSelected: (option: string) => 
    trackEvent('tailor_option_selected', { option }),
  jobMatchGenerated: (matchScore: number) => 
    trackEvent('job_match_generated', { match_score: matchScore }),
  upskillClicked: () => trackEvent('upskill_clicked'),
  infoSessionClicked: () => trackEvent('info_session_clicked'),
  tailorClicked: () => trackEvent('tailor_clicked'),

  // Payment events
  paymentStarted: (amount: number, cvId: string) => 
    trackEvent('payment_started', { amount, cv_id: cvId }),
  paymentSuccess: (amount: number, cvId: string, paymentId: string) => 
    trackEvent('payment_success', { amount, cv_id: cvId, payment_id: paymentId }),
  paymentFailed: (amount: number, error: string) => 
    trackEvent('payment_failed', { amount, error }),

  // Download events
  cvDownloaded: (cvId: string) => 
    trackEvent('cv_downloaded', { cv_id: cvId }),
  cvShared: (cvId: string) => 
    trackEvent('cv_shared', { cv_id: cvId }),

  // Course events
  courseViewed: (courseId: string) => 
    trackEvent('course_viewed', { course_id: courseId }),
  courseRegistered: (courseId: string) => 
    trackEvent('course_registered', { course_id: courseId }),

  // Job events
  jobViewed: (jobId: string) => 
    trackEvent('job_viewed', { job_id: jobId }),
  jobSaved: (jobId: string) => 
    trackEvent('job_saved', { job_id: jobId }),
  jobApplied: (jobId: string) => 
    trackEvent('job_applied', { job_id: jobId }),

  // User Journey Events
  onboardingCompleted: () => trackEvent('onboarding_completed'),
  firstCVCreated: () => trackEvent('first_cv_created'),
  firstPayment: (amount: number) => trackEvent('first_payment', { amount }),

  // Engagement Events
  sessionStart: () => trackEvent('session_start'),
  sessionEnd: (duration: number) => trackEvent('session_end', { duration }),

  // Feature Discovery
  featureDiscovered: (feature: string) => 
    trackEvent('feature_discovered', { feature }),

  // Assessment events
  assessmentStarted: () => trackEvent('assessment_started'),
  assessmentCompleted: (score: number) => 
    trackEvent('assessment_completed', { score }),
};
