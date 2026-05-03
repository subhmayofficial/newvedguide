import { EngagingRouteProgress } from "@/components/ui/engaging-route-progress";

export default function AstrologersSegmentLoading() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 py-16">
      <EngagingRouteProgress className="w-full max-w-md" ariaLabel="Loading page" />
    </div>
  );
}
