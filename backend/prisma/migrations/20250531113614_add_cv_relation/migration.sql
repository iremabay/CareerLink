-- CreateTable
CREATE TABLE "CV" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CV_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CV_userId_key" ON "CV"("userId");

-- AddForeignKey
ALTER TABLE "CV" ADD CONSTRAINT "CV_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
