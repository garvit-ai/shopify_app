/*
  Warnings:

  - You are about to drop the `PincodeRate` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PincodeRate";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "PincodeZone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "zone" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ZoneRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "basePrice" REAL NOT NULL,
    "baseWeightGrams" INTEGER NOT NULL DEFAULT 500,
    "perKgExtra" REAL NOT NULL DEFAULT 0,
    "etaDays" INTEGER NOT NULL DEFAULT 3
);

-- CreateIndex
CREATE INDEX "PincodeZone_shop_pincode_idx" ON "PincodeZone"("shop", "pincode");

-- CreateIndex
CREATE UNIQUE INDEX "PincodeZone_shop_pincode_key" ON "PincodeZone"("shop", "pincode");

-- CreateIndex
CREATE INDEX "ZoneRate_shop_idx" ON "ZoneRate"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "ZoneRate_shop_zone_key" ON "ZoneRate"("shop", "zone");
