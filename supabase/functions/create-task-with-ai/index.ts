// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import OpenAI from "npm:openai";
import { SUPABASE_PUBLISHABLE_KEY } from "../_shared/supabaseKeys.ts";
import {
  chooseLabel,
  existingLabelList,
  MAX_LABEL_LENGTH,
} from "../_shared/labelRules.ts";

// Load environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

// The OpenAI model that suggests the labels.
const OPENAI_MODEL = "gpt-4o-mini";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { title, description } = await req.json();

    console.log("🔄 Creating task with AI suggestions...");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Initialize Supabase client
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get user session
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("No user found");

    // Create the task
    const { data, error } = await supabaseClient
      .from("tasks")
      .insert({
        title,
        description,
        completed: false,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    // The existing labels: the default ones plus every label the user has
    // already used. Row Level Security limits this to the user's own tasks.
    const { data: labelRows, error: labelsError } = await supabaseClient
      .from("tasks")
      .select("label")
      .eq("user_id", user.id)
      .not("label", "is", null);

    // If that fails, carry on with just the default labels.
    if (labelsError) console.error("Error reading labels:", labelsError.message);
    const existingLabels = existingLabelList(
      (labelRows ?? []).map((row: { label: string | null }) => row.label)
    );

    // Get label suggestion from OpenAI
    const prompt = `You choose a label for a task in a to-do list app.

Task title: "${title}"
Task description: "${description ?? ""}"

Existing labels: ${existingLabels.join(", ")}

Rules:
1. If one of the existing labels fits the task, reply with that label, spelled exactly as in the list.
2. Only if none of the existing labels fits, reply with ONE new label: lowercase, one or two words, at most ${MAX_LABEL_LENGTH} characters, using only letters, digits, spaces and hyphens.
3. A new label must not repeat or mimic an existing label: no plurals, prefixes, suffixes, rewordings or synonyms of one. For example, if "home" is an existing label, do not reply "homes", "my-home" or "home stuff": reply "home". If "priority" is an existing label, do not reply "urgent".

Reply with just the label and nothing else.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: OPENAI_MODEL,
      temperature: 0.3,
      max_tokens: 16,
    });

    const suggestedLabel = completion.choices[0].message.content;

    console.log(`✨ AI Suggested Label: ${suggestedLabel}`);

    // Check the label: use the existing label if the AI repeated or rephrased
    // one, and no label (null) if the reply is not a valid label.
    const label = chooseLabel(suggestedLabel, existingLabels);
    console.log(`🏷️ Label saved: ${label}`);

    // Update the task with the suggested label
    const { data: updatedTask, error: updateError } = await supabaseClient
      .from("tasks")
      .update({ label })
      .eq("task_id", data.task_id)
      .select()
      .single();

    if (updateError) throw updateError;

    return new Response(JSON.stringify(updatedTask), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    // Errors from Supabase are not always Error objects, but have a message.
    const message = (error as { message?: string })?.message ?? String(error);
    console.error("Error in create-task-with-ai:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
