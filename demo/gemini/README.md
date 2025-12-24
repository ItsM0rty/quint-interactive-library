# Quint Demo - Gemini

A demo application showing Quint integrated with Google's Gemini API.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your Google API key:**
   - Create a `.env` file in this directory
   - Add your Google API key:
     ```
     GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
     ```
   - Get your API key from: https://makersuite.google.com/app/apikey

3. **Start the server:**
   ```bash
   npm run dev:server
   ```
   This starts the Express server on port 3000.

4. **Start the Vite dev server (in a new terminal):**
   ```bash
   npm run dev
   ```
   This starts the frontend on port 5173.

5. **Open your browser:**
   Navigate to `http://localhost:5173`

## Model

- **Gemini 2.0 Flash** (`gemini-2.0-flash-exp`)

