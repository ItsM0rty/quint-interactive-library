import React from 'react';
import type { Block } from '../types';
import { ChoiceButton } from './ChoiceButton';
import { RevealContainer } from './RevealContainer';
import { useQuintContext } from './context';

interface BlockRendererProps {
  block: Block;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ block }) => {
  const { state } = useQuintContext();
  
  // Get all reveals for this block
  const items = state.getItems();
  const revealsForBlock = items
    .filter((item) => item.type === 'reveal' && item.data.blockId === block.blockId)
    .map((item) => item.type === 'reveal' ? item.data : null)
    .filter((reveal): reveal is NonNullable<typeof reveal> => reveal !== null);

  return (
    <div className="quint-block" data-block-id={block.blockId}>
      {block.content && (
        <div className="quint-block-content">{block.content}</div>
      )}
      {block.choices.length > 0 && (
        <div className="quint-choices">
          {block.choices.map((choice) => {
            // Find reveal for this specific choice
            const reveal = revealsForBlock.find(
              (r) => r.choiceId === choice.choiceId
            );
            
            return (
              <React.Fragment key={choice.choiceId}>
                <ChoiceButton
                  choice={choice}
                  blockId={block.blockId}
                />
                {reveal && (
                  <RevealContainer reveal={reveal} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};

