import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueConstraintToSocialConnections1755706816885 implements MigrationInterface {
    name = 'AddUniqueConstraintToSocialConnections1755706816885'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "social_connections" ADD CONSTRAINT "UQ_3c0637489f86bbd4b96a2a91239" UNIQUE ("userId", "platform")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "social_connections" DROP CONSTRAINT "UQ_3c0637489f86bbd4b96a2a91239"`);
    }

}
