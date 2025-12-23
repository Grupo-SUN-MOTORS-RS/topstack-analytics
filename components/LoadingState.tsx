import React from 'react';
import { FileSpreadsheet } from 'lucide-react';

interface LoadingStateProps {
  isLoading?: boolean;
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  isLoading = true, 
  message = 'Carregando dados...' 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-darkCard rounded-xl border border-gray-200 dark:border-gray-700 min-h-[400px]">
      {isLoading ? (
        <>
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
            <div className="relative flex items-center justify-center">
              <FileSpreadsheet className="h-8 w-8 text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium text-lg mb-2">{message}</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">Aguarde enquanto processamos os dados...</p>
        </>
      ) : (
        <>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
            <FileSpreadsheet className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">{message}</p>
        </>
      )}
    </div>
  );
};

export default LoadingState;

