import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import {
  QuintProvider,
  useAddBlock,
  useUpdateRevealContent,
  useQuintItems,
  BlockRenderer,
  ChoiceButton,
  RevealContainer,
} from '../../../src/react';
import type { Block } from '../../../src/types';

const QUINT_START = '⟪QUINT⟫';
const QUINT_END = '⟫QUINT⟫';

function ChatContent({ sendMessageRef }: { sendMessageRef: React.MutableRefObject<((message: { role: string; content: string }) => void) | null> }) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const addBlock = useAddBlock();
  const updateRevealContent = useUpdateRevealContent();
  const quintItems = useQuintItems();
  const processedMessageIds = useRef<Set<string>>(new Set());
  const [parsedBlockMessageIds, setParsedBlockMessageIds] = useState<Set<string>>(new Set());
  const [messageBlockMap, setMessageBlockMap] = useState<Record<string, string>>({});

  const { messages, sendMessage, status, error } = useChat({
    api: '/api/chat',
    experimental_throttle: 50,
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage, sendMessageRef]);

  const isLoading = status === 'in_progress';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, quintItems]);

  // Parse AI responses for Quint blocks
  useEffect(() => {
    messages.forEach((message) => {
      if (message.role === 'assistant') {
        const isLastMessage = message.id === messages[messages.length - 1]?.id;
        const isStreaming = isLoading && isLastMessage;
        if (isStreaming) {
          return;
        }

        let content = '';
        if (typeof message.content === 'string') {
          content = message.content;
        } else if (message.parts && Array.isArray(message.parts)) {
          content = message.parts
            .map((part: any) => {
              if (typeof part === 'string') return part;
              if (part.type === 'text' && part.text) return part.text;
              if (part.content) return part.content;
              if (part.text) return part.text;
              return '';
            })
            .join('');
        }

        if (!content.trim()) {
          return;
        }

        const alreadyParsed = parsedBlockMessageIds.has(message.id);
        if (alreadyParsed) {
          return;
        }

        const startIndex = content.indexOf(QUINT_START);
        const endIndex = content.lastIndexOf(QUINT_END);
        if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
          return;
        }

        const contentBetween = content.substring(startIndex + QUINT_START.length, endIndex).trim();

        const extractJsonFromContent = (text: string): string | null => {
          if (!text) return null;
          const trimmed = text.trim();
          if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null;
          return trimmed;
        };

        const jsonStrAfterMarker = extractJsonFromContent(contentBetween);
        
        if (jsonStrAfterMarker) {
          try {
            const cleanedJson = jsonStrAfterMarker.trim();
            const block: Block = JSON.parse(cleanedJson);
            
            if (block.blockId && Array.isArray(block.choices)) {
              const existing = quintItems.find((b: Block) => b.blockId === block.blockId);
              if (!existing) {
                addBlock(block);
                setParsedBlockMessageIds(prev => new Set(prev).add(message.id));
                setMessageBlockMap((prev) => ({ ...prev, [message.id]: block.blockId }));
              }
            }
          } catch (e: any) {
            console.error('JSON parse error:', e.message);
          }
        }

        processedMessageIds.current.add(message.id);
      }
    });
  }, [messages, addBlock, isLoading, parsedBlockMessageIds, quintItems]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    
    sendMessage({ role: 'user', content: message });
  };

  const renderBlockForMessage = (blockId: string) => {
    const blockItem = quintItems.find((item: any) => 
      item.type === 'block' && item.data.blockId === blockId
    );

    if (!blockItem || blockItem.type !== 'block') return null;

    return (
      <div className="quint-container" style={{ width: '100%' }}>
        <BlockRenderer block={blockItem.data} />
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
        margin: '0 auto',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        background: '#0b0d0f',
        boxShadow: 'none',
        borderRadius: 0,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #1f2430',
          background: '#0b0d0f',
        }}
      >
        <h1 style={{ margin: 0, color: '#dfe7f5', fontSize: '1.25rem', fontWeight: '600' }}>
          Quint Demo - Claude
        </h1>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          background: '#0b0d0f',
        }}
      >
        {messages.length === 0 && quintItems.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: '#9aa5b5',
              marginTop: '3rem',
              fontSize: '0.9375rem',
            }}
          >
            Start a conversation by typing a message below.
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '1rem',
              background: '#fee2e2',
              color: '#991b1b',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            Error: {error.message}
          </div>
        )}

        {messages.map((message) => {
          const blockIdForMessage = messageBlockMap[message.id];

          let displayContent = '';
          if (typeof message.content === 'string') {
            displayContent = message.content;
          } else if (message.parts && Array.isArray(message.parts)) {
            displayContent = message.parts
              .map((part: any) => {
                if (typeof part === 'string') return part;
                if (part.type === 'text' && part.text) return part.text;
                if (part.content) return part.content;
                return '';
              })
              .join('');
          }

          let textBeforeQuint = '';
          let textAfterQuint = '';
          
          if (displayContent.includes(QUINT_START) && displayContent.includes(QUINT_END)) {
            const start = displayContent.indexOf(QUINT_START);
            const end = displayContent.indexOf(QUINT_END, start + QUINT_START.length);
            if (start !== -1 && end !== -1) {
              textBeforeQuint = displayContent.substring(0, start).trimEnd();
              textAfterQuint = displayContent.substring(end + QUINT_END.length).trimStart();
              displayContent = textBeforeQuint + (textAfterQuint ? '\n' + textAfterQuint : '');
            }
          }

          const isEmptyAssistant = message.role === 'assistant' && !displayContent.trim();
          const isStreaming = isEmptyAssistant && isLoading;

          return (
            <div
              key={message.id}
              style={{
                marginBottom: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '75%',
                  padding: '0.875rem 1rem',
                  background: message.role === 'user' ? '#1a7f64' : '#1c242f',
                  color: '#e8ecf2',
                  borderRadius: message.role === 'user' ? '1rem 1rem 0.45rem 1rem' : '1rem 1rem 1rem 0.45rem',
                  border: message.role === 'user' ? '1px solid #1f9b79' : '1px solid #2b3340',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: '1.5',
                  minHeight: isStreaming ? '2.5rem' : 'auto',
                  display: isStreaming ? 'flex' : 'block',
                  alignItems: isStreaming ? 'center' : undefined,
                }}
              >
                {isStreaming ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9aa5b5' }}>
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #2f3542',
                        borderTop: '2px solid #10a37f',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    <span style={{ fontSize: '0.875rem' }}>Thinking...</span>
                  </div>
                ) : (
                  <>
                    {textBeforeQuint && (
                      <div style={{ marginBottom: blockIdForMessage ? '1rem' : '0' }}>
                        {textBeforeQuint}
                      </div>
                    )}
                    {blockIdForMessage && renderBlockForMessage(blockIdForMessage)}
                    {textAfterQuint && (
                      <div style={{ marginTop: blockIdForMessage ? '1rem' : '0' }}>
                        {textAfterQuint}
                      </div>
                    )}
                    {!blockIdForMessage && displayContent && displayContent}
                  </>
                )}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <form
        onSubmit={handleSubmit}
        style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #1f2430',
          background: '#0b0d0f',
          display: 'flex',
          gap: '0.75rem',
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
            padding: '0.75rem 1rem',
            border: '1px solid #2f3542',
            borderRadius: '0.75rem',
            fontSize: '0.9375rem',
            outline: 'none',
            transition: 'border-color 0.2s, background 0.2s',
            background: '#161b22',
            color: '#e5e7eb',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#10a37f';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#2f3542';
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            padding: '0.75rem 1.5rem',
            background: isLoading || !input.trim() ? '#2f3542' : '#10a37f',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.75rem',
            fontSize: '0.9375rem',
            fontWeight: '500',
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export function SimpleChatApp() {
  const sendMessageRef = useRef<((message: { role: string; content: string }) => void) | null>(null);

  const handleChoiceActivated = async (params: {
    blockId: string;
    choiceId: string;
    directionality: string;
    inputData?: Record<string, unknown>;
    reveal: boolean;
  }) => {
    if (params.directionality === 'in' || params.directionality === 'in-n-out') {
      let messageContent = '';

      if (params.inputData?.type === 'continue') {
        messageContent = `Continue our conversation. Previous context: ${params.inputData.context}`;
      } else if (params.inputData?.type === 'explain') {
        messageContent = `Explain more about: ${params.inputData.context}`;
      } else {
        messageContent = `User selected: ${params.choiceId} from block ${params.blockId}`;
        if (params.inputData) {
          messageContent += `\nData: ${JSON.stringify(params.inputData)}`;
        }
      }

      if (sendMessageRef.current) {
        sendMessageRef.current({ role: 'user', content: messageContent });
      }
    }
  };

  return (
    <QuintProvider onChoiceActivated={handleChoiceActivated}>
      <ChatContent sendMessageRef={sendMessageRef} />
    </QuintProvider>
  );
}

