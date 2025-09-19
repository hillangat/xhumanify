import React from 'react';
import { FaGripLinesVertical } from 'react-icons/fa';

interface DividerProps {
  onDrag: (delta: number) => void;
}

export const Divider: React.FC<DividerProps> = ({ onDrag }) => {
  const dragging = React.useRef(false);
  const lastX = React.useRef(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    dragging.current = true;
    lastX.current = e.clientX;
    document.body.style.cursor = 'ew-resize';
  };

  const handleMouseUp = () => {
    dragging.current = false;
    document.body.style.cursor = '';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging.current) return;
    const delta = e.clientX - lastX.current;
    lastX.current = e.clientX;
    onDrag(delta);
  };

  React.useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="divider" onMouseDown={handleMouseDown}>
      <FaGripLinesVertical className="divider-icon" />
    </div>
  );
};
