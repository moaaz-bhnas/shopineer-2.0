import { Migration } from '@mikro-orm/migrations';

export class Migration20250124062416 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table if not exists "manager" ("id" text not null, "first_name" text not null, "last_name" text not null, "email" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "manager_pkey" primary key ("id"));');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_manager_deleted_at" ON "manager" (deleted_at) WHERE deleted_at IS NULL;');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "manager" cascade;');
  }

}
