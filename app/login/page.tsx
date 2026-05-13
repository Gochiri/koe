import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <main className="min-h-dvh flex items-center justify-center bg-background">
      <div className="w-full max-w-[320px] px-6">
        {/* Mark */}
        <div className="flex flex-col items-center gap-6 mb-10">
          <div className="w-9 h-9 rounded-lg bg-foreground/8 border border-white/[0.08] flex items-center justify-center">
            <Zap className="w-4 h-4 text-foreground/60" />
          </div>
          <div className="text-center">
            <h1 className="text-[22px] font-semibold tracking-tight">Focus OS</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Sign in to your workspace</p>
          </div>
        </div>

        {/* Form */}
        <form
          action={async (formData) => {
            "use server";
            await signIn("resend", {
              email: formData.get("email"),
              redirectTo: "/",
            });
          }}
          className="space-y-3"
        >
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="your@email.com"
            className="bg-foreground/[0.04] border-white/[0.08] placeholder:text-foreground/25 h-10 text-sm"
          />
          <Button
            type="submit"
            className="w-full h-10 text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            Send magic link
          </Button>
        </form>

        <p className="text-center text-[11px] text-muted-foreground/40 mt-6">
          Check your inbox for the sign-in link.
        </p>
      </div>
    </main>
  );
}
