# Quint Chat Demo

A demo application showing Quint integrated with Gemini AI for interactive chat experiences.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your Gemini API key:**
   - Create a `.env` file in the `demo` directory
   - Add your Gemini API key:
     ```
     GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
     ```
   - Get your API key from: https://makersuite.google.com/app/apikey

3. **Start the server:**
   ```bash
   npm run dev:server
   ```
   This starts the Express server on port 3000 that handles the Gemini API calls.

4. **Start the Vite dev server (in a new terminal):**
   ```bash
   npm run dev
   ```
   This starts the frontend on port 5173.

5. **Open your browser:**
   Navigate to `http://localhost:5173`

## Features

- **Interactive Choices**: Click buttons to interact with the AI
- **Streaming Responses**: Real-time streaming from Gemini
- **Inline Reveals**: Explanations and responses appear inline below choices
- **Chat Interface**: Traditional chat input for free-form questions

## How It Works

- Quint blocks appear with clickable choices
- Choices with `in` or `in-n-out` directionality send requests to Gemini
- Responses stream in real-time
- Reveals can show static content or LLM-generated explanations

