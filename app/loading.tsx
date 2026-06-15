import { Container } from "../components/ui/Container";
import { BlogCardSkeleton, Skeleton } from "../components/ui/Skeleton";

export default function Loading() {
  return (
    <Container>
      <div className="py-16">
        <Skeleton className="mx-auto mb-8 h-10 w-64" />
        <div className="grid gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <BlogCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </Container>
  );
}
