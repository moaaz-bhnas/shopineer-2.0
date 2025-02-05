import { Migration } from '@mikro-orm/migrations';

export class Migration20250205132642 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table if not exists "together" ("id" text not null, "product_handle" text not null, "frequency" integer not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "together_pkey" primary key ("id"));');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_together_deleted_at" ON "together" (deleted_at) WHERE deleted_at IS NULL;');

    this.addSql('drop table if exists "bought-together" cascade;');
  }

  async down(): Promise<void> {
    this.addSql('create table if not exists "bought-together" ("id" text not null, "product_handle" text not null, "frequency" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "bought-together_pkey" primary key ("id"));');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_bought-together_deleted_at" ON "bought-together" (deleted_at) WHERE deleted_at IS NULL;');

    this.addSql('drop table if exists "together" cascade;');
  }

}
