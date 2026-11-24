// POST { refresh_url, return_url } → { url }
// Creates (once) a Stripe Express account for the seller and returns an
// onboarding link. Stripe handles identity verification (KYC) and tax forms.
import { admin, handler, json, requireUser, safeReturnUrl, stripe } from "../_shared/clients.ts";

const APP_URL = Deno.env.get("APP_URL") ?? "http://localhost:5173";

Deno.serve(
  handler(async (req) => {
    const user = await requireUser(req);
    const body = await req.json().catch(() => ({}));

    const { data: existing } = await admin.from("seller_accounts").select("stripe_account_id").eq("user_id", user.id).maybeSingle();
    let accountId = existing?.stripe_account_id as string | undefined;
    if (!accountId) {
      const { data: profile } = await admin.from("profiles").select("country").eq("id", user.id).single();
      const account = await stripe.accounts.create({
        type: "express",
        country: profile?.country ?? "US",
        email: user.email,
        capabilities: { transfers: { requested: true } },
        business_type: "individual",
        metadata: { winkpop_user_id: user.id },
      });
      accountId = account.id;
      await admin.from("seller_accounts").insert({ user_id: user.id, stripe_account_id: accountId });
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: safeReturnUrl(body.refresh_url, `${APP_URL}/settings/payments?payouts=refresh`),
      return_url: safeReturnUrl(body.return_url, `${APP_URL}/settings/payments?payouts=done`),
    });
    return json(req, { url: link.url });
  }),
);
