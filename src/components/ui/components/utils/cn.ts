import { extendTailwindMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';
import { typographyClassNames } from '../typography';

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': Object.keys(typographyClassNames).map((key) => key.replace('.', ''))
    }
  }
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default cn;
