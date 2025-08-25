import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateWorkflowImageInputs1756132205253 implements MigrationInterface {
    name = 'UpdateWorkflowImageInputs1756132205253'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workflows" RENAME COLUMN "imageInputs" TO "requiredImageCount"`);
        await queryRunner.query(`ALTER TABLE "workflows" DROP COLUMN "requiredImageCount"`);
        await queryRunner.query(`ALTER TABLE "workflows" ADD "requiredImageCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`COMMENT ON COLUMN "workflows"."requiredImageCount" IS 'Number of required image inputs for the template'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "workflows"."requiredImageCount" IS 'Number of required image inputs for the template'`);
        await queryRunner.query(`ALTER TABLE "workflows" DROP COLUMN "requiredImageCount"`);
        await queryRunner.query(`ALTER TABLE "workflows" ADD "requiredImageCount" jsonb`);
        await queryRunner.query(`ALTER TABLE "workflows" RENAME COLUMN "requiredImageCount" TO "imageInputs"`);
    }

}
