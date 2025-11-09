import * as React from 'react';

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return <table className={`min-w-full border border-gray-300 ${className || ''}`}>{children}</table>;
}

export function TableHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <thead className={`bg-gray-100 ${className || ''}`}>{children}</thead>;
}

export function TableHead({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-2 text-sm font-medium text-gray-900 ${className || ''}`}>{children}</th>;
}

export function TableBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tbody className={className}>{children}</tbody>;
}

export function TableRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={`border-b border-gray-200 ${className || ''}`}>{children}</tr>;
}

export function TableCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2 text-sm text-gray-700 ${className || ''}`}>{children}</td>;
}
