import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitDataBase1701453342042 implements MigrationInterface {
  name = 'InitDataBase1701453342042';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "leave_request_calendar_event" ("id" SERIAL NOT NULL, "sageLeaveRequestId" integer NOT NULL, "calendarEventId" character varying NOT NULL, "startDateTime" TIMESTAMP WITH TIME ZONE NOT NULL, "endDateTime" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_8bce8ff502a71fbcf001e8ce826" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "leave_request_calendar_event"`);
  }
}
