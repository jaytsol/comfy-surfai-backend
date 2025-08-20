import { MigrationInterface, QueryRunner } from "typeorm";

export class IncreaseTokenLengthInSocialConnections1755714916730 implements MigrationInterface {
    name = 'IncreaseTokenLengthInSocialConnections1755714916730'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "social_connections" DROP COLUMN "accessToken"`);
        await queryRunner.query(`ALTER TABLE "social_connections" ADD "accessToken" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "social_connections" DROP COLUMN "refreshToken"`);
        await queryRunner.query(`ALTER TABLE "social_connections" ADD "refreshToken" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "social_connections" DROP COLUMN "refreshToken"`);
        await queryRunner.query(`ALTER TABLE "social_connections" ADD "refreshToken" character varying(512)`);
        await queryRunner.query(`ALTER TABLE "social_connections" DROP COLUMN "accessToken"`);
        await queryRunner.query(`ALTER TABLE "social_connections" ADD "accessToken" character varying(512) NOT NULL`);
    }

}
