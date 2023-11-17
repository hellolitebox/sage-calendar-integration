import * as cron from 'node-cron';
import * as express from 'express';
import { SageService } from 'src/sage/SageService';

const app: express.Express = express();

const sageService = new SageService('https://litebox.sage.hr');

cron.schedule('*/2 * * * *', async () => {
  const data = await sageService.fetchLeaveRequests('2023-11-17', '2023-12-31');
  console.log('⏲️ Fetching data from Sage service');
  console.log(JSON.stringify(data, undefined, 2));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on  ${PORT}...`);
});
