import { redirect } from "next/navigation";

/** Old invite URLs used /redeem/:token; static export cannot serve arbitrary paths, so primary flow is /redeem?token=. */
export default function RedeemLegacyRedirect({ params }: { params: { token: string } }) {
  redirect(`/redeem?token=${encodeURIComponent(params.token)}`);
}

export const dynamic = "force-static";
export const dynamicParams = false;

// Static export compatibility: no pre-rendered token paths.
export async function generateStaticParams(): Promise<Array<{ token: string }>> {
  return [];
}
