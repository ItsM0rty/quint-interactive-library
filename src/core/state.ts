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

    // If reveal is enabled, create or update the reveal
    if (choice.reveal) {
      const revealId = `${blockId}:${choiceId}`;
      const existingRevealIndex = this.items.findIndex(
        (item) =>
          item.type === 'reveal' &&
          item.data.blockId === blockId &&
          item.data.choiceId === choiceId
      );

      const reveal: Reveal = {
        revealId,
        blockId,
        choiceId,
        expanded: true,
        staticContent: choice.hiddenContent,
        createdAt: Date.now(),
      };

      this.reveals.set(revealId, reveal);

      if (existingRevealIndex === -1) {
        // Insert reveal immediately after the choice
        this.items.splice(choiceIndex + 1, 0, {
          type: 'reveal',
          data: reveal,
        });
      } else {
        // Update existing reveal
        this.items[existingRevealIndex] = { type: 'reveal', data: reveal };
      }

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

    // Update the item in the array
    const revealIndex = this.items.findIndex(
      (item) => item.type === 'reveal' && item.data.revealId === revealId
    );

    if (revealIndex !== -1) {
      this.items[revealIndex] = { type: 'reveal', data: reveal };
    }
  }

  /**
   * Toggles the expanded state of a reveal.
   */
  toggleReveal(revealId: RevealId): void {
    const reveal = this.reveals.get(revealId);
    if (!reveal) return;

    reveal.expanded = !reveal.expanded;

    // Update the item in the array
    const revealIndex = this.items.findIndex(
      (item) => item.type === 'reveal' && item.data.revealId === revealId
    );

    if (revealIndex !== -1) {
      this.items[revealIndex] = { type: 'reveal', data: reveal };
    }
  }

  /**
   * Adds nested blocks to a reveal.
   */
  addNestedBlocks(revealId: RevealId, blocks: Block[]): void {
    const reveal = this.reveals.get(revealId);
    if (!reveal) return;

    reveal.nestedBlocks = blocks;

    // Update the item in the array
    const revealIndex = this.items.findIndex(
      (item) => item.type === 'reveal' && item.data.revealId === revealId
    );

    if (revealIndex !== -1) {
      this.items[revealIndex] = { type: 'reveal', data: reveal };
    }
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

