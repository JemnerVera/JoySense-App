import React from 'react';
import { Message } from '../../types/systemParameters';

interface MessageDisplayProps {
  message: Message | null;
}

export function MessageDisplay({ message }: MessageDisplayProps) {
  if (!message) return null;

  const getMessageStyles = () => {
    switch (message.type) {
      case 'success':
        return 'bg-blue-600 bg-opacity-20 border border-blue-500';
      case 'warning':
        return 'bg-yellow-600 bg-opacity-20 border border-yellow-500';
      case 'info':
        return 'bg-blue-600 bg-opacity-20 border border-blue-500';
      case 'error':
        return 'bg-red-600 bg-opacity-20 border border-red-500';
      default:
        return 'bg-gray-600 bg-opacity-20 border border-gray-500';
    }
  };

  const getMessageIcon = () => {
    switch (message.type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={`p-4 rounded-lg mb-6 ${getMessageStyles()}`}>
      <div className="flex items-center gap-3">
        {getMessageIcon()}
        <p className={`font-medium ${
          message.type === 'success' ? 'text-blue-300' :
          message.type === 'warning' ? 'text-yellow-300' :
          message.type === 'error' ? 'text-red-300' :
          'text-blue-300'
        }`}>
          {message.text}
        </p>
      </div>
    </div>
  );
}
