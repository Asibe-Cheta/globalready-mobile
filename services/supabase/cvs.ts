import { supabase } from '@/lib/supabase';
import { CVData } from '@/types/cv';

export const cvService = {
  saveCVData: async (cvData: CVData) => {
    const user = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('cvs')
      .insert({
        user_id: user.data.user?.id,
        type: 'built',
        cv_data: cvData,
        payment_status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getUserCVs: async () => {
    const { data, error } = await supabase.from('cvs').select('*').order('created_at', {
      ascending: false,
    });

    if (error) throw error;
    return data;
  },

  uploadCVFile: async (file: { name: string; data: Blob }, userId: string) => {
    const fileName = `${userId}/${Date.now()}_${file.name}`;

    const { data, error } = await supabase.storage.from('uploaded-cvs').upload(fileName, file.data);

    if (error) throw error;
    return data;
  },

  saveUploadedCV: async (rawText: string, filePath: string, fileName: string) => {
    const user = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('cvs')
      .insert({
        user_id: user.data.user?.id,
        type: 'uploaded',
        cv_data: { raw_text: rawText, file_path: filePath, file_name: fileName },
        payment_status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getDownloadURL: async (path: string) => {
    const { data, error } = await supabase.storage.from('cv-pdfs').createSignedUrl(path, 3600);

    if (error) throw error;
    return data.signedUrl;
  },
};
