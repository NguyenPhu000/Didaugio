import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * CATEGORY CARD SKELETON
 * Loading skeleton cho category cards
 */
export default function CategoryCardSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      {/* Color bar skeleton */}
      <Skeleton className="absolute top-0 left-0 right-0 h-1.5" />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          {/* Icon skeleton */}
          <Skeleton className="w-14 h-14 rounded-xl" />

          {/* Menu skeleton */}
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>

        {/* Name & Description skeleton */}
        <div className="mt-4 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Badges skeleton */}
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4">
        <div className="border-t pt-3">
          <Skeleton className="h-9 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * CATEGORY CARD LIST SKELETON
 * Grid of loading skeletons
 */
export function CategoryCardListSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <CategoryCardSkeleton key={index} />
      ))}
    </div>
  );
}
