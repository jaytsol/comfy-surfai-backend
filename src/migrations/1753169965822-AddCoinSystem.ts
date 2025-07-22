import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCoinSystem1753169965822 implements MigrationInterface {
    name = 'AddCoinSystem1753169965822'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."coin_transactions_type_enum" AS ENUM('gain', 'deduct')`);
        await queryRunner.query(`CREATE TYPE "public"."coin_transactions_reason_enum" AS ENUM('purchase', 'promotion', 'admin_adjustment', 'image_generation', 'video_generation')`);
        await queryRunner.query(`CREATE TABLE "coin_transactions" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "type" "public"."coin_transactions_type_enum" NOT NULL, "amount" integer NOT NULL, "reason" "public"."coin_transactions_reason_enum" NOT NULL, "relatedEntityId" character varying, "currentBalance" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7dad7cc20e8e6f4700b04928e12" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD "coinBalance" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "coin_transactions" ADD CONSTRAINT "FK_9332e2b867f91fba0642b781af8" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "coin_transactions" DROP CONSTRAINT "FK_9332e2b867f91fba0642b781af8"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "coinBalance"`);
        await queryRunner.query(`DROP TABLE "coin_transactions"`);
        await queryRunner.query(`DROP TYPE "public"."coin_transactions_reason_enum"`);
        await queryRunner.query(`DROP TYPE "public"."coin_transactions_type_enum"`);
    }

}
