import React from 'react';
import './IconTextButton.scss';

interface IconTextButtonProps {
  icon: React.ReactElement;
  text: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

const IconTextButton: React.FC<IconTextButtonProps> = ({ icon, text, onClick, disabled }) => {
  return (
    <button className="icon-text-btn" onClick={onClick} type="button" disabled={disabled}>
      <span className="icon-text-btn__icon">{icon}</span>
      <span className="icon-text-btn__text">{text}</span>
    </button>
  );
};

export default IconTextButton;
