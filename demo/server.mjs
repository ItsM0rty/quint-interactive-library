// Express server for the API route (ESM)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, smoothStream } from 'ai';

// Configure OpenRouter (OpenAI-compatible)
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'HTTP-Referer': 'http://localhost:3000', // Optional: for analytics
    'X-Title': 'Quint Demo', // Optional: for analytics
  },
});

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    console.log('Received messages count:', messages.length);
    console.log('Received messages:', JSON.stringify(messages, null, 2));

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OPENROUTER_API_KEY not set in .env file' });
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages must be an array' });
    }

    // Quint system prompt - explains how to format interactive blocks
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
- "out": Reveals hiddenContent only, no LLM request
- "in": Sends input to LLM, response appears in chat
- "in-n-out": Both reveals hiddenContent AND sends to LLM

REVEAL OPTIONS:
- true: Content appears inline below the button
- false: Content appears in main chat stream

EXAMPLE MCQ FORMAT:
\`\`\`json
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
    },
    {
      "choiceId": "b",
      "label": "B) Its height is exactly 300 meters",
      "directionality": "in-n-out",
      "reveal": true,
      "hiddenContent": "Incorrect. The Eiffel Tower is 330 meters tall (including antenna)."
    }
  ]
}
\`\`\`

IMPORTANT:
- Always include the delimiters on any message that contains a Quint block: wrap JSON with ⟪QUINT⟫ ... ⟫QUINT⟫
- Emit exactly ONE block per message, and place it directly after the start delimiter.
- Do NOT stream partial JSON; send the full block once ready.
- Use unique blockId values
- For MCQs, prefer "out" with reveal: true so explanations come from hiddenContent only (no extra LLM calls on click)
- Reserve "in" / "in-n-out" for flows where the click truly needs a new LLM response (e.g. tutoring follow-ups, branching stories)
- You can also provide regular text responses without Quint blocks`;

    // Manually convert UIMessages to CoreMessages
    // NOTE: OpenRouter's /responses endpoint (used by @ai-sdk/openai) does NOT accept assistant messages in input
    // We must filter them out, but this means the model loses context of its previous responses
    // The model will still see user messages and system messages, which provides some context
    const coreMessages = messages
      .filter(msg => msg.role === 'user' || msg.role === 'system')
      .map(msg => {
        let content = '';
        
        // Extract content - handle all possible formats
        if (typeof msg.content === 'string') {
          content = msg.content;
        } else if (Array.isArray(msg.content)) {
          // Handle array content (from streaming or structured format)
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
          // Handle parts array from streaming
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
          // Handle object content - try to extract text
          if (msg.content.text) {
            content = String(msg.content.text);
          } else if (msg.content.content) {
            content = String(msg.content.content);
          }
        }

        // Ensure content is always a string
        if (typeof content !== 'string') {
          console.warn(`Warning: Content is not a string for message with role ${msg.role}, converting...`, typeof content, msg);
          content = String(content || '');
        }

        // Ensure we have valid content
        if (!content || content.trim() === '') {
          console.warn(`Warning: Empty content for message with role ${msg.role}`, msg);
          content = ' '; // Fallback to space to avoid empty content errors
        }

        return {
          role: msg.role,
          content: content
        };
      });

    console.log('Converted messages count:', coreMessages.length);
    console.log('Converted messages:', JSON.stringify(coreMessages, null, 2));
    
    // Validate and sanitize all messages - ensure content is always a string
    for (let i = 0; i < coreMessages.length; i++) {
      const msg = coreMessages[i];
      
      // Final safety check - convert to string if needed
      if (Array.isArray(msg.content)) {
        console.warn(`Message ${i} still has array content, converting...`);
        msg.content = msg.content
          .map(item => typeof item === 'string' ? item : (item?.text || item?.content || String(item || '')))
          .filter(Boolean)
          .join('') || ' ';
      } else if (typeof msg.content !== 'string') {
        console.warn(`Message ${i} content is not string (${typeof msg.content}), converting...`);
        msg.content = String(msg.content || ' ');
      }
      
      console.log(`Message ${i} - Role: ${msg.role}, Content type: ${typeof msg.content}, Length: ${msg.content.length}`);
      
      if (!msg.content || typeof msg.content !== 'string') {
        console.error(`Invalid message at index ${i} after conversion:`, msg);
        return res.status(400).json({ 
          error: `Message ${i} has invalid content type: ${typeof msg.content}`,
          message: msg
        });
      }
      
      if (msg.content.trim() === '') {
        console.warn(`Empty content at index ${i}, using space fallback`);
        msg.content = ' '; // Use space instead of failing
      }
    }

    // Add Quint system prompt if this is the first message (no system message exists)
    const hasSystemMessage = coreMessages.some(msg => msg.role === 'system');
    const finalMessages = hasSystemMessage 
      ? coreMessages 
      : [{ role: 'system', content: QUINT_SYSTEM_PROMPT }, ...coreMessages];

    // Log what we're about to send
    console.log('About to send to streamText:');
    console.log('Messages:', JSON.stringify(finalMessages, null, 2));
    
    // Use DeepSeek V3.1 Nex N1 model via OpenRouter (free tier)
    const result = streamText({
      model: openrouter('nex-agi/deepseek-v3.1-nex-n1:free'), // DeepSeek V3.1 Nex N1 (free)
      messages: finalMessages,
      maxTokens: 500,
      experimental_transform: smoothStream({
        chunking: 'word', // Stream word by word for smooth output
      }),
    });

    // Set CORS headers before piping
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Use the built-in pipe method for Express - this handles streaming properly!
    result.pipeUIMessageStreamToResponse(res);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
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
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn(`WARNING: OPENROUTER_API_KEY not set in .env file`);
  } else {
    console.log(`OpenRouter API key loaded`);
    console.log(`Using model: DeepSeek V3.1 Nex N1 (free, via OpenRouter)`);
  }
});
