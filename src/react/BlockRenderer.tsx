import React from 'react';
import type { Block } from '../types';
import { ChoiceButton } from './ChoiceButton';

interface BlockRendererProps {
  block: Block;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ block }) => {
  return (
    <div className="quint-block" data-block-id={block.blockId}>
      {block.content && (
        <div className="quint-block-content">{block.content}</div>
      )}
      {block.choices.length > 0 && (
        <div className="quint-choices">
          {block.choices.map((choice) => (
            <ChoiceButton
              key={choice.choiceId}
              choice={choice}
              blockId={block.blockId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

