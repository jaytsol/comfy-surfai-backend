import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRagDocumentTable1757750836861 implements MigrationInterface {
    name = 'CreateRagDocumentTable1757750836861'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."rag_documents_status_enum" AS ENUM('UPLOADED', 'PROCESSING', 'READY', 'ERROR')`);
        await queryRunner.query(`CREATE TABLE "rag_documents" ("id" SERIAL NOT NULL, "ownerUserId" integer NOT NULL, "originalFilename" character varying NOT NULL, "r2Url" character varying NOT NULL, "mimeType" character varying NOT NULL, "status" "public"."rag_documents_status_enum" NOT NULL DEFAULT 'UPLOADED', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0c27c0f160af990a817ba71c32a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rag_documents" ADD CONSTRAINT "FK_1045f1748d5f3b4de4f9a1aa2d4" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rag_documents" DROP CONSTRAINT "FK_1045f1748d5f3b4de4f9a1aa2d4"`);
        await queryRunner.query(`DROP TABLE "rag_documents"`);
        await queryRunner.query(`DROP TYPE "public"."rag_documents_status_enum"`);
    }

}
