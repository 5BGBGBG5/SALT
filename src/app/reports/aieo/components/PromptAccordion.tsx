import React, { useState } from 'react';
import '../PromptAccordion.css'; // Import from parent directory

type Prompt = {
  id: string | number;
  prompt_text: string;
  model_responses: { [key: string]: string };
};

const PromptAccordion = ({ prompt }: { prompt: Prompt }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Filter for valid, successful AI responses to display
  const validResponses = Object.entries(prompt.model_responses).filter(
    ([_model, response]) =>
      response &&
      response !== 'No response' &&
      !response.toLowerCase().includes('bad request') &&
      !response.toLowerCase().includes('could not be found')
  );

  // Function to format the response text for better readability
  const formatResponse = (text: string) => {
    // Split by common delimiters and format
    const formattedText = text
      .split(/(?<=\.)\s+(?=[A-Z])|(?<=\n)\s*|\s+(?=\n)/) // Split on sentence boundaries and newlines
      .filter(line => line.trim().length > 0) // Remove empty lines
      .map((line, index) => (
        <React.Fragment key={index}>
          {line.trim()}
          {index < text.split(/(?<=\.)\s+(?=[A-Z])|(?<=\n)\s*|\s+(?=\n)/).filter(line => line.trim().length > 0).length - 1 && <br />}
        </React.Fragment>
      ));
    
    return formattedText;
  };

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
                {/* Corrected: Used &apos; for the apostrophe */}
                <h4>{model.charAt(0).toUpperCase() + model.slice(1)}&apos;s Response:</h4>
                <div className="response-text">
                  {formatResponse(response)}
                </div>
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