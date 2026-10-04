import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  hideCancel?: boolean;
  isDanger?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  hideCancel = false,
  isDanger = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />
      
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-in zoom-in-95 duration-200 border border-slate-200/80">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs ${
              isDanger 
                ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                : 'bg-blue-50 text-blue-600 border border-blue-100'
            }`}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirmation</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
          
          <div className="flex justify-end gap-3 mt-7">
            {!hideCancel && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
              >
                {cancelText}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-6 py-2.5 font-bold text-xs rounded-2xl transition-all active:scale-98 cursor-pointer ${
                isDanger 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs' 
                  : 'btn-gradient'
              }`}
            >
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
