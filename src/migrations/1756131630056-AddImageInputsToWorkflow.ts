import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImageInputsToWorkflow1756131630056 implements MigrationInterface {
    name = 'AddImageInputsToWorkflow1756131630056'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workflows" DROP COLUMN "input_image_count"`);
        await queryRunner.query(`ALTER TABLE "workflows" DROP COLUMN "media_inputs"`);
        await queryRunner.query(`ALTER TABLE "workflows" ADD "imageInputs" jsonb`);
        await queryRunner.query(`COMMENT ON COLUMN "workflows"."imageInputs" IS 'Explicitly defined image inputs for the template'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "workflows"."imageInputs" IS 'Explicitly defined image inputs for the template'`);
        await queryRunner.query(`ALTER TABLE "workflows" DROP COLUMN "imageInputs"`);
        await queryRunner.query(`ALTER TABLE "workflows" ADD "media_inputs" jsonb`);
        await queryRunner.query(`ALTER TABLE "workflows" ADD "input_image_count" integer NOT NULL DEFAULT '0'`);
    }

}
