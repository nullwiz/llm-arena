import React from 'react';

interface StaticPageProps {
  title: string;
  children: React.ReactNode;
}

export function StaticPage({ title, children }: StaticPageProps) {
  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="card crt-surface crt-noise scanlines terminal-border">
        <h1 className="text-2xl font-bold text-gray-100 mb-4">{title}</h1>
        <div className="text-gray-300 leading-relaxed space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}

