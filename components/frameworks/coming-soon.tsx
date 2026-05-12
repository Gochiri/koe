import { Card, CardContent } from "@/components/ui/card";
import { Hammer } from "lucide-react";

export function ComingSoon({ note }: { note?: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 flex flex-col items-center text-center gap-2">
        <Hammer className="w-6 h-6 text-muted-foreground" />
        <p className="text-sm font-medium">Próximamente</p>
        <p className="text-xs text-muted-foreground max-w-md">
          {note ?? "Esta página todavía no tiene la herramienta interactiva. Ya está la sección 'cómo funciona' arriba — la herramienta llega en la próxima iteración."}
        </p>
      </CardContent>
    </Card>
  );
}
