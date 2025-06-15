
import { cn } from '@/lib/utils';

interface OnlineStatusDotProps {
  status: 'online' | 'recent';
  className?: string;
}

export function OnlineStatusDot({ status, className }: OnlineStatusDotProps) {
  return (
    <div
      className={cn(
        "absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white",
        status === 'online' ? "bg-green-500" : "bg-yellow-500",
        className
      )}
    />
  );
}
