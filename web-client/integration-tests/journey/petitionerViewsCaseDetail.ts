import { applicationContextForClient as applicationContext } from '../../../shared/src/business/test/createTestApplicationContext';
import { formattedCaseDetail } from '../../src/presenter/computeds/formattedCaseDetail';
import { getFormattedDocketEntriesForTest } from '../helpers';
import { runCompute } from 'cerebral/test';
import { withAppContextDecorator } from '../../src/withAppContext';

const { DOCKET_NUMBER_SUFFIXES } = applicationContext.getConstants();

export const petitionerViewsCaseDetail = (cerebralTest, overrides = {}) => {
  return it('petitioner views case detail', async () => {
    const { formattedDocketEntriesOnDocketRecord } =
      await getFormattedDocketEntriesForTest(cerebralTest);

    const documentCount = overrides.documentCount || 2;
    const docketNumberSuffix =
      overrides.docketNumberSuffix || DOCKET_NUMBER_SUFFIXES.WHISTLEBLOWER;

    const caseDetail = cerebralTest.getState('caseDetail');
    const caseDetailFormatted = runCompute(
      withAppContextDecorator(formattedCaseDetail),
      {
        state: cerebralTest.getState(),
      },
    );

    expect(cerebralTest.getState('currentPage')).toEqual('CaseDetail');
    expect(caseDetail.docketNumber).toEqual(cerebralTest.docketNumber);
    expect(caseDetail.docketNumberSuffix).toEqual(docketNumberSuffix);
    expect(caseDetailFormatted.docketNumberWithSuffix).toEqual(
      `${cerebralTest.docketNumber}${docketNumberSuffix}`,
    );
    expect(caseDetail.docketEntries.length).toEqual(documentCount);

    //verify that event codes were added to initial documents/docket entries
    expect(formattedDocketEntriesOnDocketRecord).toEqual(
      expect.arrayContaining([expect.objectContaining({ eventCode: 'P' })]),
    );

    const rqtDocument = formattedDocketEntriesOnDocketRecord.find(
      entry => entry.eventCode === 'RQT',
    );
    expect(rqtDocument).toBeTruthy();

    expect(caseDetail.preferredTrialCity).toEqual('Seattle, Washington');

    expect(caseDetail.associatedJudge).toBeUndefined();
    expect(caseDetail.blocked).toBeUndefined();
    expect(caseDetail.blockedDate).toBeUndefined();
    expect(caseDetail.blockedReason).toBeUndefined();
    expect(caseDetail.caseNote).toBeUndefined();
    expect(caseDetail.highPriority).toBeUndefined();
    expect(caseDetail.highPriorityReason).toBeUndefined();
    expect(caseDetail.qcCompleteForTrial).toBeUndefined();
  });
};
