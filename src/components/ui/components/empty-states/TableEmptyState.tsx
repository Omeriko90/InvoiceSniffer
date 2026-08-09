import  { PropsWithChildren } from 'react';
import { SearchX } from 'lucide-react';

export const TableEmptyState = (props: PropsWithChildren<object>) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-lg bg-hover text-dim">
      {props.children ? (
        props.children
      ) : (
        <>
          <SearchX size={36} />

          <div>No data yet</div>
        </>
      )}
    </div>
  );
};
