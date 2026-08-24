import { useState } from 'react';

export default function Topbar({ title = 'Dashboard', actions = null }) {
  const [notifications] = useState(3); // Mock notifications

  return (
    <header className="h-[var(--topbar-height)] sticky top-0 z-30 flex items-center justify-between px-8 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30">
      <h1 className="font-headline-lg text-headline-md text-on-surface">{title}</h1>
      
      <div className="flex items-center gap-4">
        {actions}
        
        <div className="flex items-center gap-2 border-l border-outline-variant/30 pl-4 ml-2">
          <button className="relative w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant/50 transition-colors">
            <span className="material-symbols-outlined">notifications</span>
            {notifications > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-error border-2 border-surface"></span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
