import type { ReactNode } from "react";

interface SkeletonCardProps {
  className?: string;
}

const SkeletonCard = ({ className }: SkeletonCardProps) => (
  <div className={`rounded-2xl bg-muted/60 shimmer ${className ?? ""}`.trim()} />
);

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 rounded-lg bg-muted/60 shimmer" />
      <div className="grid gap-4 md:grid-cols-3">
        <SkeletonCard className="h-28" />
        <SkeletonCard className="h-28" />
        <SkeletonCard className="h-28" />
      </div>
      <SkeletonCard className="h-72" />
    </div>
  );
};

export const InstancesSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="h-7 w-40 rounded-lg bg-muted/60 shimmer" />
        <div className="h-10 w-32 rounded-xl bg-muted/60 shimmer" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-48" />
      </div>
    </div>
  );
};

export const GenericPageSkeleton = ({
  header = true,
  children,
}: {
  header?: boolean;
  children?: ReactNode;
}) => {
  return (
    <div className="space-y-6">
      {header ? <div className="h-8 w-56 rounded-lg bg-muted/60 shimmer" /> : null}
      {children ?? <SkeletonCard className="h-64" />}
    </div>
  );
};
