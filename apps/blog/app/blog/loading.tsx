import { Container } from "../../components/ui/Container";
import { BlogCardSkeleton, Skeleton } from "../../components/ui/Skeleton";

export default function Loading() {
  return (
    <Container>
      <div className="py-12">
        <Skeleton className="mb-8 h-9 w-48" />
        <div className="grid gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <BlogCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </Container>
  );
}
