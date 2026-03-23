import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { File as ExpoFile } from 'expo-file-system';
import { useCallback, useState } from 'react';

import { supabase } from '@/lib/supabase';

interface UploadState {
  uploading: boolean;
  fileName: string | null;
  error: string | null;
  uploadedCvId: string | null;
}

export function useCVUpload() {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    fileName: null,
    error: null,
    uploadedCvId: null,
  });

  const pickDocument = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];
      const fileName = file.name || 'cv.pdf';

      setState((prev) => ({ ...prev, uploading: true, fileName, error: null }));

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState((prev) => ({ ...prev, uploading: false, error: 'Please sign in to upload your CV' }));
        return;
      }

      // Read file as base64 using expo-file-system File class (SDK 54 API)
      const expoFile = new ExpoFile(file.uri);
      const base64Content = await expoFile.base64();

      if (!base64Content || base64Content.length === 0) {
        throw new Error('Could not read the PDF file. Please try again.');
      }

      const storagePath = `${user.id}/${Date.now()}_${fileName}`;

      // Save to cvs table immediately (no AI parsing — that happens later on the analysis screen)
      const { data: savedCV, error: saveError } = await supabase
        .from('cvs')
        .insert({
          user_id: user.id,
          type: 'uploaded',
          cv_data: { file_path: storagePath, file_name: fileName, parse_pending: true },
          payment_status: 'pending',
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // Cache base64 locally so analysis/tailoring screens can parse it on-demand
      await AsyncStorage.setItem('gr_pending_cv_base64', base64Content);

      setState({
        uploading: false,
        fileName,
        error: null,
        uploadedCvId: savedCV.id,
      });

      // Fire-and-forget: upload to storage in the background
      const binaryStr = atob(base64Content);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      supabase.storage
        .from('uploaded-cvs')
        .upload(storagePath, bytes, { contentType: 'application/pdf' })
        .catch((err: any) => console.warn('Background storage upload failed:', err.message));
    } catch (err: any) {
      console.error('CV upload error:', err);
      setState((prev) => ({
        ...prev,
        uploading: false,
        error: err.message || 'Failed to upload CV',
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      uploading: false,
      fileName: null,
      error: null,
      uploadedCvId: null,
    });
  }, []);

  return {
    pickDocument,
    reset,
    uploading: state.uploading,
    fileName: state.fileName,
    error: state.error,
    uploadedCvId: state.uploadedCvId,
  };
}
