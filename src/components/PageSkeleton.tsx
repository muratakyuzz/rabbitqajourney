import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Empty page skeleton used across the template. Replace the body with
 * real content as you build each page out.
 */
export function PageSkeleton({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle ?? `${title} placeholder`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="shadow-none">
            <CardContent className="p-5 space-y-3">
              <div className="h-3 w-24 rounded-full bg-muted" />
              <div className="h-8 w-16 rounded-md bg-muted" />
              <div className="h-3 w-32 rounded-full bg-muted/60" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-none border-dashed">
        <CardContent className="p-10 flex flex-col items-center justify-center text-center gap-2">
          <p className="text-base font-medium text-foreground">{title} coming soon</p>
          <p className="text-sm text-muted-foreground max-w-md">
            This is an empty page scaffold from the template. Build your {title.toLowerCase()} view here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
