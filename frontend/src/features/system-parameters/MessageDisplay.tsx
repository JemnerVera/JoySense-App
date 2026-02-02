
interface Message {
  type: 'success' | 'warning' | 'error' | 'info';
  text: string;
}

interface MessageDisplayProps {
  message: Message | null;
}

export function MessageDisplay({ message }: MessageDisplayProps) {
  if (!message) return null;

  // Icono de advertencia amarillo para warnings
  const WarningIcon = () => (
    <svg className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );

  return (
    <div className={`p-4 rounded-lg mb-6 ${
      message.type === 'success' ? 'bg-blue-600 bg-opacity-20 border border-blue-500' : 
      message.type === 'warning' ? 'bg-yellow-600 bg-opacity-20 border border-yellow-500' :
      message.type === 'info' ? 'bg-blue-600 bg-opacity-20 border border-blue-500' :
      'bg-red-600 bg-opacity-20 border border-red-500'
    } text-white font-mono tracking-wider`}>
      {message.text.split('\n').map((line, index) => (
        <div key={index} className="flex items-start gap-2">
          {message.type === 'warning' && <WarningIcon />}
          <span>{line}</span>
        </div>
      ))}
    </div>
  );
}
