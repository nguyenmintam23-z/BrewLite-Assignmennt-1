-- Migration: 20261119000000_init
-- BrewLite A1 – Task 7 (Tâm): tạo bảng products và users
-- Bảng users theo schema-draft.prisma (Duy) + yêu cầu Task 7

-- CreateTable products (tối thiểu để foreign key từ orders sau này)
CREATE TABLE IF NOT EXISTS "products" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "price" INTEGER NOT NULL,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable users
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "loyalty_points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex users_email_key (unique, case-sensitive lưu lowercase)
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
