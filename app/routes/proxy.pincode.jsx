import { authenticate } from "../shopify.server";
import db from "../db.server";

export async function loader({ request }) {
    const { session } = await authenticate.public.appProxy(request);
    const url = new URL(request.url);
    const pincode = (url.searchParams.get("pincode") || "").trim();
    const shop = session?.shop || url.searchParams.get("shop");
    const grams = parseInt(url.searchParams.get("grams") || "0", 10);

    if (!/^\d{6}$/.test(pincode)) {
        return Response.json({ ok: false, reason: "invalid", message: "Enter a valid 6-digit pincode." });
    }

    const zoneRow = await db.pincodeZone.findFirst({ where: { shop, pincode } });
    if (!zoneRow) {
        return Response.json({ ok: false, reason: "not_serviceable", message: "We don't deliver to this pincode yet." });
    }

    const rate = await db.zoneRate.findFirst({ where: { shop, zone: zoneRow.zone } });
    if (!rate) {
        return Response.json({ ok: false, reason: "no_rate", message: "No rate configured for this area." });
    }

    let price = rate.basePrice;
    if (grams > rate.baseWeightGrams) {
        const extraKg = Math.ceil((grams - rate.baseWeightGrams) / 1000);
        price += extraKg * rate.perKgExtra;
    }

    return Response.json({
        ok: true,
        pincode,
        zone: zoneRow.zone,
        price,
        etaDays: rate.etaDays,
        message: `₹${price} · delivered in ${rate.etaDays} days`,
    });
}