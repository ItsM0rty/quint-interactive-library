import React from 'react';
import {
  QuintProvider,
  QuintRenderer,
  useAddBlock,
  useUpdateRevealContent,
} from 'quint';
import type { Block } from 'quint';

/**
 * Tutoring system example with inline explanations.
 */
export const TutoringExample: React.FC = () => {
  const addBlock = useAddBlock();
  const updateRevealContent = useUpdateRevealContent();

  React.useEffect(() => {
    const mathProblem: Block = {
      blockId: 'math1',
      content: 'Solve: 2x + 5 = 13',
      choices: [
        {
          choiceId: 'step1',
          label: 'Show first step',
          directionality: 'out',
          reveal: true,
          hiddenContent: 'First, subtract 5 from both sides: 2x = 13 - 5 = 8',
        },
        {
          choiceId: 'step2',
          label: 'Show second step',
          directionality: 'out',
          reveal: true,
          hiddenContent: 'Then, divide both sides by 2: x = 8 / 2 = 4',
        },
        {
          choiceId: 'hint',
          label: 'Get a hint',
          directionality: 'in-n-out',
          reveal: true,
          inputData: {
            type: 'hint_request',
            problemId: 'math1',
          },
        },
        {
          choiceId: 'check',
          label: 'Check my answer',
          directionality: 'in',
          reveal: false,
          inputData: {
            type: 'answer_check',
            problemId: 'math1',
          },
        },
      ],
    };

    addBlock(mathProblem);
  }, [addBlock]);

  const handleChoiceActivated = async (params: {
    blockId: string;
    choiceId: string;
    directionality: string;
    inputData?: Record<string, unknown>;
    reveal: boolean;
  }) => {
    console.log('Tutoring choice:', params);

    // Example: For hint requests, generate personalized hints
    if (
      params.inputData?.type === 'hint_request' &&
      params.directionality === 'in-n-out'
    ) {
      // Simulate LLM call for personalized hint
      setTimeout(() => {
        const personalizedHint =
          'Try isolating the variable by performing inverse operations. What operation is being applied to x?';
        updateRevealContent(`${params.blockId}:${params.choiceId}`, personalizedHint);
      }, 500);
    }

    // For answer checks, send to LLM and show in main chat
    if (params.inputData?.type === 'answer_check') {
      // This would typically send to your LLM and show response in main chat
      console.log('Checking answer via LLM...');
    }
  };

  return (
    <QuintProvider onChoiceActivated={handleChoiceActivated}>
      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem' }}>
        <h1>Tutoring System Example</h1>
        <QuintRenderer />
      </div>
    </QuintProvider>
  );
};

