import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSocialConnectionsTable1755624270177 implements MigrationInterface {
    name = 'CreateSocialConnectionsTable1755624270177'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."social_connections_platform_enum" AS ENUM('YOUTUBE', 'INSTAGRAM', 'X', 'THREADS', 'TIKTOK')`);
        await queryRunner.query(`CREATE TABLE "social_connections" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "platform" "public"."social_connections_platform_enum" NOT NULL, "platformUsername" character varying NOT NULL, "accessToken" character varying(512) NOT NULL, "refreshToken" character varying(512), "connectedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" integer, CONSTRAINT "PK_e8ecfcd0724faac2b6559bc6a2d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "social_connections" ADD CONSTRAINT "FK_1aa04de36ec18d8a7727de54ebc" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "social_connections" DROP CONSTRAINT "FK_1aa04de36ec18d8a7727de54ebc"`);
        await queryRunner.query(`DROP TABLE "social_connections"`);
        await queryRunner.query(`DROP TYPE "public"."social_connections_platform_enum"`);
    }

}
