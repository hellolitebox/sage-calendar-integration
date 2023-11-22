import * as express from 'express';
import * as cron from 'node-cron';
import 'dotenv/config';

import { CalendarService } from './calendar';
import { SageService } from './sage';
import { syncSageWithCalendar } from './integration/ServicesIntegration';

const app = express();
const port = 3000;

app.use(express.json());

const sageService = new SageService({
  sageDomain: 'https://litebox.sage.hr',
  sageApiKey: process.env.SAGE_API_KEY,
});
const calendarId =
  'c_afbd821650afdc9c26bcf37531bc49e9da3c141b1c093d72ab10c558d77ff963@group.calendar.google.com';

// load the environment variable with keys
const keysEnvVar = process.env.GOOGLE_CALENDAR_CREDENTIALS;
if (!keysEnvVar) {
  throw new Error(
    'The $GOOGLE_CALENDAR_CREDENTIALS environment variable was not found!',
  );
}
const keys = JSON.parse(keysEnvVar);
const calendarService = new CalendarService({
  calendarId,
  accountPrivateKey: keys.private_key,
  clientEmail: keys.client_email,
  subjectEmail: 'darce@litebox.ai',
});

// cron.schedule('*/2 * * * *', async () => {
//   const data = await sageService.fetchLeaveRequests('2023-11-17', '2023-12-31');
//   console.log('⏲️ Fetching data from Sage service');
//   console.log(JSON.stringify(data, undefined, 2));
// });

app.get('/sage-service/leave-requests', async (req, res) => {
  try {
    const fromDate =
      typeof req.query.fromDate === 'string'
        ? req.query.fromDate
        : '2023-11-16';
    const toDate =
      typeof req.query.toDate === 'string' ? req.query.toDate : '2024-01-16';

    const data = await sageService.fetchLeaveRequests(fromDate, toDate);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/sage-service/policies', async (req, res) => {
  try {
    const fromDate =
      typeof req.query.fromDate === 'string'
        ? req.query.fromDate
        : '2023-11-16';
    const toDate =
      typeof req.query.toDate === 'string' ? req.query.toDate : '2024-01-16';

    console.log(`from: ${fromDate} to ${toDate}`);

    const data = await sageService.fetchPolicies();

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/calendar-service/events', async (req, res) => {
  try {
    const data = await calendarService.getEvents();

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/calendar-service/event', async (req, res) => {
  try {
    const event = req.body;

    const createdEvent = await calendarService.createEvent(event);

    res.status(201).json(createdEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/calendar-service/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const updateEventProps = req.body;

    const eventToUpdate = await calendarService.getEvent(eventId);

    console.log('eventToUpdate', eventToUpdate);

    // TODO: uncomment this line. Probably instead of editing event, we will have to delete event and create a new one, do the the acceptance status. (Once the event is updated it will loose the "Accepted")
    // const result = await calendarService.updateEvent(eventId, {
    //   ...eventToUpdate,
    //   ...updateEventProps,
    // });

    // res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/calendar-service/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    await calendarService.deleteEvent(eventId);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/integration/sync-leave-requests', async (req, res) => {
  try {
    syncSageWithCalendar();

    res.status(200).json({ statusMessage: 'running sync' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running into http://localhost:${port}`);
});
