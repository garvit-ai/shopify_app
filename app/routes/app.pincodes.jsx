import { useLoaderData, Form } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

const ZONES = ["METRO", "TIER2", "REMOTE"];

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
    const fd = await request.formData();

    if (fd.get("intent") === "csv") {
        const text = fd.get("csv")?.toString() || "";
        const lines = text.trim().split("\n").slice(1);

        const rows = lines
            .map((line) => {
                const [pincode, zone] = line.split(",").map((s) => s?.trim());
                return pincode && zone ? { shop: session.shop, pincode, zone } : null;
            })
            .filter(Boolean);

        await prisma.pincodeZone.deleteMany({ where: { shop: session.shop } });

        for (let i = 0; i < rows.length; i += 500) {
            await prisma.pincodeZone.createMany({ data: rows.slice(i, i + 500) });
        }

        return { imported: rows.length };
    }

    await prisma.zoneRate.upsert({
        where: { shop_zone: { shop: session.shop, zone: fd.get("zone") } },
        update: {
            basePrice: parseFloat(fd.get("basePrice")),
            baseWeightGrams: parseInt(fd.get("baseWeightGrams"), 10),
            perKgExtra: parseFloat(fd.get("perKgExtra")),
            etaDays: parseInt(fd.get("etaDays"), 10),
        },
        create: {
            shop: session.shop,
            zone: fd.get("zone"),
            basePrice: parseFloat(fd.get("basePrice")),
            baseWeightGrams: parseInt(fd.get("baseWeightGrams"), 10),
            perKgExtra: parseFloat(fd.get("perKgExtra")),
            etaDays: parseInt(fd.get("etaDays"), 10),
        },
    });

    return { ok: true };
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
                        placeholder={"pincode,zone\n560001,METRO\n302001,TIER2"}
                        style={{ width: "100%", padding: "8px", fontFamily: "monospace" }}
                    />
                    <s-button type="submit" variant="primary">Import</s-button>
                </Form>
            </s-section>

            {ZONES.map((zone) => {
                const r = byZone[zone] || {};
                return (
                    <s-section key={zone} heading={zone}>
                        <Form method="post">
                            <input type="hidden" name="zone" value={zone} />
                            <s-stack direction="inline" gap="base">
                                <s-text-field name="basePrice" label="Base price (₹)" value={r.basePrice ?? ""} />
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