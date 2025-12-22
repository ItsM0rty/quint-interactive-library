# Quick Setup Guide

## 1. Get Your OpenRouter API Key

1. Go to https://openrouter.ai/
2. Sign up or log in
3. Navigate to Keys section
4. Create a new API key and copy it

## 2. Create .env File

In the `demo` directory, create a `.env` file:

```
OPENROUTER_API_KEY=your_api_key_here
```

## 3. Start the Server

In one terminal:
```bash
cd demo
npm run dev:server
```

You should see:
```
🚀 Server running on http://localhost:3000
📝 Make sure GOOGLE_GENERATIVE_AI_API_KEY is set in .env file
```

## 4. Start the Frontend

In another terminal:
```bash
cd demo
npm run dev
```

Open http://localhost:5173 in your browser!

## What You'll See

- Clean chat interface
- Word-by-word streaming responses from NVIDIA Nemotron
- Real-time AI conversations
- Smooth, natural text streaming

## Troubleshooting

- **"OPENROUTER_API_KEY not set"**: Make sure your `.env` file exists and has the key
- **CORS errors**: Make sure the server is running on port 3000
- **Connection refused**: Start the server first with `npm run dev:server`
- **Rate limits**: OpenRouter free tier has usage limits, check your dashboard

