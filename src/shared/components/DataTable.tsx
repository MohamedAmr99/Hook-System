import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal, 
  ChevronDown, 
  Search,
  Check
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  bulkActions?: (selectedRows: TData[]) => React.ReactNode;
  filterElements?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "ابحث...",
  bulkActions,
  filterElements,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [showVisibilityMenu, setShowVisibilityMenu] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close visibility dropdown on outside clicks
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowVisibilityMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getRowId: (row: any, index: number) => row.id || row._id || row.sku || index.toString(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border/55 shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-3">
          {searchKey && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder={searchPlaceholder}
                value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn(searchKey)?.setFilterValue(event.target.value)
                }
                className="pl-9 bg-background/50 border-border/80 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/50"
              />
            </div>
          )}
          {filterElements && (
            <div className="flex flex-wrap items-center gap-2">
              {filterElements}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Columns Visibility Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 border-border/80 bg-background/40 hover:bg-muted"
              onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
            >
              <SlidersHorizontal size={14} />
              <span>الأعمدة</span>
              <ChevronDown size={14} className="opacity-60" />
            </Button>

            {showVisibilityMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-lg z-50 animate-in fade-in-50 slide-in-from-top-1 duration-100">
                <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border/50 mb-1">
                  إظهار الأعمدة
                </p>
                <div className="max-h-56 overflow-y-auto space-y-0.5">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      const label = typeof column.columnDef.header === "string" 
                        ? column.columnDef.header 
                        : column.id;
                      return (
                        <button
                          key={column.id}
                          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm hover:bg-muted text-left transition-colors font-medium text-foreground/80 hover:text-foreground"
                          onClick={() => column.toggleVisibility(!column.getIsVisible())}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded border border-border flex items-center justify-center transition-all",
                            column.getIsVisible() ? "bg-primary border-primary text-primary-foreground" : "bg-transparent"
                          )}>
                            {column.getIsVisible() && <Check size={12} strokeWidth={3} />}
                          </div>
                          <span className="capitalize">{label}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions Banner */}
      {selectedRows.length > 0 && bulkActions && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 p-3 rounded-lg animate-in fade-in duration-200">
          <span className="text-sm font-medium text-primary-foreground/90">
            تم تحديد {selectedRows.length} صف(وف)
          </span>
          <div className="flex items-center gap-2">
            {bulkActions(selectedRows)}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/40 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground font-medium"
                >
                  لم يتم العثور على نتائج.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-1">
        <div className="text-xs text-muted-foreground font-medium order-2 sm:order-1">
          عرض {table.getRowModel().rows.length} من {data.length} صف(وف)
        </div>
        <div className="flex items-center gap-6 order-1 sm:order-2">
          {/* Page size select */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">الصفوف في الصفحة:</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="h-8 rounded-md border border-border/80 bg-background text-xs font-semibold px-2 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/50 cursor-pointer"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-border/80 bg-background hover:bg-muted"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="text-xs font-semibold text-foreground/80 px-2">
              صفحة {table.getState().pagination.pageIndex + 1} من{" "}
              {table.getPageCount() || 1}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-border/80 bg-background hover:bg-muted"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
