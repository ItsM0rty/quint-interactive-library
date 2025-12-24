# Quint Demo - Claude

A demo application showing Quint integrated with Claude API for interactive chat experiences.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your Anthropic API key:**
   - Create a `.env` file in this directory
   - Add your Anthropic API key:
     ```
     ANTHROPIC_API_KEY=your_api_key_here
     ```
   - Get your API key from: https://console.anthropic.com/

3. **Start the server:**
   ```bash
   npm run dev:server
   ```
   This starts the Express server on port 3000 that handles the Claude API calls.

4. **Start the Vite dev server (in a new terminal):**
   ```bash
   npm run dev
   ```
   This starts the frontend on port 5173.

5. **Open your browser:**
   Navigate to `http://localhost:5173`

## Features

- **Interactive Choices**: Click buttons to interact with Claude
- **Streaming Responses**: Real-time streaming from Claude Sonnet 4.5
- **Inline Reveals**: Explanations and responses appear inline below choices
- **Chat Interface**: Traditional chat input for free-form questions
- **Full Conversation History**: Claude maintains context across all messages

## Model

- **Claude Sonnet 4.5** (`claude-sonnet-4-5-20250929`)

