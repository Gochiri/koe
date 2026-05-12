import { db } from "@/lib/db/client";
import { offers as offersTable } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { FrameworkShell } from "@/components/frameworks/framework-shell";
import { valueEquation } from "@/lib/frameworks";
import { OfferForm } from "@/components/frameworks/offers/offer-form";
import { OfferList } from "@/components/frameworks/offers/offer-list";

export default async function OffersPage() {
  const offers = await db.select().from(offersTable).orderBy(desc(offersTable.createdAt));
  return (
    <FrameworkShell framework={valueEquation}>
      <div className="space-y-6">
        <OfferForm />
        <OfferList offers={offers} />
      </div>
    </FrameworkShell>
  );
}
