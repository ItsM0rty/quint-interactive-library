import React from 'react';
import {
  QuintProvider,
  QuintRenderer,
  useAddBlock,
} from 'quint';
import type { Block } from 'quint';

/**
 * Roleplay example demonstrating branching narratives with local reveals.
 */
export const RoleplayExample: React.FC = () => {
  const addBlock = useAddBlock();

  React.useEffect(() => {
    const initialBlock: Block = {
      blockId: 'scene1',
      content:
        'You stand at the entrance of an ancient temple. The air is thick with mystery. What do you do?',
      choices: [
        {
          choiceId: 'merchant',
          label: 'Talk to the merchant nearby',
          directionality: 'in-n-out',
          reveal: true,
          hiddenContent:
            'The merchant eyes you suspiciously. "Few travelers come this way," he mutters, adjusting his wares.',
          inputData: {
            action: 'talk_to_merchant',
            scene: 'temple_entrance',
          },
        },
        {
          choiceId: 'inspect',
          label: 'Inspect the temple entrance',
          directionality: 'in-n-out',
          reveal: true,
          hiddenContent:
            'You notice ancient runes carved into the stone. They seem to glow faintly in the dim light.',
          inputData: {
            action: 'inspect_entrance',
            scene: 'temple_entrance',
          },
        },
        {
          choiceId: 'enter',
          label: 'Enter the temple',
          directionality: 'in',
          reveal: false,
          inputData: {
            action: 'enter_temple',
            scene: 'temple_entrance',
          },
        },
      ],
    };

    addBlock(initialBlock);
  }, [addBlock]);

  const handleChoiceActivated = async (params: {
    blockId: string;
    choiceId: string;
    directionality: string;
    inputData?: Record<string, unknown>;
    reveal: boolean;
  }) => {
    console.log('Roleplay choice:', params);

    // For 'in' or 'in-n-out', send to your LLM/story engine
    if (params.directionality === 'in' || params.directionality === 'in-n-out') {
      // Example: Continue the story based on the choice
      // const response = await yourStoryEngine.continue(params.inputData);
      // If reveal is false, the response would appear in your main chat area
    }
  };

  return (
    <QuintProvider onChoiceActivated={handleChoiceActivated}>
      <div style={{ maxWidth: '700px', margin: '2rem auto', padding: '1rem' }}>
        <h1>Roleplay Example</h1>
        <QuintRenderer />
      </div>
    </QuintProvider>
  );
};

