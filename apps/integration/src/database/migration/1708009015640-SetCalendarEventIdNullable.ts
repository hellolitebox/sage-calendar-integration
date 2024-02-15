import type { MigrationInterface, QueryRunner } from 'typeorm';

export class SetCalendarEventIdNullable1708009015640
  implements MigrationInterface
{
  name = 'SetCalendarEventIdNullable1708009015640';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leave_request_calendar_event" ALTER COLUMN "calendarEventId" DROP NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "leave_request_calendar_event" ALTER COLUMN "calendarEventId" SET NOT NULL`
    );
  }
}
