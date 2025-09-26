import React from 'react';
import { Message } from '../../types/systemParameters';

interface UpdateMessageDisplayProps {
  updateMessage: Message | null;
}

export function UpdateMessageDisplay({ updateMessage }: UpdateMessageDisplayProps) {
  if (!updateMessage || updateMessage.type !== 'success') return null;

  return (
    <div className={`p-4 rounded-lg mb-6 ${
      updateMessage.type === 'success' ? 'bg-blue-600 bg-opacity-20 border border-blue-500' : 
      updateMessage.type === 'warning' ? 'bg-yellow-600 bg-opacity-20 border border-yellow-500' :
      updateMessage.type === 'info' ? 'bg-blue-600 bg-opacity-20 border border-blue-500' :
      'bg-red-600 bg-opacity-20 border border-red-500'
    } text-white font-mono tracking-wider`}>
      {updateMessage.text}
    </div>
  );
}
