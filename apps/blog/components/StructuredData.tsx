/**
 * Renders a JSON-LD <script> tag for structured data.
 * Usage: <StructuredData data={jsonLdObject} />
 */
export function StructuredData({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
