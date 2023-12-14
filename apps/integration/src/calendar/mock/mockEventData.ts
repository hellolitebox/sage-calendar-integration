const mockEvent = {
  kind: 'calendar#event',
  etag: 'etagExample',
  id: 'mockedEventId',
  status: 'confirmed',
  htmlLink: 'https://www.example.com',
  created: new Date('2023-12-01').toISOString(),
  updated: new Date('2023-12-01').toISOString(),
  summary: 'Summary Example',
  description: 'Description Example',
  location: 'Location Example',
  colorId: '1',
  creator: {
    id: 'creatorIdExample',
    email: 'creator@example.com',
    displayName: 'Creator Example',
    self: true,
  },
  organizer: {
    id: 'organizerIdExample',
    email: 'organizer@example.com',
    displayName: 'Organizer Example',
    self: false,
  },
  start: {
    dateTime: new Date('2023-12-05').toISOString().slice(0, 10),
    timeZone: 'America/Argentina/Buenos_Aires',
  },
  end: {
    dateTime: new Date('2023-12-05').toISOString().slice(0, 10),
    timeZone: 'America/Argentina/Buenos_Aires',
  },
  endTimeUnspecified: false,
  recurrence: ['RRULE:FREQ=DAILY;COUNT=2'],
  recurringEventId: 'recurringEventIdExample',
  originalStartTime: {
    date: new Date().toISOString().slice(0, 10),
    dateTime: new Date().toISOString(),
    timeZone: 'America/Argentina/Buenos_Aires',
  },
  transparency: 'opaque',
  visibility: 'public',
  iCalUID: 'iCalUIDExample',
  sequence: 0,
  attendees: [
    {
      id: 'attendeeIdExample',
      email: 'attendee@example.com',
      displayName: 'Attendee Example',
      organizer: false,
      self: false,
      resource: false,
      optional: false,
      responseStatus: 'accepted',
      comment: 'Comment Example',
      additionalGuests: 0,
    },
  ],
  attendeesOmitted: false,
  extendedProperties: {
    private: {
      keyExample: 'valueExample',
    },
    shared: {
      keyExample: 'valueExample',
    },
  },
  hangoutLink: 'https://hangouts.google.com/hangouts/_/example',
  conferenceData: {
    createRequest: {
      requestId: 'requestIdExample',
      conferenceSolutionKey: {
        type: 'hangoutsMeet',
      },
      status: {
        statusCode: 'success',
      },
    },
    entryPoints: [
      {
        entryPointType: 'video',
        uri: 'https://meet.google.com/abc-defg-hjk',
        label: 'labelExample',
        pin: '123456',
        accessCode: 'accessCodeExample',
        meetingCode: 'meetingCodeExample',
        passcode: 'passcodeExample',
        password: 'passwordExample',
      },
    ],
    conferenceSolution: {
      key: {
        type: 'hangoutsMeet',
      },
      name: 'Google Meet',
      iconUri: 'https://example.com/icon.png',
    },
    conferenceId: 'conferenceIdExample',
    signature: 'signatureExample',
    notes: 'notesExample',
  },
  gadget: {
    type: 'gadgetTypeExample',
    title: 'Gadget Title',
    link: 'https://www.example.com',
    iconLink: 'https://example.com/icon.png',
    width: 300,
    height: 200,
    display: 'chip',
    preferences: {
      keyExample: 'valueExample',
    },
  },
  anyoneCanAddSelf: false,
  guestsCanInviteOthers: true,
  guestsCanModify: false,
  guestsCanSeeOtherGuests: true,
  privateCopy: false,
  locked: false,
  reminders: {
    useDefault: false,
    overrides: [
      {
        method: 'email',
        minutes: 24 * 60,
      },
      {
        method: 'popup',
        minutes: 10,
      },
    ],
  },
  source: {
    url: 'https://www.example.com',
    title: 'Source Title',
  },
  workingLocationProperties: {
    type: 'homeOffice',
    homeOffice: true,
    customLocation: {
      label: 'Custom Location',
    },
    officeLocation: {
      buildingId: 'buildingIdExample',
      floorId: 'floorIdExample',
      floorSectionId: 'floorSectionIdExample',
      deskId: 'deskIdExample',
      label: 'Office Location',
    },
  },
  outOfOfficeProperties: {
    autoDeclineMode: 'autoDeclineModeExample',
    declineMessage: 'Decline Message Example',
  },
  focusTimeProperties: {
    autoDeclineMode: 'autoDeclineModeExample',
    declineMessage: 'Decline Message Example',
    chatStatus: 'chatStatusExample',
  },
  attachments: [
    {
      fileUrl: 'https://example.com/file',
      title: 'File Title',
      mimeType: 'application/pdf',
      iconLink: 'https://example.com/icon.png',
      fileId: 'fileIdExample',
    },
  ],
  eventType: 'default',
};

const mockListEventsResponse = {
  data: {
    kind: 'calendar#events',
    etag: 'etag',
    summary: 'mocked event summary',
    description: 'mocked event description',
    updated: new Date('2023-05-12'),
    timeZone: 'America/Argentina/Buenos_Aires',
    accessRole: 'owner',
    defaultReminders: [
      {
        method: 'email',
        minutes: 10,
      },
      {
        method: 'popup',
        minutes: 15,
      },
    ],
    nextPageToken: 'nextPageTokenExample',
    nextSyncToken: 'nextSyncTokenExample',
    items: [mockEvent],
  },
};

export { mockEvent, mockListEventsResponse };
