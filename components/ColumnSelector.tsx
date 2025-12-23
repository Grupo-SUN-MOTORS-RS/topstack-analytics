import React, { useState } from 'react';
import { Check, GripVertical, RotateCcw } from 'lucide-react';
import { ColumnDef } from '../types';

interface ColumnSelectorProps {
  columns: ColumnDef[];
  setColumns: (cols: ColumnDef[]) => void;
  onClose: () => void;
  onReset: () => void;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({ columns, setColumns, onClose, onReset }) => {
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const toggleColumn = (id: string) => {
    const newCols = columns.map(col => 
      col.id === id ? { ...col, visible: !col.visible } : col
    );
    setColumns(newCols);
  };

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedItemIndex(index);
    // Required for Firefox
    e.dataTransfer.effectAllowed = 'move'; 
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault(); // Necessary to allow dropping
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    // Perform the swap visually immediately
    const newCols = [...columns];
    const draggedItem = newCols[draggedItemIndex];
    newCols.splice(draggedItemIndex, 1);
    newCols.splice(index, 0, draggedItem);
    
    setColumns(newCols);
    setDraggedItemIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  return (
    <div 
      className="absolute top-12 right-0 w-72 bg-white dark:bg-darkCard rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 flex flex-col animate-in fade-in zoom-in-95 duration-200"
      // Height calculation:
      // Limits height to prevent page scroll. 
      // 100vh - 280px accounts for the header, spacing and bottom margin (~80px).
      // max-h-[500px] ensures it doesn't get too tall on huge screens.
      style={{ maxHeight: 'min(500px, calc(100vh - 250px))' }} 
    >
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Exibir Colunas (Arrastar para ordenar)
        </h4>
      </div>
      
      <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar flex-1">
        {columns.map((col, index) => {
          // Skip the fixed column (usually the first one, Name) from the toggle list
          if (col.fixed) return null;

          return (
            <div
              key={col.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                flex items-center gap-3 p-2 rounded-lg group select-none transition-colors cursor-move
                ${draggedItemIndex === index ? 'opacity-50 bg-gray-50' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
              `}
            >
              <div className="text-gray-300 group-hover:text-gray-400 dark:text-gray-600 dark:group-hover:text-gray-400">
                <GripVertical size={16} />
              </div>
              
              <div 
                className="flex-1 flex items-center gap-3 cursor-pointer"
                onClick={() => toggleColumn(col.id)}
              >
                {/* Checkbox: Just the Blue Check if active, or Empty Outline if inactive */}
                <div className="w-5 h-5 flex items-center justify-center">
                  {col.visible ? (
                    <Check className="text-primary" size={20} strokeWidth={3} />
                  ) : (
                    <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded-[4px] hover:border-gray-400 transition-colors" />
                  )}
                </div>
                
                <span className={`text-sm font-medium ${col.visible ? 'text-primary' : 'text-gray-600 dark:text-gray-400'}`}>
                  {col.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-xl shrink-0">
        <button 
          onClick={onReset}
          className="w-full py-2 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw size={12} />
          Restaurar Padrão
        </button>
      </div>
    </div>
  );
};

export default ColumnSelector;