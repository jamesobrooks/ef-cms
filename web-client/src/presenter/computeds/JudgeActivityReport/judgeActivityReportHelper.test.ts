import {
  CASE_STATUS_TYPES,
  SESSION_TYPES,
} from '../../../../../shared/src/business/entities/EntityConstants';
import { applicationContextForClient as applicationContext } from '../../../../../shared/src/business/test/createTestApplicationContext';
import { judgeActivityReportHelper as judgeActivityReportHelperComputed } from './judgeActivityReportHelper';
import { judgeUser } from '../../../../../shared/src/test/mockUsers';
import { runCompute } from 'cerebral/test';
import { withAppContextDecorator } from '../../../withAppContext';

describe('judgeActivityReportHelper', () => {
  let mockJudgeActivityReport;
  let mockForm;
  let baseState;

  const judgeActivityReportHelper = withAppContextDecorator(
    judgeActivityReportHelperComputed,
    { ...applicationContext },
  );

  beforeEach(() => {
    mockJudgeActivityReport = {
      casesClosedByJudge: {
        [CASE_STATUS_TYPES.closed]: 1,
        [CASE_STATUS_TYPES.closedDismissed]: 5,
      },
      opinions: [
        {
          count: 1,
          documentType: 'Memorandum Opinion',
          eventCode: 'MOP',
        },
        {
          count: 0,
          documentType: 'S Opinion',
          eventCode: 'SOP',
        },
        {
          count: 0,
          documentType: 'TC Opinion',
          eventCode: 'TCOP',
        },
        {
          count: 4,
          documentType: 'Bench Opinion',
          eventCode: 'OST',
        },
      ],
      orders: [
        {
          count: 1,
          documentType: 'Order',
          eventCode: 'O',
        },
        {
          count: 5,
          documentType: 'Order for Dismissal',
          eventCode: 'ODS',
        },
      ],
      trialSessions: {
        [SESSION_TYPES.regular]: 1,
        [SESSION_TYPES.hybrid]: 0.5,
        [SESSION_TYPES.motionHearing]: 1.5,
      },
    };

    mockForm = {
      judgeName: judgeUser.name,
    };

    baseState = {
      form: mockForm,
      judgeActivityReportData: mockJudgeActivityReport,
    };
  });

  describe('closedCasesTotal', () => {
    it('should be the sum of the values of cases closed off state.judgeActivityReportData', () => {
      const { closedCasesTotal } = runCompute(judgeActivityReportHelper, {
        state: baseState,
      });

      expect(closedCasesTotal).toBe(6);
    });
  });

  describe('isFormPristine', () => {
    it('should be true when startDate is not populated', () => {
      const { isFormPristine } = runCompute(judgeActivityReportHelper, {
        state: {
          ...baseState,
          form: {
            ...mockForm,
            endDate: '01/02/2020',
            startDate: undefined,
          },
        },
      });

      expect(isFormPristine).toBe(true);
    });

    it('should be true when endDate is not populated', () => {
      const { isFormPristine } = runCompute(judgeActivityReportHelper, {
        state: {
          ...baseState,
          form: {
            ...mockForm,
            endDate: undefined,
            startDate: '01/02/2020',
          },
        },
      });

      expect(isFormPristine).toBe(true);
    });

    it('should be false when both startDate and endDate are populated', () => {
      const { isFormPristine } = runCompute(judgeActivityReportHelper, {
        state: {
          ...baseState,
          form: {
            ...mockForm,
            endDate: '01/02/2020',
            startDate: '01/02/2020',
          },
        },
      });

      expect(isFormPristine).toBe(false);
    });
  });

  describe('opinionsFiledTotal', () => {
    it('should be the sum of the values of opinions filed off state.judgeActivityReportData', () => {
      const { opinionsFiledTotal } = runCompute(judgeActivityReportHelper, {
        state: baseState,
      });

      expect(opinionsFiledTotal).toBe(5);
    });
  });

  describe('ordersFiledTotal', () => {
    it('should be the sum of the values of orders filed off state.judgeActivityReportData', () => {
      const { ordersFiledTotal } = runCompute(judgeActivityReportHelper, {
        state: baseState,
      });

      expect(ordersFiledTotal).toBe(6);
    });
  });

  describe('reportHeader', () => {
    it('should return reportHeader that includes judge name and the currentDate in MMDDYY format', () => {
      applicationContext
        .getUtilities()
        .prepareDateFromString.mockReturnValue('2020-01-01');

      const { reportHeader } = runCompute(judgeActivityReportHelper, {
        state: baseState,
      });

      expect(reportHeader).toBe(`${judgeUser.name} 01/01/20`);
    });
  });

  describe('showResultsTables', () => {
    it('should false when there are no orders, opinions, trial sessions and cases for the specified judge', () => {
      const { showResultsTables } = runCompute(judgeActivityReportHelper, {
        state: {
          form: mockForm,
          judgeActivityReportData: {},
        },
      });

      expect(showResultsTables).toBe(false);
    });

    it('should true when there are orders, opinions, trial sessions or cases for the specified judge', () => {
      const { showResultsTables } = runCompute(judgeActivityReportHelper, {
        state: baseState,
      });

      expect(showResultsTables).toBe(true);
    });
  });

  describe('showSelectDateRangeText', () => {
    it('should be false when the form has been submitted (there are orders, opinions, trial sessions and cases for the specified judge)', () => {
      const { showSelectDateRangeText } = runCompute(
        judgeActivityReportHelper,
        {
          state: baseState,
        },
      );

      expect(showSelectDateRangeText).toBe(false);
    });

    it('should true when form has NOT been submitted (there are orders, opinions, trial sessions or cases for the specified judge)', () => {
      const { showSelectDateRangeText } = runCompute(
        judgeActivityReportHelper,
        {
          state: {
            form: mockForm,
            judgeActivityReportData: {},
          },
        },
      );

      expect(showSelectDateRangeText).toBe(true);
    });
  });

  describe('trialSessionsHeldTotal', () => {
    it('should be the sum of the values of trialSessions off state.judgeActivityReportData', () => {
      const { trialSessionsHeldTotal } = runCompute(judgeActivityReportHelper, {
        state: baseState,
      });

      expect(trialSessionsHeldTotal).toBe(3);
    });
  });
});
