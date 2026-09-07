import { Module } from '@nestjs/common';
import { GoogleCalendarProvider } from './google-calendar-provider';
import { CALENDAR_PROVIDER, CalendarProvider } from './calendar-provider.interface';

@Module({
  providers: [
    GoogleCalendarProvider,
    { provide: CALENDAR_PROVIDER, useExisting: GoogleCalendarProvider },
  ],
  exports: [CALENDAR_PROVIDER, GoogleCalendarProvider],
})
export class CalendarModule {}
