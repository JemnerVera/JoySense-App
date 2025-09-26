
interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = "Cargando datos..." }: LoadingSpinnerProps) {
  return (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      <p className="text-gray-400 mt-2">{message}</p>
    </div>
  );
}
