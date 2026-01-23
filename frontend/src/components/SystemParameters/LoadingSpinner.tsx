
interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'orange' | 'green' | 'red';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
};

const colorClasses = {
  blue: 'border-blue-500',
  orange: 'border-orange-500',
  green: 'border-green-500',
  red: 'border-red-500'
};

export function LoadingSpinner({
  message = "Cargando datos...",
  size = 'md',
  color = 'blue'
}: LoadingSpinnerProps) {
  return (
    <div className="text-center py-8" role="status" aria-live="polite">
      <div
        className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]} mx-auto`}
        aria-hidden="true"
      ></div>
      <p className="text-gray-400 mt-2 sr-only">{message}</p>
      <p className="text-gray-400 mt-2" aria-hidden="true">{message}</p>
    </div>
  );
}
