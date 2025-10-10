import React, { useState } from 'react';
import { FaChevronRight } from 'react-icons/fa';
import './ExpandableDescription.scss';

interface ExpandableDescriptionProps {
  title: string;
  description: string;
  defaultExpanded?: boolean;
}

const ExpandableDescription: React.FC<ExpandableDescriptionProps> = ({
  title,
  description,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="expandable-description">
      <div className="expandable-header" onClick={toggleExpanded}>
        <h4 className="expandable-title">{title}</h4>
        <div className={`expandable-icon ${isExpanded ? 'expanded' : ''}`}>
          <FaChevronRight />
        </div>
      </div>
      
      {isExpanded && (
        <div className="expandable-content">
          <p>{description}</p>
        </div>
      )}
    </div>
  );
};

export default ExpandableDescription;