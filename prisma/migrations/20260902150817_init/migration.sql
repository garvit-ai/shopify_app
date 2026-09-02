-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PincodeZone" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "zone" TEXT NOT NULL,

    CONSTRAINT "PincodeZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZoneRate" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "baseWeightGrams" INTEGER NOT NULL DEFAULT 500,
    "perKgExtra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "etaDays" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "ZoneRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PincodeZone_shop_pincode_idx" ON "PincodeZone"("shop", "pincode");

-- CreateIndex
CREATE UNIQUE INDEX "PincodeZone_shop_pincode_key" ON "PincodeZone"("shop", "pincode");

-- CreateIndex
CREATE INDEX "ZoneRate_shop_idx" ON "ZoneRate"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "ZoneRate_shop_zone_key" ON "ZoneRate"("shop", "zone");
