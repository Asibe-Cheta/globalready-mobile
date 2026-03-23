import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

Deno.serve(async (req) => {
  try {
    const { filePath, base64Data } = await req.json();

    if (!filePath && !base64Data) {
      return new Response(
        JSON.stringify({ error: 'Missing filePath or base64Data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let base64: string;

    if (base64Data) {
      // Use base64 sent directly from the client
      base64 = base64Data;
    } else {
      // Download file from Supabase storage using service role key
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const { data: fileData, error: downloadError } = await supabase.storage
        .from('uploaded-cvs')
        .download(filePath);

      if (downloadError || !fileData) {
        return new Response(
          JSON.stringify({ error: `Failed to download file: ${downloadError?.message || 'File not found'}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Convert file to base64
      const arrayBuffer = await fileData.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      base64 = btoa(binary);
    }

    if (!base64 || base64.length === 0) {
      return new Response(
        JSON.stringify({ error: 'PDF content is empty' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use Claude to extract text from PDF
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
    });

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64,
            },
          },
          {
            type: 'text',
            text: `Extract ALL text content from this CV/resume document. Preserve the structure and formatting as much as possible using plain text. Include all sections: personal details, summary, work experience, education, skills, certifications, languages, etc. Return ONLY the extracted text content, nothing else.`,
          },
        ],
      }],
    });

    const extractedText = message.content[0].text;

    return new Response(
      JSON.stringify({ text: extractedText }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('CV parsing error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to parse CV' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
