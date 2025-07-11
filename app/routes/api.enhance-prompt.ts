import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { callAnthropic } from "~/utils/anthropic.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const userPrompt = formData.get("prompt") as string;

    if (!userPrompt || !userPrompt.trim()) {
      return json({ error: "Prompt is required" }, { status: 400 });
    }

    const enhancementPrompt = `You are an AI assistant that helps users create better browser automation prompts. Take the user's simple request and enhance it with specific, actionable steps that clearly describe the sequence of actions needed.

Your enhanced prompt should:
1. Break down the task into clear, sequential steps
2. Include specific actions like "navigate to", "wait for page to load", "click on", "fill in", "submit", etc.
3. Be more detailed and specific about what to do
4. Maintain the user's original intent
5. Use clear, imperative language
6. Consider common web interaction patterns

User's original prompt: "${userPrompt}"

Enhanced prompt (respond with just the enhanced version, no additional text):`;

    const enhancedPrompt = await callAnthropic([
      { role: 'user', content: enhancementPrompt }
    ]);

    return json({ 
      success: true, 
      enhanced_prompt: enhancedPrompt 
    });

  } catch (error) {
    console.error("Error enhancing prompt:", error);
    return json({ 
      error: "Failed to enhance prompt" 
    }, { status: 500 });
  }
} 