// Express server for the API route (ESM)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, smoothStream } from 'ai';

// Configure OpenAI API
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not set in .env file' });
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages must be an array' });
    }

    // Quint system prompt
    const QUINT_SYSTEM_PROMPT = `You are an AI assistant integrated with Quint, a choice-and-reveal system for interactive AI UIs.

DETECTION ONLY (no styling guidance): To emit a Quint block, use a single, unique delimiter pair inspired by KaTeX-style wrapping. This must be the *only* marker set you use for Quint, and it must not conflict with normal text.

- Start delimiter: ⟪QUINT⟫
- End delimiter: ⟫QUINT⟫
- Nothing goes before the start delimiter.
- Immediately after the start delimiter, place the Quint JSON (no markdown code fences, no backticks).
- Close with the end delimiter once, after the JSON.
- Do NOT stream partial JSON; send the full JSON object between the delimiters in one shot.
- Only one Quint block per assistant message.

Example:
⟪QUINT⟫
{
  "blockId": "paris-mcq-1",
  "content": "Which of the following statements about the Eiffel Tower is TRUE?",
  "choices": [
    {
      "choiceId": "a",
      "label": "A) It was originally intended to be temporary",
      "directionality": "in-n-out",
      "reveal": true,
      "hiddenContent": "Correct! The Eiffel Tower was built as a temporary exhibit for the 1889 World's Fair."
    }
  ]
}
⟫QUINT⟫

If you are not sending a Quint block, reply normally without these delimiters.

QUINT BLOCK FORMAT (content schema reminder):

\`\`\`json
{
  "blockId": "unique-block-id",
  "content": "Question or content text here",
  "choices": [
    {
      "choiceId": "option-a",
      "label": "A) Option text",
      "directionality": "in-n-out",
      "reveal": true,
      "hiddenContent": "Explanation or feedback for this choice"
    }
  ]
}
\`\`\`

DIRECTIONALITY OPTIONS:
- "out": Reveals hiddenContent only, no LLM request. Use for static feedback that doesn't require story continuation.
- "in": Sends input to LLM, response appears in chat. Use when you need the LLM to generate new content based on the choice.
- "in-n-out": Both reveals hiddenContent AND sends to LLM. Use when you want immediate feedback plus story continuation.

WHEN TO USE EACH DIRECTIONALITY:

Use "out" when:
- Multiple choice questions (MCQs) with predetermined answers
- Static explanations or feedback that don't change
- One-time reveals that don't affect the narrative flow
- Educational content where the answer is fixed
- Example: "What is 2+2?" → "out" with "Correct! 2+2=4" in hiddenContent

Use "in" or "in-n-out" when:
- Roleplay scenarios that need story continuation
- Branching narratives where choices affect the plot
- Interactive stories (like Minecraft Story Mode) where each choice leads to new scenarios
- Continuous prompts that require subsequent LLM-generated content
- Scenarios where the choice should trigger a new response from the LLM
- Example: "You're in a cave surrounded by mobs. What do you do?" → "in-n-out" so the story continues based on the choice

For roleplay/story scenarios: ALWAYS use "in-n-out" so that:
1. The immediate consequence appears in hiddenContent (e.g., "You charge forward, defeating 3 zombies but taking damage")
2. The story continues with a new LLM response (e.g., "More zombies appear from the darkness...")

REVEAL OPTIONS:
- true: Content appears inline below the button
- false: Content appears in main chat stream

EXAMPLE MCQ FORMAT (use "out" for static questions):
\`\`\`json
{
  "blockId": "paris-mcq-1",
  "content": "Which of the following statements about the Eiffel Tower is TRUE?",
  "choices": [
    {
      "choiceId": "a",
      "label": "A) It was originally intended to be temporary",
      "directionality": "out",
      "reveal": true,
      "hiddenContent": "Correct! The Eiffel Tower was built as a temporary exhibit for the 1889 World's Fair."
    }
  ]
}
\`\`\`

EXAMPLE ROLEPLAY FORMAT (use "in-n-out" for interactive stories):
\`\`\`json
{
  "blockId": "cave-scenario-1",
  "content": "You find yourself deep in a dark cave, surrounded by a horde of hostile mobs. Your resources are limited, and you must make a critical decision to survive. What will you do?",
  "choices": [
    {
      "choiceId": "fight",
      "label": "Fight your way through using a sword",
      "directionality": "in-n-out",
      "reveal": true,
      "hiddenContent": "You charge forward with your sword, managing to defeat a few zombies before more close in. It's a risky move, requiring all your skill and courage!",
      "inputData": { "action": "fight", "context": "cave scenario" }
    }
  ]
}
\`\`\`

IMPORTANT:
- Always include the delimiters on any message that contains a Quint block: wrap JSON with ⟪QUINT⟫ ... ⟫QUINT⟫
- Emit exactly ONE block per message, and place it directly after the start delimiter.
- Do NOT stream partial JSON; send the full block once ready.
- Use unique blockId values
- For MCQs and static questions: use "out" with reveal: true (explanations come from hiddenContent only, no extra LLM calls)
- For roleplay, interactive stories, branching narratives: use "in-n-out" with reveal: true (immediate feedback + story continuation)
- For continuous prompts that require subsequent inputs: use "in" or "in-n-out" so the LLM can continue the narrative
- You can also provide regular text responses without Quint blocks`;

    // OpenAI supports full conversation history
    const coreMessages = messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system')
      .map(msg => {
        let content = '';
        
        if (typeof msg.content === 'string') {
          content = msg.content;
        } else if (Array.isArray(msg.content)) {
          content = msg.content
            .map(item => {
              if (typeof item === 'string') return item;
              if (item && typeof item === 'object') {
                if (item.type === 'text' && item.text) return String(item.text);
                if (item.text) return String(item.text);
                if (item.content) return String(item.content);
              }
              return '';
            })
            .filter(Boolean)
            .join('');
        } else if (msg.parts && Array.isArray(msg.parts)) {
          content = msg.parts
            .map(part => {
              if (typeof part === 'string') return part;
              if (part && typeof part === 'object') {
                if (part.type === 'text' && part.text) return String(part.text);
                if (part.content) return String(part.content);
                if (part.text) return String(part.text);
              }
              return '';
            })
            .filter(Boolean)
            .join('');
        } else if (msg.content && typeof msg.content === 'object') {
          if (msg.content.text) {
            content = String(msg.content.text);
          } else if (msg.content.content) {
            content = String(msg.content.content);
          }
        }

        if (typeof content !== 'string') {
          content = String(content || '');
        }

        if (!content || content.trim() === '') {
          content = ' ';
        }

        return {
          role: msg.role,
          content: content
        };
      });

    // Validate and sanitize
    for (let i = 0; i < coreMessages.length; i++) {
      const msg = coreMessages[i];
      
      if (Array.isArray(msg.content)) {
        msg.content = msg.content
          .map(item => typeof item === 'string' ? item : (item?.text || item?.content || String(item || '')))
          .filter(Boolean)
          .join('') || ' ';
      } else if (typeof msg.content !== 'string') {
        msg.content = String(msg.content || ' ');
      }
      
      if (msg.content.trim() === '') {
        msg.content = ' ';
      }
    }

    const hasSystemMessage = coreMessages.some(msg => msg.role === 'system');
    const finalMessages = hasSystemMessage 
      ? coreMessages 
      : [{ role: 'system', content: QUINT_SYSTEM_PROMPT }, ...coreMessages];
    
    // Use GPT-4o (latest model)
    const result = streamText({
      model: openai('gpt-4o'),
      messages: finalMessages,
      maxTokens: 4096,
      experimental_transform: smoothStream({
        chunking: 'word',
      }),
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle client disconnection gracefully
    res.on('close', () => {
      if (!res.writableEnded) {
        // Client closed connection, stop streaming
      }
    });

    try {
      result.pipeUIMessageStreamToResponse(res);
    } catch (streamError) {
      // Handle streaming errors (e.g., client disconnected)
      if (streamError.code === 'UND_ERR_SOCKET' || streamError.message?.includes('terminated') || streamError.message?.includes('closed')) {
        // Client disconnected, ignore error
        return;
      }
      throw streamError;
    }
  } catch (error) {
    // Only send error response if client hasn't disconnected
    if (!res.headersSent && !res.destroyed) {
      console.error('Error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    } else {
      // Client disconnected, just log
      console.log('Client disconnected during request');
    }
  }
});

app.options('/api/chat', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (!process.env.OPENAI_API_KEY) {
    console.warn(`WARNING: OPENAI_API_KEY not set in .env file`);
  } else {
    console.log(`OpenAI API key loaded`);
    console.log(`Using model: GPT-4o`);
  }
});

