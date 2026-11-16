import { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

interface SlideToDeleteProps {
  onDelete: () => void;
  label?: string;
}

/**
 * Touch and mouse friendly slide-left control. Releasing after the threshold
 * calls onDelete; callers keep their existing confirmation dialog.
 */
const SlideToDelete = ({ onDelete, label = 'Slide left to delete' }: SlideToDeleteProps) => {
  const startX = useRef<number | null>(null);
  const [distance, setDistance] = useState(0);
  const [dragging, setDragging] = useState(false);
  const threshold = 68;

  const finish = () => {
    const shouldDelete = distance >= threshold;
    startX.current = null;
    setDragging(false);
    setDistance(0);
    if (shouldDelete) onDelete();
  };

  return (
    <div className="relative h-8 w-[126px] overflow-hidden rounded-lg bg-rose-50 select-none" title={label}>
      <div className="absolute inset-y-0 right-0 flex w-[126px] items-center justify-end gap-1.5 pr-2 text-[10px] font-bold text-rose-700">
        <span>{label}</span>
        <Trash2 size={14} />
      </div>
      <button
        type="button"
        aria-label={label}
        className="absolute inset-y-0 left-0 z-10 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 transition-transform cursor-grab active:cursor-grabbing"
        style={{ transform: `translateX(-${distance}px)`, transition: dragging ? 'none' : 'transform 160ms ease-out' }}
        onPointerDown={(event) => {
          startX.current = event.clientX;
          setDragging(true);
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (startX.current === null) return;
          setDistance(Math.max(0, Math.min(126, startX.current - event.clientX)));
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
      >
        <Trash2 size={15} />
        <span className="text-[10px] font-semibold">Delete</span>
      </button>
    </div>
  );
};

export default SlideToDelete;
