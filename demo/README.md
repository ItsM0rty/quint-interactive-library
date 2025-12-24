# Quint Demos

This directory contains provider-specific demos showing how to integrate Quint with different AI providers.

**Important:** These demos are **not part of the npm package**. They are provided in the GitHub repository for reference and learning purposes only. Each demo requires API keys and is completely optional.

## Available Demos

- **[Claude Demo](./claude/)** - Integration with Anthropic's Claude API
- **[ChatGPT Demo](./chatgpt/)** - Integration with OpenAI's GPT-4o
- **[Gemini Demo](./gemini/)** - Integration with Google's Gemini API
- **[DeepSeek Demo](./deepseek/)** - Integration with DeepSeek API

## Quick Start

Each demo is self-contained with its own setup instructions. Navigate to the provider folder you want to try:

```bash
cd claude  # or chatgpt, gemini, deepseek
npm install
```

Then follow the README in that directory for provider-specific setup instructions.

## Why Separate Demos?

Each AI provider has different:
- API endpoints and authentication
- Message format requirements
- Streaming capabilities
- Model identifiers

Separate demos make it easier to:
- Understand provider-specific integration patterns
- Troubleshoot issues without cross-provider complexity
- Add new providers without affecting existing ones
- Maintain clean, focused codebases
