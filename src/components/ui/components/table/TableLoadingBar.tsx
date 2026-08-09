import React from 'react';

export function TableLoadingBar() {
  return (
    <div className="absolute bottom-0 w-full h-[2px] bg-primary-strong overflow-hidden">
      <div className="h-full w-full bg-primary animate-loading-bar" />
    </div>
  );
}
