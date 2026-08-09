import { isAfter, isBefore } from 'date-fns';
import { Row } from '@tanstack/react-table';

function _isoStrAsDate<T>(rowA: Row<T>, key: string): Date {
  return new Date(String(rowA.original[key as keyof T]));
}

export function sortByDates<T>(rowA: Row<T>, rowB: Row<T>, key: string, asc?: boolean) {
  const sortFunc = asc ? isAfter : isBefore;
  return sortFunc(_isoStrAsDate(rowA, key), _isoStrAsDate(rowB, key)) ? -1 : 1;
}

// This uses the original row value instead of the value modified by accessorFn
export function numericSortByColumnId<T>(rowA: Row<T>, rowB: Row<T>, numberKey: string): 1 | 0 | -1 {
  const numberA = rowA.original[numberKey as keyof T];
  const numberB = rowB.original[numberKey as keyof T];
  return numberA < numberB ? -1 : 1;
}

// this is a hack for cases when the property is nullable and React Table has difficulties with understanding the field's type
export function sortByStringNullsLast() {
  return 'alphanumeric' as const;
}
