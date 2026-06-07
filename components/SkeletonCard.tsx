export default function SkeletonCard() {
  return (
    <div className="group relative flex flex-col items-center">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 animate-pulse">
        {/* Glassmorphism Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      </div>
      <div className="mt-6 w-full space-y-3">
        <div className="h-3 w-3/4 bg-white/10 rounded animate-pulse" />
        <div className="h-3 w-1/4 bg-white/10 rounded animate-pulse" />
      </div>
    </div>
  );
}
