-- CreateEnum
CREATE TYPE "GlobalRole" AS ENUM ('CONTADOR', 'SUPER_ADMIN');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "globalRole" "GlobalRole" NOT NULL DEFAULT 'CONTADOR',
ALTER COLUMN "contadorId" DROP NOT NULL;
