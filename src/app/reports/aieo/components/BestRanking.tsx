import React from 'react';
import '../BestRanking.css'; // Fixed path to go up one level

const BestRanking = ({ ranking }: { ranking: number | null }) => {
  // Function to determine the color-coded CSS class
  const getRankingClass = () => {
    if (ranking === null) return 'rank-na'; // Style for when it's not ranked
    if (ranking <= 3) return 'rank-good'; // Ranks 1-3
    if (ranking <= 7) return 'rank-medium'; // Ranks 4-7
    return 'rank-poor'; // Ranks 8 or higher
  };

  const rankingClass = getRankingClass();
  // Display the ranking with a '#' or 'N/A' if not ranked
  const displayText = ranking !== null ? `#${ranking}` : 'N/A';

  return (
    <div className="kpi-card">
      <h3>Best Ranking This Week</h3>
      <p className={`rank-value ${rankingClass}`}>{displayText}</p>
      <p className="kpi-description">
        Highest position in a &ldquo;Top 10&rdquo; list from any AI model.
      </p>
    </div>
  );
};

export default BestRanking;
