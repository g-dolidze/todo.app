-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('KA', 'EN');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('DAILY', 'WEEKLY');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "avatar" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tbilisi',
    "locale" "Locale" NOT NULL DEFAULT 'KA',
    "theme" "Theme" NOT NULL DEFAULT 'SYSTEM',
    "week_start" SMALLINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "legacy_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "one_time_task" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "time" CHAR(5) NOT NULL,
    "done_at" TIMESTAMPTZ,
    "legacy_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "one_time_task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "mission_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "start_date" DATE NOT NULL,
    "archived_at" TIMESTAMPTZ,
    "legacy_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "habit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_schedule" (
    "id" UUID NOT NULL,
    "habit_id" UUID NOT NULL,
    "type" "ScheduleType" NOT NULL,
    "weekdays" SMALLINT[],
    "valid_from" DATE NOT NULL,
    "valid_to" DATE,

    CONSTRAINT "habit_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkin" (
    "id" UUID NOT NULL,
    "habit_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_hash_key" ON "refresh_token"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_token_user_id_idx" ON "refresh_token"("user_id");

-- CreateIndex
CREATE INDEX "mission_user_id_end_date_idx" ON "mission"("user_id", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "mission_user_id_legacy_id_key" ON "mission"("user_id", "legacy_id");

-- CreateIndex
CREATE INDEX "one_time_task_user_id_date_time_idx" ON "one_time_task"("user_id", "date", "time");

-- CreateIndex
CREATE UNIQUE INDEX "one_time_task_user_id_legacy_id_key" ON "one_time_task"("user_id", "legacy_id");

-- CreateIndex
CREATE INDEX "habit_user_id_archived_at_sort_order_idx" ON "habit"("user_id", "archived_at", "sort_order");

-- CreateIndex
CREATE INDEX "habit_mission_id_idx" ON "habit"("mission_id");

-- CreateIndex
CREATE UNIQUE INDEX "habit_user_id_legacy_id_key" ON "habit"("user_id", "legacy_id");

-- CreateIndex
CREATE INDEX "habit_schedule_habit_id_valid_from_idx" ON "habit_schedule"("habit_id", "valid_from");

-- CreateIndex
CREATE UNIQUE INDEX "checkin_habit_id_date_key" ON "checkin"("habit_id", "date");

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission" ADD CONSTRAINT "mission_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "one_time_task" ADD CONSTRAINT "one_time_task_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit" ADD CONSTRAINT "habit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit" ADD CONSTRAINT "habit_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "mission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_schedule" ADD CONSTRAINT "habit_schedule_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin" ADD CONSTRAINT "checkin_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Business rules Prisma cannot express (docs/TDD.md §7.2)
ALTER TABLE "mission" ADD CONSTRAINT "mission_dates_check" CHECK ("end_date" >= "start_date");
ALTER TABLE "user" ADD CONSTRAINT "user_email_lowercase_check" CHECK ("email" = lower("email"));
ALTER TABLE "user" ADD CONSTRAINT "user_week_start_check" CHECK ("week_start" IN (1, 7));
ALTER TABLE "one_time_task" ADD CONSTRAINT "one_time_task_time_check" CHECK ("time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
ALTER TABLE "habit_schedule" ADD CONSTRAINT "habit_schedule_weekdays_check" CHECK (
  "weekdays" <@ ARRAY[1,2,3,4,5,6,7]::SMALLINT[]
  AND (("type" = 'DAILY' AND cardinality("weekdays") = 0) OR ("type" = 'WEEKLY' AND cardinality("weekdays") > 0))
);
ALTER TABLE "habit_schedule" ADD CONSTRAINT "habit_schedule_valid_range_check" CHECK ("valid_to" IS NULL OR "valid_to" >= "valid_from");
