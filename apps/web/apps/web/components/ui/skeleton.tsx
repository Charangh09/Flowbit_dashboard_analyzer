import * as React from 'react';

export function Skeleton({ width = '100%', height = '1rem', className }: { width?: string; height?: string; className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-300 rounded-md ${className || ''}`}
      style={{ width, height }}
    />
  );
}
