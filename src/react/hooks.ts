import React, { useCallback } from 'react';
import { useQuintContext } from './context';
import type { Block, RevealId } from '../types';

/**
 * Hook to add a block to the Quint system.
 */
export const useAddBlock = () => {
  const { state } = useQuintContext();
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  return useCallback(
    (block: Block) => {
      state.addBlock(block);
      forceUpdate();
    },
    [state]
  );
};

/**
 * Hook to update reveal content with LLM-generated text.
 */
export const useUpdateRevealContent = () => {
  const { updateRevealContent } = useQuintContext();
  return updateRevealContent;
};

/**
 * Hook to get all current render items.
 */
export const useQuintItems = () => {
  const { state } = useQuintContext();
  return state.getItems();
};

