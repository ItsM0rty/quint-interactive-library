# Quint Demo - ChatGPT

A demo application showing Quint integrated with OpenAI's ChatGPT API.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your OpenAI API key:**
   - Create a `.env` file in this directory
   - Add your OpenAI API key:
     ```
     OPENAI_API_KEY=your_api_key_here
     ```
   - Get your API key from: https://platform.openai.com/api-keys

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

- **GPT-4o** (`gpt-4o`)

