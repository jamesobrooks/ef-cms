import { applicationContext } from '../../applicationContext';
import { filterWorkItems } from './formattedWorkQueue';

const {
  DOCKET_SECTION,
  IRS_SYSTEM_SECTION,
  PETITIONS_SECTION,
  STATUS_TYPES: CASE_STATUS_TYPES,
  USER_ROLES: ROLES,
} = applicationContext.getConstants();

const MY_DOCUMENT_QC_IN_PROGRESS = {
  workQueueToDisplay: {
    box: 'inProgress',
    queue: 'my',
  },
};

const SECTION_DOCUMENT_QC_INBOX = {
  workQueueToDisplay: {
    box: 'inbox',
    queue: 'section',
  },
};

const SECTION_DOCUMENT_QC_IN_PROGRESS = {
  workQueueToDisplay: {
    box: 'inProgress',
    queue: 'section',
  },
};

const SECTION_DOCUMENT_QC_OUTBOX = {
  workQueueToDisplay: {
    box: 'outbox',
    queue: 'section',
  },
};

const petitionsClerk1 = {
  role: ROLES.petitionsClerk,
  section: PETITIONS_SECTION,
  userId: 'p1',
};

const petitionsClerk2 = {
  role: ROLES.petitionsClerk,
  section: PETITIONS_SECTION,
  userId: 'p2',
};

const docketClerk1 = {
  role: ROLES.docketClerk,
  section: DOCKET_SECTION,
  userId: 'd1',
};

const docketClerk2 = {
  role: ROLES.docketClerk,
  section: DOCKET_SECTION,
  userId: 'd2',
};

const adc = {
  role: ROLES.adc,
  section: 'adc',
  userId: 'd3',
};

const generateWorkItem = (data, document) => {
  const baseWorkItem = {
    assigneeId: null,
    assigneeName: null,
    caseStatus: CASE_STATUS_TYPES.new,
    createdAt: '2018-12-27T18:05:54.166Z',
    docketNumber: '100-01',
    document: {
      createdAt: '2018-12-27T18:05:54.164Z',
      documentId: '456',
      documentType: 'Answer',
      ...document,
    },
    section: DOCKET_SECTION,
    sentBy: 'respondent',
    updatedAt: '2018-12-27T18:05:54.164Z',
    workItemId: 'abc',
  };

  return { ...baseWorkItem, ...data };
};

describe('filterWorkItems', () => {
  // Petitions
  let workItemPetitionsMyDocumentQCInbox;
  let workItemPetitionsMyDocumentQCServed;
  let workItemPetitionsSectionDocumentQCInbox;
  let workItemPetitionsSectionDocumentQCServed;
  // Docket
  let workItemDocketMyDocumentQCInbox;
  let workItemDocketSectionDocumentQCInbox;
  let workItemDocketMyDocumentQCInProgress;
  let workItemDocketSectionDocumentQCInProgress;

  let workQueueInbox;
  let workQueueInProgress;
  let workQueueOutbox;

  beforeAll(() => {
    applicationContext.getCurrentUser = () => ({
      role: ROLES.docketClerk,
      userId: '7f87f5d1-dfce-4515-a1e4-5231ceac61bb',
    });

    workItemPetitionsMyDocumentQCInbox = generateWorkItem({
      assigneeId: petitionsClerk1.userId,
      docketNumber: '100-05',
      section: PETITIONS_SECTION,
    });

    workItemPetitionsMyDocumentQCServed = generateWorkItem({
      assigneeId: petitionsClerk1.userId,
      caseStatus: CASE_STATUS_TYPES.calendared,
      completedAt: '2019-07-18T18:05:54.166Z',
      completedByUserId: petitionsClerk1.userId,
      docketNumber: '100-07',
      section: IRS_SYSTEM_SECTION,
      sentByUserId: petitionsClerk1.userId,
    });

    workItemPetitionsSectionDocumentQCInbox = generateWorkItem({
      completedAt: null,
      docketNumber: '100-08',
      section: PETITIONS_SECTION,
    });

    workItemPetitionsSectionDocumentQCServed = generateWorkItem({
      assigneeId: petitionsClerk2.userId,
      caseStatus: CASE_STATUS_TYPES.calendared,
      completedAt: '2019-07-18T18:05:54.166Z',
      completedByUserId: petitionsClerk2.userId,
      docketNumber: '100-10',
      section: IRS_SYSTEM_SECTION,
      sentByUserId: petitionsClerk2.userId,
    });

    workItemDocketMyDocumentQCInbox = generateWorkItem({
      assigneeId: docketClerk1.userId,
      completedAt: null,
      docketNumber: '100-15',
      section: DOCKET_SECTION,
    });

    workItemDocketSectionDocumentQCInbox = generateWorkItem({
      completedAt: null,
      docketNumber: '100-17',
      section: DOCKET_SECTION,
    });

    workItemDocketMyDocumentQCInProgress = generateWorkItem(
      {
        assigneeId: docketClerk1.userId,
        completedAt: null,
        docketNumber: '100-18',
        section: DOCKET_SECTION,
      },
      {
        isFileAttached: false,
      },
    );

    workItemDocketSectionDocumentQCInProgress = generateWorkItem(
      {
        assigneeId: docketClerk2.userId,
        completedAt: null,
        docketNumber: '100-19',
        section: DOCKET_SECTION,
      },
      {
        isFileAttached: false,
      },
    );

    workQueueInbox = [
      workItemPetitionsMyDocumentQCInbox,
      workItemPetitionsSectionDocumentQCInbox,
      workItemDocketMyDocumentQCInbox,
      workItemDocketSectionDocumentQCInbox,
    ];

    workQueueInProgress = [
      workItemDocketMyDocumentQCInProgress,
      workItemDocketSectionDocumentQCInProgress,
    ];

    workQueueOutbox = [
      workItemPetitionsMyDocumentQCServed,
      workItemPetitionsSectionDocumentQCServed,
    ];
  });

  // PETITIONS CLERK

  it('Returns section work items for a Petitions Clerk in Section Document QC Inbox', () => {
    const user = petitionsClerk1;
    const filtered = workQueueInbox.filter(
      filterWorkItems({
        applicationContext,
        ...SECTION_DOCUMENT_QC_INBOX,
        user,
      }),
    );
    let assigned = null;
    let unassigned = null;

    filtered.forEach(item => {
      if (item.assigneeId === user.userId) {
        assigned = item.docketNumber;
      } else {
        unassigned = item.docketNumber;
      }
    });
    // Two total items in the section queue
    expect(filtered.length).toEqual(2);
    // One item is assigned to user
    expect(assigned).toEqual(workItemPetitionsMyDocumentQCInbox.docketNumber);
    // One item is assigned to another user
    expect(unassigned).toEqual(
      workItemPetitionsSectionDocumentQCInbox.docketNumber,
    );
  });

  it('Returns sent work items for a Petitions Clerk in Section Document QC Outbox', () => {
    const user = petitionsClerk1;
    const filtered = workQueueOutbox.filter(
      filterWorkItems({
        USER_ROLES: ROLES,
        applicationContext,
        ...SECTION_DOCUMENT_QC_OUTBOX,
        user,
      }),
    );
    let sentByUser = null;
    let sentByOtherUser = null;

    filtered.forEach(item => {
      if (item.sentByUserId === user.userId) {
        sentByUser = item.docketNumber;
      } else {
        sentByOtherUser = item.docketNumber;
      }
    });

    // Two total items in the section queue
    expect(filtered.length).toEqual(2);
    // One item is sent from our user
    expect(sentByUser).toEqual(
      workItemPetitionsMyDocumentQCServed.docketNumber,
    );
    // One item is from another user
    expect(sentByOtherUser).toEqual(
      workItemPetitionsSectionDocumentQCServed.docketNumber,
    );
  });

  // DOCKET CLERK

  it('Returns section work items for a Docket Clerk in Section Document QC Inbox', () => {
    const user = docketClerk1;
    const filtered = workQueueInbox.filter(
      filterWorkItems({
        applicationContext,
        ...SECTION_DOCUMENT_QC_INBOX,
        user,
      }),
    );
    let assigned = null;
    let unassigned = null;

    filtered.forEach(item => {
      if (item.assigneeId === user.userId) {
        assigned = item.docketNumber;
      } else {
        unassigned = item.docketNumber;
      }
    });
    // Two total items in the section queue
    expect(filtered.length).toEqual(2);
    // One item is assigned to user
    expect(assigned).toEqual(workItemDocketMyDocumentQCInbox.docketNumber);
    // One item is assigned to another user
    expect(unassigned).toEqual(
      workItemDocketSectionDocumentQCInbox.docketNumber,
    );
  });

  it('Returns docket section work items for an ADC in Document QC Inbox', () => {
    const user = adc;
    const filtered = workQueueInbox.filter(
      filterWorkItems({
        applicationContext,
        ...SECTION_DOCUMENT_QC_INBOX,
        user,
      }),
    );

    expect(filtered).toMatchObject([
      workItemDocketMyDocumentQCInbox,
      workItemDocketSectionDocumentQCInbox,
    ]);
  });

  it('Returns docket section work items for a Docket Clerk in My Document QC In Progress', () => {
    const user = docketClerk1;
    const filtered = workQueueInProgress.filter(
      filterWorkItems({
        applicationContext,
        ...MY_DOCUMENT_QC_IN_PROGRESS,
        user,
      }),
    );

    expect(filtered).toEqual([workItemDocketMyDocumentQCInProgress]);
  });

  it('Returns docket section work items for a Docket Clerk in Section Document QC In Progress', () => {
    const user = docketClerk1;
    const filtered = workQueueInProgress.filter(
      filterWorkItems({
        applicationContext,
        ...SECTION_DOCUMENT_QC_IN_PROGRESS,
        user,
      }),
    );

    expect(filtered).toEqual([
      workItemDocketMyDocumentQCInProgress,
      workItemDocketSectionDocumentQCInProgress,
    ]);
  });
});
