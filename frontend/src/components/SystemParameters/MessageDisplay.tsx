import React from 'react';
import { Message } from '../../types/systemParameters';

interface MessageDisplayProps {
  message: Message | null;
}

export function MessageDisplay({ message }: MessageDisplayProps) {
  if (!message) return null;

  return (
    <div className={`p-4 rounded-lg mb-6 ${
      message.type === 'success' ? 'bg-blue-600 bg-opacity-20 border border-blue-500' : 
      message.type === 'warning' ? 'bg-yellow-600 bg-opacity-20 border border-yellow-500' :
      message.type === 'info' ? 'bg-blue-600 bg-opacity-20 border border-blue-500' :
      'bg-red-600 bg-opacity-20 border border-red-500'
    } text-white font-mono tracking-wider`}>
      {message.text.split('\n').map((line, index) => (
        <div key={index}>{line}</div>
      ))}
    </div>
  );
}