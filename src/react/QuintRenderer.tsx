import React from 'react';
import { useQuintContext } from './context';
import { BlockRenderer } from './BlockRenderer';
import { RevealContainer } from './RevealContainer';
import { ChoiceButton } from './ChoiceButton';

export const QuintRenderer: React.FC = () => {
  const { state } = useQuintContext();
  const items = state.getItems();

  return (
    <div className="quint-container">
      {items.map((item, index) => {
        const key = `${item.type}-${index}-${
          item.type === 'block'
            ? item.data.blockId
            : item.type === 'choice'
            ? `${item.blockId}-${item.data.choiceId}`
            : item.data.revealId
        }`;

        switch (item.type) {
          case 'block':
            return <BlockRenderer key={key} block={item.data} />;
          case 'choice':
            return (
              <ChoiceButton
                key={key}
                choice={item.data}
                blockId={item.blockId}
              />
            );
          case 'reveal':
            return <RevealContainer key={key} reveal={item.data} />;
          default:
            return null;
        }
      })}
    </div>
  );
};

