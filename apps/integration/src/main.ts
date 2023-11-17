import * as express from 'express';
import * as cron from 'node-cron';
import 'dotenv/config';

import { CalendarService } from './calendar';
import { SageService } from './sage';

const app = express();
const port = 3000;

app.use(express.json());

const sageService = new SageService('https://litebox.sage.hr');
const calendarService = new CalendarService();

const calendarId =
  'c_afbd821650afdc9c26bcf37531bc49e9da3c141b1c093d72ab10c558d77ff963@group.calendar.google.com';

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
    const data = await calendarService.getEvents(calendarId);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/calendar-service/event', async (req, res) => {
  try {
    const event = req.body;

    const createdEvent = await calendarService.createEvent(calendarId, event);

    res.status(201).json(createdEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/calendar-service/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const updateEventProps = req.body;

    const eventToUpdate = await calendarService.getEvent(calendarId, eventId);

    const result = await calendarService.updateEvent(calendarId, eventId, {
      ...eventToUpdate,
      ...updateEventProps,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/calendar-service/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    await calendarService.deleteEvent(calendarId, eventId);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running into http://localhost:${port}`);
});
