import { Container } from "../../../components/ui/Container";
import { Skeleton } from "../../../components/ui/Skeleton";

export default function Loading() {
  return (
    <Container>
      <article className="py-12">
        <Skeleton className="mb-4 h-10 w-3/4" />
        <Skeleton className="mb-8 h-4 w-40" />
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </article>
    </Container>
  );
}
