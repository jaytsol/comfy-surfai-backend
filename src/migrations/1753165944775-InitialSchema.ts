import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1753165944775 implements MigrationInterface {
    name = 'InitialSchema1753165944775'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "password" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "email" character varying NOT NULL, "displayName" character varying NOT NULL, "googleId" character varying, "imageUrl" character varying(2048), "currentHashedRefreshToken" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_f382af58ab36057334fb262efd5" UNIQUE ("googleId"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "workflows" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" text, "category" character varying(100), "definition" jsonb, "parameter_map" jsonb, "previewImageUrl" text, "tags" text, "isPublicTemplate" boolean NOT NULL DEFAULT false, "user_parameter_values" jsonb, "isTemplate" boolean NOT NULL DEFAULT true, "ownerUserId" integer, "sourceTemplateId" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5b5757cc1cd86268019fef52e0c" PRIMARY KEY ("id")); COMMENT ON COLUMN "workflows"."category" IS 'Category of the workflow template (e.g., image, video)'; COMMENT ON COLUMN "workflows"."definition" IS 'ComfyUI workflow definition JSON'; COMMENT ON COLUMN "workflows"."parameter_map" IS 'Parameter mapping for the template'; COMMENT ON COLUMN "workflows"."isPublicTemplate" IS 'Is this template available to all users?'; COMMENT ON COLUMN "workflows"."user_parameter_values" IS 'User-defined parameter values for this instance'; COMMENT ON COLUMN "workflows"."isTemplate" IS 'Is this record a template or a user instance?'`);
        await queryRunner.query(`CREATE INDEX "IDX_e35cd636f192d5cb19ba49f16c" ON "workflows" ("ownerUserId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ed2580efaf4d0cd1ac4085a0aa" ON "workflows" ("sourceTemplateId") `);
        await queryRunner.query(`CREATE TABLE "generated_outputs" ("id" SERIAL NOT NULL, "r2Url" character varying(2048) NOT NULL, "originalFilename" character varying NOT NULL, "mimeType" character varying NOT NULL, "promptId" character varying NOT NULL, "ownerUserId" integer NOT NULL, "sourceWorkflowId" integer NOT NULL, "usedParameters" jsonb, "duration" double precision, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4e4bfb070375534b807fda8ef6d" PRIMARY KEY ("id")); COMMENT ON COLUMN "generated_outputs"."r2Url" IS 'Cloudflare R2에 저장된 파일의 최종 URL'; COMMENT ON COLUMN "generated_outputs"."originalFilename" IS 'ComfyUI가 생성한 원본 파일명'; COMMENT ON COLUMN "generated_outputs"."mimeType" IS '파일의 MIME 타입 (예: image/png)'; COMMENT ON COLUMN "generated_outputs"."promptId" IS '이 결과물을 생성한 ComfyUI 작업의 고유 ID'; COMMENT ON COLUMN "generated_outputs"."ownerUserId" IS '이 결과물을 생성한 사용자의 ID'; COMMENT ON COLUMN "generated_outputs"."sourceWorkflowId" IS '생성에 사용된 워크플로우 템플릿의 ID'; COMMENT ON COLUMN "generated_outputs"."usedParameters" IS '생성에 사용된 동적 파라미터들'; COMMENT ON COLUMN "generated_outputs"."duration" IS '생성에 소요된 시간 (초)'`);
        await queryRunner.query(`CREATE INDEX "IDX_3d56ad0cfec60542402915b1d4" ON "generated_outputs" ("promptId") `);
        await queryRunner.query(`CREATE INDEX "IDX_2257fb4f770c06d0d13e1820c4" ON "generated_outputs" ("ownerUserId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d3310cba6fdf23c7fb5868d635" ON "generated_outputs" ("sourceWorkflowId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a5a5c9dc20043f2e76c744db78" ON "generated_outputs" ("ownerUserId", "createdAt") `);
        await queryRunner.query(`ALTER TABLE "workflows" ADD CONSTRAINT "FK_e35cd636f192d5cb19ba49f16c7" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workflows" ADD CONSTRAINT "FK_ed2580efaf4d0cd1ac4085a0aa1" FOREIGN KEY ("sourceTemplateId") REFERENCES "workflows"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "generated_outputs" ADD CONSTRAINT "FK_2257fb4f770c06d0d13e1820c47" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "generated_outputs" ADD CONSTRAINT "FK_d3310cba6fdf23c7fb5868d6354" FOREIGN KEY ("sourceWorkflowId") REFERENCES "workflows"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "generated_outputs" DROP CONSTRAINT "FK_d3310cba6fdf23c7fb5868d6354"`);
        await queryRunner.query(`ALTER TABLE "generated_outputs" DROP CONSTRAINT "FK_2257fb4f770c06d0d13e1820c47"`);
        await queryRunner.query(`ALTER TABLE "workflows" DROP CONSTRAINT "FK_ed2580efaf4d0cd1ac4085a0aa1"`);
        await queryRunner.query(`ALTER TABLE "workflows" DROP CONSTRAINT "FK_e35cd636f192d5cb19ba49f16c7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a5a5c9dc20043f2e76c744db78"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d3310cba6fdf23c7fb5868d635"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2257fb4f770c06d0d13e1820c4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3d56ad0cfec60542402915b1d4"`);
        await queryRunner.query(`DROP TABLE "generated_outputs"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ed2580efaf4d0cd1ac4085a0aa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e35cd636f192d5cb19ba49f16c"`);
        await queryRunner.query(`DROP TABLE "workflows"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
