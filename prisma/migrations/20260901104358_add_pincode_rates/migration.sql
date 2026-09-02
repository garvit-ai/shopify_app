-- CreateTable
CREATE TABLE "PincodeRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "serviceName" TEXT NOT NULL DEFAULT 'Standard Delivery',
    "etaDays" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "PincodeRate_shop_idx" ON "PincodeRate"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "PincodeRate_shop_pincode_key" ON "PincodeRate"("shop", "pincode");
