import React from 'react';
import {
  QuintProvider,
  QuintRenderer,
  useAddBlock,
  useUpdateRevealContent,
} from '@itsm0rty/quint';
import type { Block } from '@itsm0rty/quint';

/**
 * Basic MCQ example demonstrating non-spoiler multiple choice questions.
 */
export const BasicMCQExample: React.FC = () => {
  const addBlock = useAddBlock();
  const updateRevealContent = useUpdateRevealContent();

  React.useEffect(() => {
    // Add a sample question block
    const questionBlock: Block = {
      blockId: 'q1',
      content: 'What is the capital of France?',
      choices: [
        {
          choiceId: 'a',
          label: 'A) London',
          directionality: 'out',
          reveal: true,
          hiddenContent: 'Incorrect. London is the capital of England.',
        },
        {
          choiceId: 'b',
          label: 'B) Berlin',
          directionality: 'out',
          reveal: true,
          hiddenContent: 'Incorrect. Berlin is the capital of Germany.',
        },
        {
          choiceId: 'c',
          label: 'C) Paris',
          directionality: 'out',
          reveal: true,
          hiddenContent: 'Correct! Paris is the capital of France.',
        },
        {
          choiceId: 'd',
          label: 'D) Madrid',
          directionality: 'out',
          reveal: true,
          hiddenContent: 'Incorrect. Madrid is the capital of Spain.',
        },
      ],
    };

    addBlock(questionBlock);
  }, [addBlock]);

  const handleChoiceActivated = async (params: {
    blockId: string;
    choiceId: string;
    directionality: string;
    inputData?: Record<string, unknown>;
    reveal: boolean;
  }) => {
    console.log('Choice activated:', params);

    // If it's an 'in' or 'in-n-out' directionality, you would send data to your LLM here
    if (params.directionality === 'in' || params.directionality === 'in-n-out') {
      // Example: Send to your LLM API
      // const response = await fetch('/api/llm', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     type: 'answer_chosen',
      //     questionId: params.blockId,
      //     choiceId: params.choiceId,
      //     ...params.inputData,
      //   }),
      // });
      // const result = await response.json();
      // if (params.reveal) {
      //   updateRevealContent(`${params.blockId}:${params.choiceId}`, result.explanation);
      // }
    }
  };

  return (
    <QuintProvider onChoiceActivated={handleChoiceActivated}>
      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
        <h1>Basic MCQ Example</h1>
        <QuintRenderer />
      </div>
    </QuintProvider>
  );
};

