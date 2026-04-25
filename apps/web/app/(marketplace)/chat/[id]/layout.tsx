import type { ReactNode } from 'react';

export default function ChatDetailLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col overflow-hidden h-[calc(100dvh-8.5rem)] md:h-[100dvh]">
      {children}
    </div>
  );
}
