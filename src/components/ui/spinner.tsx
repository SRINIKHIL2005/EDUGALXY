import React from 'react';

const Spinner: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`animate-spin rounded-full border-4 border-t-transparent ${className}`} />
  );
};

export default Spinner;