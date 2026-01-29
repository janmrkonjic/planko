// @ts-nocheck - Deno Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { taskId, taskTitle, taskDescription } = await req.json();

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!geminiApiKey || !supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing environment variables');
    }

    const prompt = `You are a project manager. Break down the task '${taskTitle}' ${taskDescription ? `(Description: ${taskDescription})` : ""} into 3-5 actionable subtasks. Return ONLY a raw JSON array of strings (e.g. ["Task 1", "Task 2"]). Do not use Markdown formatting or code blocks.`;

    // SPREMEMBA: Uporabljamo "gemini-flash-latest", ki je v tvojem seznamu pod št. 15
    // Ta je zagotovo v Free Tier-u.
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error('Gemini API Error:', data.error);
      // Če dobimo 429 (Resource Exhausted), povejmo uporabniku, da počaka
      if (data.error.code === 429) {
        throw new Error('AI is busy (Rate Limit). Please try again in a minute.');
      }
      throw new Error(`Gemini API Error: ${data.error.message}`);
    }

    let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    generatedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();

    let subtaskTitles: string[] = [];
    try {
      subtaskTitles = JSON.parse(generatedText);
    } catch (e) {
      console.error('Failed to parse JSON:', generatedText);
      throw new Error('AI did not return valid JSON');
    }

    if (!Array.isArray(subtaskTitles)) throw new Error('AI response was not an array');

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const rowsToInsert = subtaskTitles.map((title) => ({
      task_id: taskId,
      title: title,
      is_completed: false,
    }));

    const { error: insertError } = await supabase
      .from('subtasks')
      .insert(rowsToInsert);

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, count: rowsToInsert.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});