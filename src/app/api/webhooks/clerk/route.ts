import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses: { email_address: string }[];
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
  };
};

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // Verify this request genuinely came from Clerk
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(webhookSecret);

  let event: ClerkWebhookEvent;
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { type, data } = event;

  if (type === "user.created") {
    const email = data.email_addresses[0]?.email_address ?? "";
    const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || "New User";

    await db.user.upsert({
      where: { clerkId: data.id },
      create: {
        clerkId: data.id,
        email,
        name,
        avatar: data.image_url,
        role: "BUYER", // Always defaults to BUYER server-side. Role upgrades happen via a separate, audited onboarding step — never client-supplied on creation.
      },
      update: {}, // no-op if it somehow already exists
    });
  }

  if (type === "user.updated") {
    const email = data.email_addresses[0]?.email_address ?? "";
    const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || "New User";

    await db.user.update({
      where: { clerkId: data.id },
      data: { email, name, avatar: data.image_url },
    }).catch(() => {
      // user might not exist locally yet — ignore, user.created will handle it
    });
  }

  if (type === "user.deleted") {
    await db.user.delete({ where: { clerkId: data.id } }).catch(() => {
      // already deleted or never existed — fine
    });
  }

  return NextResponse.json({ received: true });
}