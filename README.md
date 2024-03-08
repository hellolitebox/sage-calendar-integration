# The Litebox Way - Sage Meets Google Calendar: Seamless Integration 🔗

The purpose of this repository is to facilitate the integration of Sage HR with Google Calendar. While Sage offers a basic integration with Google Calendar, it primarily focuses on creating calendar entries. This integration aims to provide detailed and accurate information about approved employee leave requests directly within Google Calendar, enhancing visibility regarding the status of event attendees.

Given that Sage HR does not offer a webhook for leave requests, we have implemented a CRON job to periodically fetch all approved leave requests. This process ensures the creation, updating, and deletion of these events in Google Calendar, maintaining synchronization and accuracy.

## Unveiling Capabilities: Main Features ✨

- **Node.js Foundation**: Built on a Node.js platform, ensuring efficient and scalable backend performance.
- **Scheduled Tasks with node-cron**: Utilizes node-cron for scheduling regular tasks, enabling automated synchronization processes.
- **PostgreSQL Database Integration**: Employs a PostgreSQL database to store event data, facilitating efficient validation and decision-making on whether to remove, update, or create events in the calendar.
- **TypeORM for Object-Relational Mapping**: Incorporates TypeORM, a powerful ORM tool, to manage database entities and transactions, enhancing code maintainability and database interaction.
- **Google Calendar Integration**: Seamlessly integrates with Google Calendar, providing accurate and detailed information about approved employee leave requests directly within the calendar interface.

# Setting the Stage: Prepping for Litebox Sage ⚙

Before starting with the integration, ensure you have the following prerequisites and configurations in place:

## The Must-Haves: Litebox Sage Essentials 📝

- **Sage HR API Key**: Obtain an API key from Sage HR to interact with their system.
- **Google Service Account**: Create a service account in Google Cloud to manage calendar events through the CRON job.
- **Wide-Domain Authority for Service Account**: Grant the service account wide-domain authority to allow event creation with attendees and set their status as accepted. This is crucial for managing calendar events accurately. [Google's Wide-Domain Authority Documentation](https://developers.google.com/identity/protocols/oauth2/service-account#delegatingauthority)
- **JSON Web Token**: Download a JSON Web Token for the service account's credentials. This token is necessary for authenticating your application with Google's services. [Google's JWT Guide](https://cloud.google.com/nodejs/docs/reference/google-auth-library/latest#json-web-tokens)

## Cloud Crafting: Google Cloud Setup ☁

To connect with Google's API and manage calendar events, follow these steps:

1. **Create a Google Cloud App**: Start by creating an app in Google Cloud. This is your entry point for using Google's APIs. [Google Cloud Dashboard](https://console.cloud.google.com/home/dashboard)

2. **Create a Service Account**: For backend interactions, especially for operations like CRON jobs that run without user intervention, a Service Account is essential. [Create Service Account](https://console.cloud.google.com/apis/credentials)

   Note: This should be a Service Account to enable interaction without going through the login process that usually requires a browser window.

3. **Assign 'Wide-Domain' Permissions to the Service Account**: For the Service Account to create events with attendees, it must have 'Wide-Domain' permissions. This can typically be set by an admin in Google Workspace. [Google Workspace Admin Settings](https://support.google.com/a/answer/162106?hl=en)

   This permission allows the application to set attendees in events and set `responseStatus` as **"accepted"**, which is a key feature of the integration.


# Setting Environment Variables 🌍

To run this project successfully, you need to set up the following environment variables in your `.env` file. You can find an example in `.env.example`.

- `SAGE_API_KEY`: Your API key for Sage HR.
- `SAGE_DOMAIN`: The domain for your Sage HR integration.
- `GOOGLE_CALENDAR_CREDENTIALS`: The JSON Web Token (JWT) credentials for your Google Calendar service account. 
- `GOOGLE_CALENDAR_SUBJECT_EMAIL`: The email associated with your Google Calendar service account.
- `GOOGLE_CALENDAR_ID`: The ID of your Google Calendar.
- `POSTGRES_USER_NAME`: Your PostgreSQL database username.
- `POSTGRES_PASSWORD`: Your PostgreSQL database password.
- `POSTGRES_HOST`: Host address for your PostgreSQL database.
- `POSTGRES_PORT`: Port number for your PostgreSQL database.
- `POSTGRES_DATA_BASE`: Name of your PostgreSQL database.
- `TEST_USERS`: (Optional) User IDs for testing purposes.
- `ENABLE_TEST_USERS_ALL`: (Optional) Flag to enable testing for all users.
- `SYNC_SAGE_CALENDAR_CRON_SCHEDULE`: CRON schedule for syncing Sage Calendar.

## Unlocking Google Calendar: Credentials Setup  🔓

For `GOOGLE_CALENDAR_CREDENTIALS`, it's important to copy and paste the entire JWT JSON downloaded from your Google Cloud Service Account credentials page. It should look something like this:

```json
GOOGLE_CALENDAR_CREDENTIALS='{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n[...]\n-----END PRIVATE KEY-----\n",
  "client_email": "your-client-email@your-project-id.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://accounts.google.com/o/oauth2/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/your-client-email%40your-project-id.iam.gserviceaccount.com"
}'
```

Make sure to replace the placeholders with your actual Service Account information.


# Data Journey: Managing Migrations 🌐

This project uses [TypeORM migrations](https://typeorm.io/migrations) for database migrations. Migrations are stored in the following directory structure:

```
- apps
    - integration
        - src
            - database
                - migration
                - 1701452789418-ExampleMigration.ts
```

## Crafting New Realities: Generating Migrations 🎨

To manage your database schema changes, you can create and generate migrations as follows:

### Creating a New Migration

To manually create a new migration, run:

```bash
npm run migration:create --name=MigrationName
```

Replace MigrationName with the desired name for your migration.

### Generating Migrations from Entities
To automatically generate migrations based on changes in your entities, run:

```bash
npm run migration:generate --name=MigrationName
```
Again, replace MigrationName with an appropriate name for the generated migration.

### Running Migrations
Once you have your migrations set up, you can apply them to your database with the following command:

```bash
npm run migration:run
```
This command will execute the migrations in the order they were created, updating your database schema according to the defined changes.


# Time’s Tick: Running CRON Jobs ⏳

To start the synchronization process between Sage HR and Google Calendar, run the following command:

```bash
npm run dev
```
Once the cron job initiates the synchronization, you will see logs indicating the progress and actions taken:

## Alerts & Notifications 🔔
- **Starting Sync:** At the beginning of the synchronization process, you will see:

```bash
🏁 Starting sync at [date time]
```
- **Event Creation:** When a new calendar event is successfully created:

```bash
✅ Calendar Event Created: Sage HR Policy Name
```

- **Event Update:** If an existing calendar event is updated:

```bash
🔁 Calendar Event updated: [google calendar event summary]
```

- **No Change Needed:** If the event already exists in the calendar and no changes are needed:

```bash
📅 Event Calendar already exists for leave request: [Employee Name] :  [Sage HR Policy Name]
```

- **Event Cancellation:** When an event in Sage HR is cancelled and the corresponding calendar event is removed:

```bash
❌ Event Calendar removed for cancelled leave request id: [sage Leave Request Id]
```

- **End of Sync:** Upon completion of the synchronization process:

```bash
🛑 Sync is finished at [date time]
```

These logs will help you track the progress of the synchronization and quickly identify the status of each leave request being processed.

# Adding More Magic to Litebox Sage 🧪

This project is designed to be extensible and allows for the integration of additional services. To add a new service, the service must implement the `SageIntegrationService` interface. This interface includes the following methods:

- `handleCreateLeaveRequest(leaveRequest: LeaveRequest): Promise<string>;`
- `handleUpdateLeaveRequest(leaveRequest: LeaveRequest, integrationLeaveId: string): Promise<string>;`
- `handleRemoveLeaveRequest(leaveRequest: LeaveRequest, integrationLeaveId: string): Promise<void>;`
- `formatNoUpdateNeededMessage(leaveRequest: LeaveRequest): string;`

Each of these methods corresponds to a specific action related to leave requests:

- **handleCreateLeaveRequest**: This method is called when a new leave request is created. It should handle the logic necessary to create a corresponding event or entry in the integrated service.
- **handleUpdateLeaveRequest**: This method is called when an existing leave request is updated. It should handle the logic necessary to update the corresponding event or entry in the integrated service.
- **handleRemoveLeaveRequest**: This method is called when a leave request is cancelled. It should handle the logic necessary to remove the corresponding event or entry in the integrated service.
- **formatNoUpdateNeededMessage**: This method is called when a leave request is processed but no changes are needed. It should return a string message that will be logged to indicate that no update was needed.

The `SageLeaveEventScheduler` class is responsible for processing leave requests and interacting with the integrated services. It takes an array of `SageIntegrationService` instances as part of its configuration. When processing leave requests, it will iterate over each service in this array and call the appropriate method based on the status of the leave request.

Here is an example of how to add a new service to the `SageLeaveEventScheduler`:
```javascript
const myNewService = new MyNewService();

const scheduler = new SageLeaveEventScheduler({
  integrationServices: [myNewService, ...existingServices],
  sageService,
  leaveRequestCalendarEventRepository,
});
```
In this example, `MyNewService` is a class that implements the `SageIntegrationService` interface. An instance of this class is created and added to the array of integration services passed to the `SageLeaveEventScheduler`.

Remember, each service you add must implement all methods defined in the `SageIntegrationService` interface. This ensures that the `SageLeaveEventScheduler` can correctly interact with the service when processing leave requests.

This design allows for easy addition of new services and makes the project highly extensible. You can add as many services as you need, and each one can handle leave requests in a way that makes sense for the specific service.

# Litebox Careers 💻

If you're passionate about developing amazing applications and websites, Litebox is the place for you. 

Would you like to join our digital force? Feel free to apply at https://litebox.ai/careers

--- 
By [Litebox](https://litebox.ai/) 🚀