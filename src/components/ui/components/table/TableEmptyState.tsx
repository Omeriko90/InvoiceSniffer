import React, { type ReactElement } from "react";
import { SearchX } from "lucide-react";
import { TableEmptyState as EmptyState } from "../empty-states/TableEmptyState";
import {
  BaseTableBody,
  BaseTableCell,
  BaseTableRow,
} from "./TableBaseComponents";
import { cn } from "../utils";

export interface TableEmptyStateProps {
  columnCount: number;
}

export function TableEmptyState({
  columnCount,
}: TableEmptyStateProps): ReactElement {
  return (
    <BaseTableBody>
      <BaseTableRow>
        <BaseTableCell colSpan={columnCount} className={cn("w-full p-0")}>
          <EmptyState>
            <SearchX size={36} />
            No results
          </EmptyState>
        </BaseTableCell>
      </BaseTableRow>
    </BaseTableBody>
  );
}
