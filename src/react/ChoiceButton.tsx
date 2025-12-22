import React from 'react';
import type { Choice, BlockId } from '../types';
import { useQuintContext } from './context';

interface ChoiceButtonProps {
  choice: Choice;
  blockId: BlockId;
}

export const ChoiceButton: React.FC<ChoiceButtonProps> = ({
  choice,
  blockId,
}) => {
  const { onChoiceActivated } = useQuintContext();

  const handleClick = async () => {
    if (onChoiceActivated) {
      await onChoiceActivated(
        blockId,
        choice.choiceId,
        choice.directionality,
        choice.inputData,
        choice.reveal
      );
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="quint-choice-button"
      data-directionality={choice.directionality}
      data-reveal={choice.reveal}
    >
      {choice.label}
    </button>
  );
};

