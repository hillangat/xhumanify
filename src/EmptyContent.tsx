import React from 'react';
import './EmptyContent.scss';

interface EmptyContentProps {
  icon: React.ReactElement;
  title: string;
  subtitle: string;
}

const EmptyContent: React.FC<EmptyContentProps> = ({ icon, title, subtitle }) => {
  return (
    <div className="empty-content">
      <div className="empty-content__icon">{icon}</div>
      <div className="empty-content__title">{title}</div>
      <div className="empty-content__subtitle">{subtitle}</div>
    </div>
  );
};

export default EmptyContent;
