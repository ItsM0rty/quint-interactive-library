import React from 'react';
import type { Reveal } from '../types';
import { useQuintContext } from './context';
import { BlockRenderer } from './BlockRenderer';

interface RevealContainerProps {
  reveal: Reveal;
}

export const RevealContainer: React.FC<RevealContainerProps> = ({ reveal }) => {
  const { onRevealToggle } = useQuintContext();

  const handleToggle = () => {
    // onRevealToggle from context is handleRevealToggle which takes just revealId
    if (onRevealToggle) {
      onRevealToggle(reveal.revealId);
    }
  };

  const content = reveal.generatedContent || reveal.staticContent || '';

  return (
    <div className="quint-reveal-container">
      <button
        type="button"
        onClick={handleToggle}
        className="quint-reveal-toggle"
        aria-expanded={reveal.expanded}
      >
        <span className="quint-reveal-indicator">
          {reveal.expanded ? '⌄' : '>'}
        </span>
        <span className="quint-reveal-label">
          {reveal.expanded ? 'Hide' : 'Show'} explanation
        </span>
      </button>
      {reveal.expanded && (
        <div className="quint-reveal-content">
          {content && (
            <div className="quint-reveal-text">{content}</div>
          )}
          {reveal.nestedBlocks &&
            reveal.nestedBlocks.map((block) => (
              <BlockRenderer key={block.blockId} block={block} />
            ))}
        </div>
      )}
    </div>
  );
};

