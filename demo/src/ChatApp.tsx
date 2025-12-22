import React, { useState, useRef, useEffect } from 'react';
import {
  QuintProvider,
  QuintRenderer,
  useAddBlock,
  useUpdateRevealContent,
} from 'quint';
import type { Block } from 'quint';
import { useChat } from '@ai-sdk/react';

// Component that uses hooks (must be inside QuintProvider)
function ChatContent({
  updateRevealContentRef,
  messages,
  append,
  isLoading,
}: {
  updateRevealContentRef: React.MutableRefObject<
    ((revealId: string, content: string) => void) | null
  >;
  messages: any[];
  append: (message: any) => void;
  isLoading: boolean;
}) {
  const addBlock = useAddBlock();
  const updateRevealContent = useUpdateRevealContent();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');

  // Store updateRevealContent in the ref
  useEffect(() => {
    updateRevealContentRef.current = updateRevealContent;
  }, [updateRevealContent, updateRevealContentRef]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  });

  // Add initial welcome block with choices
  useEffect(() => {
    const welcomeBlock: Block = {
      blockId: 'welcome',
      content: 'Welcome! I can help you with various tasks. What would you like to do?',
      choices: [
        {
          choiceId: 'quiz',
          label: '📚 Take a Quiz',
          directionality: 'in-n-out',
          reveal: true,
          inputData: {
            type: 'action',
            action: 'start_quiz',
          },
        },
        {
          choiceId: 'story',
          label: '📖 Interactive Story',
          directionality: 'in-n-out',
          reveal: true,
          inputData: {
            type: 'action',
            action: 'start_story',
          },
        },
        {
          choiceId: 'help',
          label: '💡 Get Help',
          directionality: 'in',
          reveal: false,
          inputData: {
            type: 'action',
            action: 'get_help',
          },
        },
      ],
    };
    addBlock(welcomeBlock);
  }, [addBlock]);

  // Watch for new assistant messages and create blocks from them
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && lastMessage.content) {
      // Check if we already created a block for this message
      const messageId = `msg-${lastMessage.id}`;
      const existingBlock = document.querySelector(`[data-message-id="${messageId}"]`);
      
      if (!existingBlock && lastMessage.content.trim()) {
        // Create a block from the assistant's response
        const responseBlock: Block = {
          blockId: messageId,
          content: lastMessage.content,
          choices: [
            {
              choiceId: 'continue',
              label: 'Continue conversation',
              directionality: 'in',
              reveal: false,
              inputData: {
                type: 'continue',
                context: lastMessage.content,
              },
            },
            {
              choiceId: 'explain',
              label: 'Explain more',
              directionality: 'in-n-out',
              reveal: true,
              inputData: {
                type: 'explain',
                context: lastMessage.content,
              },
            },
          ],
        };
        addBlock(responseBlock);
      }
    }
  }, [messages, addBlock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    await append({
      role: 'user',
      content: input,
    });
    setInput('');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxWidth: '900px',
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: '#ffffff',
      }}
    >
      <div
        style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          background: '#ffffff',
        }}
      >
        <h1 style={{ margin: 0, color: '#111827', fontSize: '1.5rem' }}>
          Quint Chat Demo
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
          Interactive AI chat with choice-based interactions powered by Gemini
        </p>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          background: '#f9fafb',
        }}
      >
        {/* Show regular chat messages */}
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              marginBottom: '1rem',
              padding: '1rem',
              background: message.role === 'user' ? '#dbeafe' : '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
          >
            <div
              style={{
                fontWeight: '600',
                marginBottom: '0.5rem',
                color: message.role === 'user' ? '#1e40af' : '#111827',
              }}
            >
              {message.role === 'user' ? 'You' : 'Assistant'}
            </div>
            <div style={{ color: '#374151', whiteSpace: 'pre-wrap' }}>
              {message.content}
            </div>
          </div>
        ))}

        {/* Show Quint blocks */}
        <QuintRenderer />
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '1rem',
          borderTop: '1px solid #e5e7eb',
          background: '#ffffff',
          display: 'flex',
          gap: '0.5rem',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '1rem',
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            padding: '0.75rem 1.5rem',
            background: isLoading ? '#9ca3af' : '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export function ChatApp() {
  const updateRevealContentRef = useRef<
    ((revealId: string, content: string) => void) | null
  >(null);

  const { messages, append, isLoading } = useChat({
    api: 'http://localhost:3000/api/chat',
  });

  const handleChoiceActivated = async (params: {
    blockId: string;
    choiceId: string;
    directionality: string;
    inputData?: Record<string, unknown>;
    reveal: boolean;
  }) => {
    console.log('Choice activated:', params);

    // For 'in' or 'in-n-out' directionality, send to LLM
    if (params.directionality === 'in' || params.directionality === 'in-n-out') {
      let messageContent = '';

      // Build message based on inputData
      if (params.inputData?.type === 'action') {
        switch (params.inputData.action) {
          case 'start_quiz':
            messageContent = 'Start a quiz about world capitals. Ask me a question.';
            break;
          case 'start_story':
            messageContent = 'Start an interactive story. Give me a scenario and choices.';
            break;
          case 'get_help':
            messageContent = 'I need help understanding how to use this chat interface.';
            break;
          case 'continue':
            messageContent = `Continue our conversation. Previous context: ${params.inputData.context}`;
            break;
          case 'explain':
            messageContent = `Explain more about: ${params.inputData.context}`;
            break;
          default:
            messageContent = JSON.stringify(params.inputData);
        }
      } else {
        messageContent = `User selected: ${params.choiceId} from block ${params.blockId}`;
      }

      // Send to chat API
      await append({
        role: 'user',
        content: messageContent,
      });

      // If reveal is true and it's in-n-out, update reveal with streaming response
      if (params.reveal && params.directionality === 'in-n-out') {
        // Wait for the response and update the reveal
        // This will be handled by watching messages
      }
    }

    // For 'out' directionality, nothing is sent to LLM (handled by static content)
  };

  // Update reveals when new assistant messages arrive
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && lastMessage.content) {
      // Find any pending reveals that need content
      // This is a simplified approach - in production you'd track which reveals are waiting
      if (updateRevealContentRef.current) {
        // You could implement logic here to match messages to specific reveals
      }
    }
  }, [messages]);

  return (
    <QuintProvider onChoiceActivated={handleChoiceActivated}>
      <ChatContent
        updateRevealContentRef={updateRevealContentRef}
        messages={messages}
        append={append}
        isLoading={isLoading}
      />
    </QuintProvider>
  );
}
