import React, {
  createContext,
  useContext,
  useCallback,
  useReducer,
} from 'react';
import type {
  BlockId,
  ChoiceId,
  Directionality,
  OnChoiceActivated,
  OnRevealToggle,
  RevealId,
} from '../types';
import { QuintState } from '../core/state';

interface QuintContextValue {
  state: QuintState;
  onChoiceActivated: (
    blockId: BlockId,
    choiceId: ChoiceId,
    directionality: Directionality,
    inputData: Record<string, unknown> | undefined,
    reveal: boolean
  ) => Promise<void>;
  onRevealToggle: (revealId: RevealId) => void;
  updateRevealContent: (revealId: RevealId, content: string) => void;
}

const QuintContext = createContext<QuintContextValue | null>(null);

export const useQuintContext = () => {
  const context = useContext(QuintContext);
  if (!context) {
    throw new Error('useQuintContext must be used within QuintProvider');
  }
  return context;
};

interface QuintProviderProps {
  children: React.ReactNode;
  onChoiceActivated?: OnChoiceActivated;
  onRevealToggle?: OnRevealToggle;
}

export const QuintProvider: React.FC<QuintProviderProps> = ({
  children,
  onChoiceActivated,
  onRevealToggle,
}) => {
  const [state] = React.useState(() => new QuintState());
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const updateRevealContent = useCallback(
    (revealId: RevealId, content: string) => {
      state.updateRevealContent(revealId, content);
      forceUpdate();
    },
    [state]
  );

  const handleChoiceActivated = useCallback(
    async (
      blockId: BlockId,
      choiceId: ChoiceId,
      directionality: string,
      inputData: Record<string, unknown> | undefined,
      reveal: boolean
    ) => {
      // Update state first
      const choice = state
        .getItems()
        .find(
          (item) =>
            item.type === 'choice' &&
            item.blockId === blockId &&
            item.data.choiceId === choiceId
        );

      if (choice && choice.type === 'choice') {
        state.activateChoice(blockId, choiceId, {
          directionality: choice.data.directionality,
          reveal: choice.data.reveal,
          hiddenContent: choice.data.hiddenContent,
        });
        forceUpdate();
      }

      // Then call the callback
      if (onChoiceActivated) {
        await onChoiceActivated({
          blockId,
          choiceId,
          directionality: directionality as Directionality,
          inputData,
          reveal,
        });
      }
    },
    [state, onChoiceActivated]
  );

  const handleRevealToggle = useCallback(
    (revealId: RevealId) => {
      state.toggleReveal(revealId);
      const reveal = state.getReveal(revealId);
      forceUpdate();

      if (onRevealToggle && reveal) {
        onRevealToggle({
          revealId,
          expanded: reveal.expanded,
        });
      }
    },
    [state, onRevealToggle]
  );

  const value: QuintContextValue = {
    state,
    onChoiceActivated: handleChoiceActivated,
    onRevealToggle: handleRevealToggle,
    updateRevealContent,
  };

  return (
    <QuintContext.Provider value={value}>{children}</QuintContext.Provider>
  );
};

