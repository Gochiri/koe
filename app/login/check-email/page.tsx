import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Revisá tu inbox</CardTitle>
          <CardDescription>
            Te enviamos un enlace mágico. Hacé click para entrar — el enlace expira en pocos
            minutos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            ¿No lo ves? Mirá en spam o{" "}
            <Link href="/login" className="underline">
              volvé a intentar
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
