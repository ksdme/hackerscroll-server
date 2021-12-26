-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "hn_id" INTEGER NOT NULL,
    "rank" INTEGER,
    "by" TEXT NOT NULL,
    "url" TEXT,
    "title" TEXT NOT NULL,
    "text" TEXT,
    "date" TIMESTAMP(3),
    "visible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" SERIAL NOT NULL,
    "direction" TEXT,
    "title" TEXT,
    "byline" TEXT,
    "content" TEXT,
    "html_content" TEXT,
    "excerpt" TEXT,
    "length" INTEGER,
    "post_id" INTEGER NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Post_hn_id_key" ON "Post"("hn_id");

-- CreateIndex
CREATE INDEX "Post_rank_idx" ON "Post"("rank");

-- CreateIndex
CREATE UNIQUE INDEX "Content_post_id_key" ON "Content"("post_id");

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
