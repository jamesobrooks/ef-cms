import {
  CHIEF_JUDGE,
  PETITIONS_SECTION,
  ROLES,
} from '../entities/EntityConstants';
import { applicationContext } from '../test/createTestApplicationContext';
import { caseServicesSupervisorUser } from '../../test/mockUsers';
import { getNotificationsInteractor } from './getNotificationsInteractor';

const workItems = [
  {
    associatedJudge: 'Judge Barker',
    caseIsInProgress: false,
    docketEntry: {
      isFileAttached: true,
    },
    isRead: true,
    section: 'docket',
  },
  {
    associatedJudge: 'Judge Carey',
    caseIsInProgress: false,
    docketEntry: {
      isFileAttached: true,
    },
    isRead: true,
    section: 'docket',
  },
  {
    associatedJudge: CHIEF_JUDGE,
    caseIsInProgress: false,
    docketEntry: {
      isFileAttached: true,
    },
    isRead: true,
    section: 'petitions',
  },
  {
    associatedJudge: 'Judge Barker',
    caseIsInProgress: false,
    docketEntry: {
      isFileAttached: true,
    },
    isRead: true,
    section: 'docket',
  },
  {
    associatedJudge: 'Judge Barker',
    caseIsInProgress: true,
    docketEntry: {
      isFileAttached: false,
    },
    inProgress: true,
    isRead: true,
    section: 'docket',
  },
  {
    associatedJudge: 'Judge Barker',
    caseIsInProgress: false,
    docketEntry: {
      isFileAttached: false,
    },
    isRead: true,
    section: 'petitions',
  },
];

describe('getNotificationsInteractor', () => {
  beforeEach(() => {
    applicationContext
      .getPersistenceGateway()
      .getUserInboxMessages.mockReturnValue([
        {
          isRead: true,
          messageId: 'message-id-1',
        },
      ]);

    applicationContext
      .getPersistenceGateway()
      .getSectionInboxMessages.mockReturnValue([
        {
          messageId: 'message-id-1',
        },
        {
          messageId: 'message-id-2',
        },
      ]);

    applicationContext
      .getPersistenceGateway()
      .getDocumentQCInboxForSection.mockReturnValue(workItems);

    applicationContext
      .getPersistenceGateway()
      .getDocumentQCInboxForUser.mockReturnValue([
        ...workItems,
        { ...workItems[0], isRead: false },
      ]);

    applicationContext
      .getPersistenceGateway()
      .getUserById.mockImplementation(({ userId }) => {
        if (userId === 'e8577e31-d6d5-4c4a-adc6-520075f3dde5') {
          return {
            role: ROLES.docketClerk,
            section: 'docket',
            userId: 'e8577e31-d6d5-4c4a-adc6-520075f3dde5',
          };
        } else if (userId === 'ff377e31-d6d5-4c4a-adc6-520075f3dde5') {
          return {
            role: ROLES.petitioner,
            userId: 'ff377e31-d6d5-4c4a-adc6-520075f3dde5',
          };
        } else if (userId === 'ee577e31-d6d5-4c4a-adc6-520075f3dde5') {
          return {
            name: 'Some Judge',
            role: ROLES.judge,
            section: 'someChambers',
            userId: 'ee577e31-d6d5-4c4a-adc6-520075f3dde5',
          };
        } else if (userId === '79f21a87-810c-4440-9189-bb6bfea413fd') {
          return {
            name: 'ADC',
            role: ROLES.adc,
            section: 'adc',
            userId: '79f21a87-810c-4440-9189-bb6bfea413fd',
          };
        }
      });

    applicationContext.getCurrentUser.mockReturnValue({
      role: ROLES.docketClerk,
      userId: 'e8577e31-d6d5-4c4a-adc6-520075f3dde5',
    });
  });

  it('returns an unread count for my messages', async () => {
    applicationContext
      .getPersistenceGateway()
      .getDocumentQCInboxForUser.mockReturnValue([
        {
          assigneeId: 'e8577e31-d6d5-4c4a-adc6-520075f3dde5',
          caseIsInProgress: false,
          docketEntry: { isFileAttached: true },
          isRead: true,
          section: 'docket',
        },
      ]);

    const result = await getNotificationsInteractor(
      applicationContext,
      {} as any,
    );
    expect(result).toEqual({
      qcIndividualInProgressCount: 0,
      qcIndividualInboxCount: 1,
      qcSectionInProgressCount: 1,
      qcSectionInboxCount: 3,
      qcUnreadCount: 0,
      unreadMessageCount: 0,
      userInboxCount: 1,
      userSectionCount: 2,
    });
  });

  it('returns the total user inbox count', async () => {
    const result = await await getNotificationsInteractor(
      applicationContext,
      {} as any,
    );

    expect(result.userInboxCount).toEqual(1);
  });

  it('returns the total section messages count', async () => {
    const result = await await getNotificationsInteractor(
      applicationContext,
      {} as any,
    );

    expect(result.userSectionCount).toEqual(2);
  });

  it('returns an accurate unread count for legacy items marked complete', async () => {
    const result = await getNotificationsInteractor(
      applicationContext,
      {} as any,
    );

    expect(result.qcUnreadCount).toEqual(1);
  });

  it('returns the qcIndividualInProgressCount for qc individual items with caseIsInProgress true, isFileAttached true and a judgeUserId supplied', async () => {
    applicationContext
      .getPersistenceGateway()
      .getDocumentQCInboxForUser.mockReturnValue([
        {
          assigneeId: 'e8577e31-d6d5-4c4a-adc6-520075f3dde5',
          associatedJudge: 'Judge Barker',
          caseIsInProgress: true,
          docketEntry: {
            isFileAttached: true,
          },
          inProgress: true,
          isRead: true,
          section: 'docket',
        },
        {
          assigneeId: 'e8577e31-d6d5-4c4a-adc6-520075f3dde5',
          associatedJudge: 'Some Judge',
          caseIsInProgress: true,
          docketEntry: {
            isFileAttached: true,
          },
          inProgress: false,
          isRead: true,
          section: 'docket',
        },
        {
          assigneeId: 'e8577e31-d6d5-4c4a-adc6-520075f3dde5',
          associatedJudge: 'Some Judge',
          caseIsInProgress: false,
          docketEntry: {
            isFileAttached: true,
          },
          inProgress: false,
          isRead: true,
          section: 'docket',
        },
      ]);

    const result = await getNotificationsInteractor(applicationContext, {
      caseServicesSupervisorData: undefined,
      judgeUserId: 'ee577e31-d6d5-4c4a-adc6-520075f3dde5',
    });

    expect(result.qcIndividualInProgressCount).toEqual(1);
  });

  it('returns the qcIndividualInboxCount for qc individual items with caseIsInProgress false, isFileAttached true and a judgeUserId supplied', async () => {
    applicationContext
      .getPersistenceGateway()
      .getDocumentQCInboxForUser.mockReturnValue([
        {
          assigneeId: 'e8577e31-d6d5-4c4a-adc6-520075f3dde5',
          associatedJudge: 'Judge Barker',
          caseIsInProgress: false,
          docketEntry: {
            isFileAttached: true,
          },
          inProgress: false,
          isRead: true,
          section: 'docket',
        },
        {
          assigneeId: 'e8577e31-d6d5-4c4a-adc6-520075f3dde5',
          associatedJudge: 'Some Judge',
          caseIsInProgress: false,
          docketEntry: {
            isFileAttached: false,
          },
          inProgress: false,
          isRead: true,
          section: 'docket',
        },
        {
          assigneeId: 'e8577e31-d6d5-4c4a-adc6-520075f3dde5',
          associatedJudge: 'Some Judge',
          caseIsInProgress: true,
          docketEntry: {
            isFileAttached: true,
          },
          inProgress: true,
          isRead: true,
          section: 'docket',
        },
      ]);

    const result = await getNotificationsInteractor(applicationContext, {
      caseServicesSupervisorData: undefined,
      judgeUserId: 'ee577e31-d6d5-4c4a-adc6-520075f3dde5',
    });

    expect(result.qcIndividualInboxCount).toEqual(1);
  });

  it('returns the qcSectionInProgressCount for qc section items with caseIsInProgress true, isFileAttached true and a judgeUserId supplied', async () => {
    applicationContext
      .getPersistenceGateway()
      .getDocumentQCInboxForSection.mockReturnValue([
        {
          associatedJudge: 'Judge Barker',
          caseIsInProgress: false,
          docketEntry: {
            isFileAttached: true,
          },
          inProgress: false,
          isRead: true,
          section: 'docket',
        },
        {
          associatedJudge: 'Judge Barker',
          caseIsInProgress: true,
          docketEntry: {
            isFileAttached: true,
          },
          inProgress: true,
          isRead: true,
          section: 'petitions',
        },
        {
          associatedJudge: 'Some Judge',
          caseIsInProgress: false,
          docketEntry: {
            isFileAttached: true,
          },
          inProgress: false,
          isRead: true,
          section: 'docket',
        },
        {
          assigneeId: 'e8577e31-d6d5-4c4a-adc6-520075f3dde5',
          associatedJudge: 'Some Judge',
          caseIsInProgress: true,
          docketEntry: {
            isFileAttached: true,
          },
          inProgress: true,
          isRead: true,
          section: 'docket',
        },
        {
          associatedJudge: 'Some Judge',
          caseIsInProgress: true,
          docketEntry: {
            isFileAttached: true,
          },
          inProgress: true,
          isRead: true,
          section: 'docket',
        },
      ]);

    const result = await getNotificationsInteractor(applicationContext, {
      caseServicesSupervisorData: undefined,
      judgeUserId: 'ee577e31-d6d5-4c4a-adc6-520075f3dde5',
    });

    expect(result.qcSectionInProgressCount).toEqual(2);
  });

  it('returns the qcSectionInboxCount for qc section items with caseIsInProgress true, isFileAttached true and a judgeUserId supplied', async () => {
    applicationContext
      .getPersistenceGateway()
      .getDocumentQCInboxForSection.mockReturnValue([
        {
          associatedJudge: 'Judge Barker',
          caseIsInProgress: false,
          docketEntry: {
            isFileAttached: true,
          },
          inProgress: false,
          isRead: true,
          section: 'docket',
        },
        {
          associatedJudge: 'Judge Barker',
          caseIsInProgress: true,
          docketEntry: {
            isFileAttached: true,
          },
          inProgress: true,
          isRead: true,
          section: 'petitions',
        },
      ]);

    const result = await getNotificationsInteractor(applicationContext, {
      caseServicesSupervisorData: undefined,
      judgeUserId: 'ee577e31-d6d5-4c4a-adc6-520075f3dde5',
    });

    expect(result.qcSectionInboxCount).toEqual(1);
  });

  it('returns an accurate unread count for my messages', async () => {
    applicationContext
      .getPersistenceGateway()
      .getUserInboxMessages.mockReturnValue([
        {
          isRead: false,
          messageId: 'message-id-1',
        },
        {
          isRead: true,
          messageId: 'message-id-2',
        },
      ]);

    const result = await getNotificationsInteractor(applicationContext, {
      caseServicesSupervisorData: undefined,
      judgeUserId: 'docketclerk',
    });

    expect(result).toMatchObject({
      userInboxCount: 2,
    });
  });

  it('should fetch the qc section items for the provided judgeUserId', async () => {
    await getNotificationsInteractor(applicationContext, {
      caseServicesSupervisorData: undefined,
      judgeUserId: 'ee577e31-d6d5-4c4a-adc6-520075f3dde5',
    });

    expect(
      applicationContext.getPersistenceGateway().getDocumentQCInboxForSection
        .mock.calls[0][0],
    ).toMatchObject({
      judgeUserName: 'Some Judge',
    });
  });

  it('should fetch the qc section items without a judgeName when a judgeUserId is not provided', async () => {
    await getNotificationsInteractor(applicationContext, {} as any);

    expect(
      applicationContext.getPersistenceGateway().getDocumentQCInboxForSection
        .mock.calls[0][0],
    ).toMatchObject({
      judgeUserName: null,
    });
  });

  it('should fetch the qc section items with judgeName of CHIEF_JUDGE when a judgeUserId is not provided and the user role is adc', async () => {
    applicationContext.getCurrentUser.mockReturnValue({
      role: ROLES.adc,
      userId: '79f21a87-810c-4440-9189-bb6bfea413fd',
    });

    await getNotificationsInteractor(applicationContext, {} as any);

    expect(
      applicationContext.getPersistenceGateway().getDocumentQCInboxForSection
        .mock.calls[0][0],
    ).toMatchObject({
      judgeUserName: CHIEF_JUDGE,
    });
  });

  it('should fetch messages for the selected section when caseServicesSupervisorData is not empty', async () => {
    applicationContext.getCurrentUser.mockReturnValue({
      role: ROLES.adc,
      userId: '79f21a87-810c-4440-9189-bb6bfea413fd',
    });

    await getNotificationsInteractor(applicationContext, {
      caseServicesSupervisorData: {
        section: PETITIONS_SECTION,
        userId: caseServicesSupervisorUser.userId,
      },
      judgeUserId: undefined,
    });

    expect(
      applicationContext.getPersistenceGateway().getUserInboxMessages.mock
        .calls[0][0].userId,
    ).toEqual(caseServicesSupervisorUser.userId);
    expect(
      applicationContext.getPersistenceGateway().getSectionInboxMessages.mock
        .calls[0][0].section,
    ).toEqual(PETITIONS_SECTION);
  });

  it('should fetch the filtered document QC inbox for the selected section when caseServicesSupervisorData is not empty', async () => {
    applicationContext.getCurrentUser.mockReturnValue({
      role: ROLES.adc,
      userId: '79f21a87-810c-4440-9189-bb6bfea413fd',
    });

    const mockcaseServicesSupervisorData = {
      section: PETITIONS_SECTION,
      userId: caseServicesSupervisorUser.userId,
    };

    const filteredWorkItem = {
      associatedJudge: 'Judge Barker',
      caseIsInProgress: false,
      docketEntry: {
        isFileAttached: true,
      },
      inProgress: false,
      isRead: true,
      section: 'petitions',
    };

    applicationContext
      .getPersistenceGateway()
      .getDocumentQCInboxForSection.mockReturnValue([filteredWorkItem]);

    const result = await getNotificationsInteractor(applicationContext, {
      caseServicesSupervisorData: mockcaseServicesSupervisorData,
      judgeUserId: undefined,
    });

    expect(
      applicationContext.getPersistenceGateway().getDocumentQCInboxForSection
        .mock.calls[0][0].section,
    ).toEqual(mockcaseServicesSupervisorData.section);

    expect(result.qcSectionInboxCount).toEqual(1);
  });
});
