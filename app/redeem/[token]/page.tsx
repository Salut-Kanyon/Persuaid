import { redirect } from "next/navigation";

/** Old invite URLs used /redeem/:token; static export cannot serve arbitrary paths, so primary flow is /redeem?token=. */
export default function RedeemLegacyRedirect({ params }: { params: { token: string } }) {
  redirect(`/redeem?token=${encodeURIComponent(params.token)}`);
}
