import * as React from 'react';

export function Tabs({ children }: { children: React.ReactNode }) {
  return <div className='border-b border-gray-200 mb-4'>{children}</div>;
}

export function TabsList({ children }: { children: React.ReactNode }) {
  return <div className='flex space-x-4'>{children}</div>;
}

export function TabsTrigger({ children }: { children: React.ReactNode }) {
  return <button className='px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg'>{children}</button>;
}

export function TabsContent({ children }: { children: React.ReactNode }) {
  return <div className='mt-4'>{children}</div>;
}
