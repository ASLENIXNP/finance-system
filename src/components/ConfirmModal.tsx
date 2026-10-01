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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div className={`flex items-center gap-3 ${isDanger ? 'text-red-600' : 'text-accent'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDanger ? 'bg-red-50' : 'bg-accent/10'}`}>
              <AlertTriangle size={20} />
            </div>
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-slate-600">{message}</p>
          
          <div className="flex justify-end gap-3 mt-8">
            {!hideCancel && (
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 font-medium rounded-xl transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-5 py-2.5 text-white font-medium rounded-xl transition-colors shadow-sm ${
                isDanger 
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' 
                  : 'bg-accent hover:bg-accent-hover shadow-accent/20'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
