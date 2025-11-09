import React from 'react';

const Reading = ({ title, text }) => {
  return (
    <div className="reading-container">
      <h2>{title}</h2>
      {/* 
        This is the fix. 
        We replace <p>{text}</p> with this structure to make React 
        render the <b> tags as actual bold text.
      */}
      <p
        style={{ whiteSpace: 'pre-wrap' }}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    </div>
  );
};

export default Reading;