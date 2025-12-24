import type {
  Block,
  BlockId,
  ChoiceId,
  Reveal,
  RevealId,
  RenderItem,
} from '../types';

/**
 * Manages the linear, index-based rendering state for Quint.
 */
export class QuintState {
  private items: RenderItem[] = [];
  private reveals: Map<RevealId, Reveal> = new Map();

  /**
   * Adds a block to the rendering state.
   */
  addBlock(block: Block): void {
    // Add the block itself
    this.items.push({ type: 'block', data: block });

    // Add all choices from the block
    for (const choice of block.choices) {
      this.items.push({ type: 'choice', data: choice, blockId: block.blockId });
    }
  }

  /**
   * Activates a choice and handles reveal creation/update.
   */
  activateChoice(
    blockId: BlockId,
    choiceId: ChoiceId,
    choice: { directionality: string; reveal: boolean; hiddenContent?: string }
  ): RevealId | null {
    // Find the index of the choice button
    const choiceIndex = this.items.findIndex(
      (item) =>
        item.type === 'choice' &&
        item.blockId === blockId &&
        item.data.choiceId === choiceId
    );

    if (choiceIndex === -1) {
      return null;
    }

    // Runtime validation warnings for invalid combinations
    if (choice.directionality === 'out' && !choice.hiddenContent && choice.reveal) {
      console.warn(
        `[Quint] Warning: Choice "${choiceId}" in block "${blockId}" has directionality "out" with reveal:true but no hiddenContent. ` +
        `This will show an empty reveal. For "out" directionality, provide hiddenContent.`
      );
    }

    // If reveal is enabled, create or update the reveal (stored in Map, not in items array)
    // Reveals are only rendered inline with buttons, not as standalone items
    if (choice.reveal) {
      const revealId = `${blockId}:${choiceId}`;

      const reveal: Reveal = {
        revealId,
        blockId,
        choiceId,
        expanded: true,
        staticContent: choice.hiddenContent,
        createdAt: Date.now(),
      };

      this.reveals.set(revealId, reveal);
      return revealId;
    }

    return null;
  }

  /**
   * Updates the generated content for a reveal.
   */
  updateRevealContent(
    revealId: RevealId,
    generatedContent: string
  ): void {
    const reveal = this.reveals.get(revealId);
    if (!reveal) return;

    reveal.generatedContent = generatedContent;
    // Reveals are stored in Map, not in items array
  }

  /**
   * Toggles the expanded state of a reveal.
   */
  toggleReveal(revealId: RevealId): void {
    const reveal = this.reveals.get(revealId);
    if (!reveal) return;

    reveal.expanded = !reveal.expanded;
    // Reveals are stored in Map, not in items array
  }

  /**
   * Adds nested blocks to a reveal.
   */
  addNestedBlocks(revealId: RevealId, blocks: Block[]): void {
    const reveal = this.reveals.get(revealId);
    if (!reveal) return;

    reveal.nestedBlocks = blocks;
    // Reveals are stored in Map, not in items array
  }

  /**
   * Gets the current render items array (immutable copy).
   */
  getItems(): ReadonlyArray<RenderItem> {
    return [...this.items];
  }

  /**
   * Gets a reveal by ID.
   */
  getReveal(revealId: RevealId): Reveal | undefined {
    return this.reveals.get(revealId);
  }

  /**
   * Clears all state.
   */
  clear(): void {
    this.items = [];
    this.reveals.clear();
  }
}

