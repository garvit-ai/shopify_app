import { useLoaderData, Form } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

const ZONES = ["metro", "tier2", "remote"];

// Form values arrive as strings and may be empty — never let NaN reach Prisma.
const num = (v, fallback = 0) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
};
const int = (v, fallback = 0) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
};

export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const rates = await prisma.zoneRate.findMany({
        where: { shop: session.shop },
    });
    const pincodeCount = await prisma.pincodeZone.count({
        where: { shop: session.shop },
    });
    return { rates, pincodeCount };
};

export const action = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const fd = await request.formData();

    if (fd.get("intent") === "csv") {
        const text = fd.get("csv")?.toString() || "";
        const lines = text.trim().split("\n");

        // Skip a header row only if it actually looks like one.
        const body = /pincode/i.test(lines[0] || "") ? lines.slice(1) : lines;

        const seen = new Set();
        const rows = [];
        const skipped = [];

        for (const line of body) {
            const [rawPin, rawZone] = line.split(",").map((s) => s?.trim());
            if (!rawPin && !rawZone) continue;

            const pincode = (rawPin || "").trim();
            const zone = (rawZone || "").trim().toLowerCase();

            if (!/^\d{6}$/.test(pincode) || !ZONES.includes(zone)) {
                skipped.push(line.trim());
                continue;
            }
            if (seen.has(pincode)) continue;
            seen.add(pincode);
            rows.push({ shop, pincode, zone });
        }

        // Upsert rather than wipe-and-recreate, so a bad paste can't destroy
        // existing mappings and a mid-way failure can't leave the table empty.
        for (const row of rows) {
            await prisma.pincodeZone.upsert({
                where: { shop_pincode: { shop, pincode: row.pincode } },
                update: { zone: row.zone },
                create: row,
            });
        }

        return { imported: rows.length, skipped };
    }

    const zone = (fd.get("zone") || "").toString().toLowerCase();
    if (!ZONES.includes(zone)) {
        return { error: "Unknown zone." };
    }

    const data = {
        basePrice: num(fd.get("basePrice")),
        baseWeightGrams: int(fd.get("baseWeightGrams"), 500),
        perKgExtra: num(fd.get("perKgExtra")),
        etaDays: int(fd.get("etaDays"), 3),
    };

    await prisma.zoneRate.upsert({
        where: { shop_zone: { shop, zone } },
        update: data,
        create: { shop, zone, ...data },
    });

    return { ok: true, saved: zone };
};

export default function Pincodes() {
    const { rates, pincodeCount } = useLoaderData();
    const byZone = Object.fromEntries(rates.map((r) => [r.zone, r]));

    return (
        <s-page heading="Zone Rates">
            <s-section heading={`Pincode mapping (${pincodeCount} loaded)`}>
                <Form method="post">
                    <input type="hidden" name="intent" value="csv" />
                    <textarea
                        name="csv"
                        rows="8"
                        placeholder={"pincode,zone\n560001,metro\n342008,tier2"}
                        style={{ width: "100%", padding: "8px", fontFamily: "monospace" }}
                    />
                    <s-paragraph>
                        Existing pincodes are updated, new ones added. Nothing is deleted.
                    </s-paragraph>
                    <s-button type="submit" variant="primary">Import</s-button>
                </Form>
            </s-section>

            {ZONES.map((zone) => {
                const r = byZone[zone] || {};
                return (
                    <s-section key={zone} heading={zone.toUpperCase()}>
                        <Form method="post">
                            <input type="hidden" name="zone" value={zone} />
                            <s-stack direction="inline" gap="base">
                                <s-text-field name="basePrice" label="Base price (₹)" value={r.basePrice ?? 0} />
                                <s-text-field name="baseWeightGrams" label="Base weight (g)" value={r.baseWeightGrams ?? 500} />
                                <s-text-field name="perKgExtra" label="Per extra kg (₹)" value={r.perKgExtra ?? 0} />
                                <s-text-field name="etaDays" label="ETA (days)" value={r.etaDays ?? 3} />
                                <s-button type="submit" variant="primary">Save</s-button>
                            </s-stack>
                        </Form>
                    </s-section>
                );
            })}
        </s-page>
    );
}