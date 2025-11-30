import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code2 } from "lucide-react";

interface SqlViewerProps {
  title: string;
  sql: string;
  isDevMode: boolean;
}

export function SqlViewer({ title, sql, isDevMode }: SqlViewerProps) {
  if (!isDevMode) return null;

  return (
    <Card className="col-span-1 md:col-span-2 border-muted-foreground/20 shadow-sm">
      <CardHeader className="flex flex-row items-center gap-2 p-3 pb-2 space-y-0">
        <Code2 className="h-4 w-4 text-primary/70" />
        <CardTitle className="text-sm font-medium text-foreground/80">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <ScrollArea className="h-auto max-h-[300px] w-full rounded-md border bg-muted/50">
          <div className="p-3">
            <pre className="text-xs md:text-sm font-mono text-foreground/90 whitespace-pre-wrap break-words">
              {sql}
            </pre>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
