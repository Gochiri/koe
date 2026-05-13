import type { FrameworkMeta } from "@/lib/frameworks/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, BookOpen } from "lucide-react";

export function FrameworkShell({
  framework,
  children,
}: {
  framework: FrameworkMeta;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6 w-full">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="secondary" className="text-xs">
            {framework.domain}
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{framework.name}</h1>
        <p className="text-muted-foreground mt-1">{framework.tagline}</p>
      </div>

      <Collapsible>
        <Card>
          <CollapsibleTrigger className="w-full text-left p-4 flex items-center justify-between hover:bg-muted/40 rounded-md group">
            <span className="flex items-center gap-2 text-sm font-medium">
              <BookOpen className="w-4 h-4" />
              ¿Cómo funciona?
            </span>
            <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {framework.howItWorks.map((section) => (
                <div key={section.heading}>
                  <h3 className="font-medium text-sm mb-1">{section.heading}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {section.body}
                  </p>
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <div>{children}</div>
    </div>
  );
}
