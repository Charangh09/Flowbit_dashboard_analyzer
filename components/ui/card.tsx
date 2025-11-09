import * as React from 'react';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 bg-white shadow-md rounded-xl ${className || ''}`}>{children}</div>;
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`font-bold text-lg mb-2 ${className || ''}`}>{children}</div>;
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-xl font-semibold mb-2 ${className || ''}`}>{children}</h2>;
}
