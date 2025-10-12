/**
 * Loading Spinner Components
 * 加载状态组件
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`spinner ${sizes[size]} ${className}`} />
  );
}

interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message = '加载中...' }: PageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}

interface CardLoadingProps {
  message?: string;
}

export function CardLoading({ message = '加载中...' }: CardLoadingProps) {
  return (
    <div className="text-center py-8">
      <LoadingSpinner className="mx-auto mb-2" />
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default LoadingSpinner;

