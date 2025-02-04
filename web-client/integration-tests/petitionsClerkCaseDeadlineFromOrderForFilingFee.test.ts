import {
  DOCUMENT_SERVED_MESSAGES,
  PAYMENT_STATUS,
  SYSTEM_GENERATED_DOCUMENT_TYPES,
} from '../../shared/src/business/entities/EntityConstants';
import { docketClerkGetsDocketEntryByEventCode } from './journey/docketClerkGetsDocketEntryByEventCode';
import { docketClerkServesASavedCourtIssuedDocumentFromDocumentView } from './journey/docketClerkServesASavedCourtIssuedDocumentFromDocumentView';
import { docketClerkSignsOrder } from './journey/docketClerkSignsOrder';
import { docketClerkViewsAutoGeneratedCaseDeadline } from './journey/docketClerkViewsAutoGeneratedCaseDeadline';
import { fakeFile, loginAs, setupTest, waitForCondition } from './helpers';
import { petitionsClerkCreatesNewCaseFromPaper } from './journey/petitionsClerkCreatesNewCaseFromPaper';
import { petitionsClerkReviewsPaperCaseBeforeServing } from './journey/petitionsClerkReviewsPaperCaseBeforeServing';
import { petitionsClerkServesPaperCaseToIRS } from './petitionsClerkServesPaperCaseToIRS';

describe('Autogenerate Deadline when order for filing fee is served', () => {
  const cerebralTest = setupTest();

  cerebralTest.draftOrders = [];

  beforeAll(() => {
    jest.setTimeout(40000);
  });

  afterAll(() => {
    cerebralTest.closeSocket();
  });

  describe('Create and serve docket entry immediately', () => {
    loginAs(cerebralTest, 'petitionsclerk@example.com');

    petitionsClerkCreatesNewCaseFromPaper(cerebralTest, fakeFile, {
      paymentStatus: PAYMENT_STATUS.UNPAID,
    });

    petitionsClerkReviewsPaperCaseBeforeServing(cerebralTest, {
      hasIrsNoticeFormatted: 'No',
      ordersAndNoticesInDraft: [
        'Order Designating Place of Trial',
        'Order for Filing Fee',
      ],
      ordersAndNoticesNeeded: ['Order for Ratification of Petition'],
      petitionPaymentStatusFormatted: PAYMENT_STATUS.UNPAID,
      receivedAtFormatted: '01/01/01',
      shouldShowIrsNoticeDate: false,
    });

    petitionsClerkServesPaperCaseToIRS(cerebralTest);

    loginAs(cerebralTest, 'docketclerk@example.com');

    docketClerkGetsDocketEntryByEventCode(
      cerebralTest,
      SYSTEM_GENERATED_DOCUMENT_TYPES.orderForFilingFee.eventCode,
    );

    docketClerkSignsOrder(cerebralTest);

    it('docket clerk adds a docket entry for order for filing fee and serves it', async () => {
      await cerebralTest.runSequence('gotoAddCourtIssuedDocketEntrySequence', {
        docketEntryId: cerebralTest.docketEntryId,
        docketNumber: cerebralTest.docketNumber,
      });

      const docketEntryFormData = {
        day: '2',
        month: '2',
        year: '2050',
      };

      for (const [key, value] of Object.entries(docketEntryFormData)) {
        await cerebralTest.runSequence(
          'updateCourtIssuedDocketEntryFormValueSequence',
          {
            key,
            value,
          },
        );
      }

      await cerebralTest.runSequence(
        'fileAndServeCourtIssuedDocumentFromDocketEntrySequence',
      );

      await waitForCondition({
        booleanExpressionCondition: () =>
          cerebralTest.getState('currentPage') === 'PrintPaperService',
      });

      expect(cerebralTest.getState('validationErrors')).toEqual({});
      expect(cerebralTest.getState('currentPage')).toEqual('PrintPaperService');
      expect(cerebralTest.getState('alertSuccess').message).toEqual(
        DOCUMENT_SERVED_MESSAGES.GENERIC,
      );
    });

    docketClerkViewsAutoGeneratedCaseDeadline({
      cerebralTest,
      expectedDeadlineDescription:
        SYSTEM_GENERATED_DOCUMENT_TYPES.orderForFilingFee.deadlineDescription,
    });
  });

  describe('Create docket entry, save for later, then serve', () => {
    loginAs(cerebralTest, 'petitionsclerk@example.com');

    petitionsClerkCreatesNewCaseFromPaper(cerebralTest, fakeFile, {
      paymentStatus: PAYMENT_STATUS.UNPAID,
    });

    petitionsClerkReviewsPaperCaseBeforeServing(cerebralTest, {
      hasIrsNoticeFormatted: 'No',
      ordersAndNoticesInDraft: [
        'Order Designating Place of Trial',
        'Order for Filing Fee',
      ],
      ordersAndNoticesNeeded: ['Order for Ratification of Petition'],
      petitionPaymentStatusFormatted: PAYMENT_STATUS.UNPAID,
      receivedAtFormatted: '01/01/01',
      shouldShowIrsNoticeDate: false,
    });

    petitionsClerkServesPaperCaseToIRS(cerebralTest);

    loginAs(cerebralTest, 'docketclerk@example.com');

    docketClerkGetsDocketEntryByEventCode(
      cerebralTest,
      SYSTEM_GENERATED_DOCUMENT_TYPES.orderForFilingFee.eventCode,
    );

    docketClerkSignsOrder(cerebralTest);

    it('docket clerk adds a docket entry for order for filing fee and saves it', async () => {
      await cerebralTest.runSequence('gotoAddCourtIssuedDocketEntrySequence', {
        docketEntryId: cerebralTest.docketEntryId,
        docketNumber: cerebralTest.docketNumber,
      });

      const docketEntryFormData = {
        day: '2',
        month: '2',
        year: '2050',
      };

      for (const [key, value] of Object.entries(docketEntryFormData)) {
        await cerebralTest.runSequence(
          'updateCourtIssuedDocketEntryFormValueSequence',
          {
            key,
            value,
          },
        );
      }

      await cerebralTest.runSequence('submitCourtIssuedDocketEntrySequence');

      await waitForCondition({
        booleanExpressionCondition: () =>
          cerebralTest.getState('currentPage') === 'CaseDetailInternal',
      });

      expect(cerebralTest.getState('validationErrors')).toEqual({});
      expect(cerebralTest.getState('currentPage')).toEqual(
        'CaseDetailInternal',
      );
      expect(cerebralTest.getState('alertSuccess').message).toEqual(
        'Your entry has been added to the docket record.',
      );
    });

    docketClerkServesASavedCourtIssuedDocumentFromDocumentView(cerebralTest);

    docketClerkViewsAutoGeneratedCaseDeadline({
      cerebralTest,
      expectedDeadlineDescription:
        SYSTEM_GENERATED_DOCUMENT_TYPES.orderForFilingFee.deadlineDescription,
    });
  });
});
