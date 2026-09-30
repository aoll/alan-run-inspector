import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import type { Verdict } from "@/lib/services/review";

export async function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const t = await getTranslations("review");
  return (
    <Badge
      variant={verdict === "needs_changes" ? "destructive" : verdict === "accepted" ? "default" : "outline"}
      data-testid="verdict"
    >
      {t(`verdict.${verdict}`)}
    </Badge>
  );
}
