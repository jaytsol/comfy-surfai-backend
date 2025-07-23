import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1753261725227 implements MigrationInterface {
    name = 'Migration1753261725227'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workflows" ADD "cost" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`COMMENT ON COLUMN "workflows"."cost" IS 'Cost to use this workflow template'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "coinBalance" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "coinBalance"`);
        await queryRunner.query(`COMMENT ON COLUMN "workflows"."cost" IS 'Cost to use this workflow template'`);
        await queryRunner.query(`ALTER TABLE "workflows" DROP COLUMN "cost"`);
    }

}
