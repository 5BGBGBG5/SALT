import React, { useState } from 'react';
import '../PromptAccordion.css'; // Import from parent directory

type Prompt = {
  prompt_text: string;
  model_responses: { [key: string]: string };
};

const PromptAccordion = ({ prompt }: { prompt: Prompt }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Filter for valid, successful AI responses to display
  const validResponses = Object.entries(prompt.model_responses).filter(
    ([model, response]) =>
      response &&
      response !== 'No response' &&
      !response.toLowerCase().includes('bad request') &&
      !response.toLowerCase().includes('could not be found')
  );

  return (
    <div className="accordion-item">
      <button className="accordion-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="prompt-text">{prompt.prompt_text}</span>
        <span className="accordion-icon">{isOpen ? '−' : '+'}</span>
      </button>

      {isOpen && (
        <div className="accordion-content">
          {validResponses.length > 0 ? (
            validResponses.map(([model, response]) => (
              <div key={model} className="response-block">
                <h4>{model.charAt(0).toUpperCase() + model.slice(1)}'s Response:</h4>
                <p>{response}</p>
              </div>
            ))
          ) : (
            <div className="response-block">
              <p>No valid AI responses were recorded for this prompt.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PromptAccordion;
