/**
 * Directionality specifies how a button interacts with the LLM, if at all.
 */
export type Directionality = 'out' | 'in' | 'in-n-out';

/**
 * Reveal routing determines where the outcome is rendered.
 */
export type RevealRouting = boolean;

/**
 * Stable identifier for a block (e.g., a question, prompt, or content block).
 */
export type BlockId = string;

/**
 * Stable identifier for a choice within a block.
 */
export type ChoiceId = string;

/**
 * Stable identifier for a reveal container.
 */
export type RevealId = string;

/**
 * Represents a choice button in the Quint system.
 *
 * **Type-level constraints (not enforced, but recommended):**
 * - `directionality: 'out'` → `hiddenContent` should be provided (no LLM call, content comes from hiddenContent)
 * - `directionality: 'in'` → `inputData` should be provided (sends to LLM, response handled by your callback)
 * - `directionality: 'in-n-out'` → both `hiddenContent` and `inputData` can be provided (reveals content AND sends to LLM)
 * - `reveal: true` → content appears inline below the button (managed by Quint)
 * - `reveal: false` → content should be handled in your main chat/stream (your callback's responsibility)
 */
export interface Choice {
  /** Unique identifier for this choice within its block */
  choiceId: ChoiceId;
  /** Display label for the button */
  label: string;
  /** Directionality: how this choice interacts with the LLM */
  directionality: Directionality;
  /**
   * Reveal routing: whether content appears inline (true) or globally (false).
   * - `true`: Content appears inline below the button (managed by Quint's RevealContainer)
   * - `false`: Content should be handled in your main chat/stream area (your onChoiceActivated callback's responsibility)
   */
  reveal: RevealRouting;
  /**
   * Pre-supplied content to reveal immediately.
   * **Required for `directionality: 'out'`** (no LLM call, this is the only content).
   * Optional for `directionality: 'in-n-out'` (shown immediately, then LLM response can update it).
   * Not used for `directionality: 'in'` (content comes from LLM response only).
   */
  hiddenContent?: string;
  /**
   * Structured data to send to LLM when choice is activated.
   * **Required for `directionality: 'in'` or `'in-n-out'`** (this is what gets sent to your callback).
   * Not used for `directionality: 'out'` (no LLM interaction).
   */
  inputData?: Record<string, unknown>;
  /** Optional metadata for styling or behavior */
  metadata?: Record<string, unknown>;
}

/**
 * Represents a content block that can contain choices.
 */
export interface Block {
  /** Unique identifier for this block */
  blockId: BlockId;
  /** Optional text content displayed before choices */
  content?: string;
  /** Array of choices available in this block */
  choices: Choice[];
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Represents a reveal container that appears inline after a choice.
 */
export interface Reveal {
  /** Unique identifier for this reveal */
  revealId: RevealId;
  /** The block ID this reveal is associated with */
  blockId: BlockId;
  /** The choice ID that triggered this reveal */
  choiceId: ChoiceId;
  /** Whether the reveal is currently expanded */
  expanded: boolean;
  /** Static content to display (pre-supplied) */
  staticContent?: string;
  /** LLM-generated content to display */
  generatedContent?: string;
  /** Optional nested blocks/choices within this reveal */
  nestedBlocks?: Block[];
  /** Timestamp when reveal was created */
  createdAt: number;
}

/**
 * Represents a single item in the linear rendering model.
 * Can be a block or a choice button.
 * Note: Reveals are stored separately and rendered inline with buttons, not as standalone items.
 */
export type RenderItem =
  | { type: 'block'; data: Block }
  | { type: 'choice'; data: Choice; blockId: BlockId };

/**
 * Callback function invoked when a choice is activated.
 */
export type OnChoiceActivated = (params: {
  blockId: BlockId;
  choiceId: ChoiceId;
  directionality: Directionality;
  inputData?: Record<string, unknown>;
  reveal: RevealRouting;
}) => void | Promise<void>;

/**
 * Callback function invoked when a reveal is toggled.
 */
export type OnRevealToggle = (params: {
  revealId: RevealId;
  expanded: boolean;
}) => void;

/**
 * Configuration for the Quint system.
 */
export interface QuintConfig {
  /** Callback when a choice is activated */
  onChoiceActivated?: OnChoiceActivated;
  /** Callback when a reveal is toggled */
  onRevealToggle?: OnRevealToggle;
  /** Custom renderers for different item types */
  renderers?: {
    block?: (block: Block) => React.ReactNode;
    choice?: (choice: Choice, blockId: BlockId) => React.ReactNode;
    reveal?: (reveal: Reveal) => React.ReactNode;
  };
}

