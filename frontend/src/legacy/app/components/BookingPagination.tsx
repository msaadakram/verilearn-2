import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from './ui/button';

type BookingPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function BookingPagination({ currentPage, totalPages, onPageChange }: BookingPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="gap-1.5"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </Button>

      {Array.from({ length: totalPages }, (_, index) => {
        const page = index + 1;
        const isActive = page === currentPage;

        return (
          <Button
            key={page}
            type="button"
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(page)}
            className="min-w-10"
            style={
              isActive
                ? { background: 'linear-gradient(135deg,#7ab8ba,#5a9fa1)', borderColor: 'transparent' }
                : undefined
            }
          >
            {page}
          </Button>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="gap-1.5"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}