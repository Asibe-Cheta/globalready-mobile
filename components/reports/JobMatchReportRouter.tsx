import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { NotFitYetReport } from './NotFitYetReport';
import { GoodFitReport } from './GoodFitReport';

interface AnalysisResult {
  match_score: number;
  matched_skills: string[];
  missing_skills?: Array<{
    skill: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
  }>;
  nice_to_have_skills?: string[];
  overall_assessment?: string;
  recommended_courses?: Array<{
    course_id: string;
    title: string;
    duration_hours: number;
    rating: number;
  }>;
}

/**
 * Job Match Report Router
 * 
 * CRITICAL BUSINESS RULE:
 * - <60% match = No tailoring offer, show upskilling path
 * - ≥60% match = Offer $5 CV tailoring
 */
export const JobMatchReportRouter: React.FC = () => {
  const params = useLocalSearchParams();
  const router = useRouter();

  // Parse analysis result from params
  // In production, this would come from the AI analysis
  const analysisResult: AnalysisResult = params.analysisResult 
    ? JSON.parse(params.analysisResult as string)
    : {
        match_score: parseInt(params.matchScore as string) || 0,
        matched_skills: params.matchedSkills 
          ? (params.matchedSkills as string).split(',')
          : [],
        missing_skills: params.missingSkills
          ? JSON.parse(params.missingSkills as string)
          : [],
        nice_to_have_skills: params.niceToHaveSkills
          ? (params.niceToHaveSkills as string).split(',')
          : [],
        overall_assessment: params.overallAssessment as string,
        recommended_courses: params.recommendedCourses
          ? JSON.parse(params.recommendedCourses as string)
          : [],
      };

  const cvId = params.cvId as string;
  const jobDescription = params.jobDescription as string;
  const matchScore = analysisResult.match_score;

  // Route based on match score threshold
  if (matchScore < 60) {
    return (
      <NotFitYetReport 
        analysisResult={analysisResult}
        navigation={router}
      />
    );
  } else {
    return (
      <GoodFitReport 
        analysisResult={analysisResult}
        cvId={cvId}
        jobDescription={jobDescription}
        navigation={router}
      />
    );
  }
};
