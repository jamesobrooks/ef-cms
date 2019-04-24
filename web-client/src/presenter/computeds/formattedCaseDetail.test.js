import { runCompute } from 'cerebral/test';

import { formatYearAmounts, formattedCaseDetail } from './formattedCaseDetail';

const constants = {
  DOCUMENT_TYPES_MAP: {
    ownershipDisclosure: 'Ownership Disclosure Statement',
    petitionFile: 'Petition',
  },
};

describe('formatYearAmounts', () => {
  it('does not return 2018 when a blank string is passed in', () => {
    const caseDetail = {
      caseCaption: 'Brett Osborne, Petitioner',
      yearAmounts: [
        {
          amount: '',
          year: '2000',
        },
        {
          amount: '',
          year: '',
        },
      ],
    };
    formatYearAmounts(caseDetail);
    expect(caseDetail.yearAmountsFormatted).toEqual([
      {
        amount: '',
        amountFormatted: '',
        formattedYear: '2000',
        showError: false,
        year: '2000',
      },
      {
        amount: '',
        amountFormatted: '',
        formattedYear: 'Invalid date',
        showError: false,
        year: '',
      },
    ]);
  });

  it('returns the yearAmount that has year 5000 as an error', () => {
    const caseDetail = {
      caseCaption: 'Brett Osborne, Petitioner',
      yearAmounts: [
        {
          amount: '',
          year: '2000',
        },
        {
          amount: '',
          year: '5000-12-24T00:00:00.000Z',
        },
      ],
    };
    const caseDetailErrors = {
      yearAmounts: [{ index: 1, year: 'year can not be in future' }],
    };
    formatYearAmounts(caseDetail, caseDetailErrors);
    expect(caseDetail.yearAmountsFormatted).toEqual([
      {
        amount: '',
        amountFormatted: '',
        formattedYear: '2000',
        showError: false,
        year: '2000',
      },
      {
        amount: '',
        amountFormatted: '',
        errorMessage: 'year can not be in future',
        formattedYear: '5000',
        showError: true,
        year: '5000',
      },
    ]);
  });

  it('returns duplication errors for the second year Amount on duplicates', () => {
    const caseDetail = {
      caseCaption: 'Brett Osborne, Petitioner',
      yearAmounts: [
        {
          amount: '1000',
          year: '2000',
        },
        {
          amount: '1337',
          year: '2000-12-24T00:00:00.000Z',
        },
      ],
    };
    const caseDetailErrors = {
      yearAmounts: 'Duplicate years are bad',
    };
    formatYearAmounts(caseDetail, caseDetailErrors);
    expect(caseDetail.yearAmountsFormatted).toEqual([
      {
        amount: '1000',
        amountFormatted: '1,000',
        formattedYear: '2000',
        showError: false,
        year: '2000',
      },
      {
        amount: '1337',
        amountFormatted: '1,337',
        errorMessage: 'Duplicate years are bad',
        formattedYear: '2000',
        showError: true,
        year: '2000',
      },
    ]);
  });

  it('sets shouldShowIrsNoticeDate to true when hasIrsNotice is true and hasVerifiedIrsNotice is undefined', async () => {
    const caseDetail = {
      caseCaption: 'Brett Osborne, Petitioner',
      hasIrsNotice: true,
      hasVerifiedIrsNotice: undefined,
      petitioners: [{ name: 'bob' }],
    };
    const result = await runCompute(formattedCaseDetail, {
      state: {
        caseDetail,
        caseDetailErrors: {},
        constants,
      },
    });
    expect(result.shouldShowIrsNoticeDate).toBeTruthy();
  });

  it('sets shouldShowIrsNoticeDate and shouldShowYearAmounts to true when hasIrsNotice is true and hasVerifiedIrsNotice is true', async () => {
    const caseDetail = {
      caseCaption: 'Brett Osborne, Petitioner',
      hasIrsNotice: true,
      hasVerifiedIrsNotice: true,
      petitioners: [{ name: 'bob' }],
    };
    const result = await runCompute(formattedCaseDetail, {
      state: {
        caseDetail,
        caseDetailErrors: {},
        constants,
      },
    });
    expect(result.shouldShowIrsNoticeDate).toBeTruthy();
    expect(result.shouldShowYearAmounts).toBeTruthy();
  });

  it('sets shouldShowIrsNoticeDate and shouldShowYearAmounts to false when hasIrsNotice is false and hasVerifiedIrsNotice is undefined', async () => {
    const caseDetail = {
      caseCaption: 'Brett Osborne, Petitioner',
      hasIrsNotice: false,
      hasVerifiedIrsNotice: undefined,
      petitioners: [{ name: 'bob' }],
    };
    const result = await runCompute(formattedCaseDetail, {
      state: {
        caseDetail,
        caseDetailErrors: {},
        constants,
      },
    });
    expect(result.shouldShowIrsNoticeDate).toBeFalsy();
    expect(result.shouldShowYearAmounts).toBeFalsy();
  });

  it('sets shouldShowIrsNoticeDate and shouldShowYearAmounts to false when hasIrsNotice is false and hasVerifiedIrsNotice is false', async () => {
    const caseDetail = {
      caseCaption: 'Brett Osborne, Petitioner',
      hasIrsNotice: false,
      hasVerifiedIrsNotice: false,
      petitioners: [{ name: 'bob' }],
    };
    const result = await runCompute(formattedCaseDetail, {
      state: {
        caseDetail,
        caseDetailErrors: {},
        constants,
      },
    });
    expect(result.shouldShowIrsNoticeDate).toBeFalsy();
    expect(result.shouldShowYearAmounts).toBeFalsy();
  });

  it('maps docket record dates', async () => {
    const caseDetail = {
      caseCaption: 'Brett Osborne, Petitioner',
      docketRecord: [
        {
          description: 'Petition',
          filedBy: 'Jessica Frase Marine',
          filingDate: '2019-02-28T21:14:39.488Z',
        },
      ],
      hasIrsNotice: false,
      hasVerifiedIrsNotice: false,
      petitioners: [{ name: 'bob' }],
    };
    const result = await runCompute(formattedCaseDetail, {
      state: {
        caseDetail,
        caseDetailErrors: {},
        constants,
      },
    });
    expect(result.docketRecord[0].createdAtFormatted).toEqual('02/28/2019');
  });

  it('maps docket record documents', async () => {
    const caseDetail = {
      caseCaption: 'Brett Osborne, Petitioner',
      docketRecord: [
        {
          description: 'Petition',
          documentId: 'Petition',
          filedBy: 'Jessica Frase Marine',
          filingDate: '2019-02-28T21:14:39.488Z',
        },
      ],
      documents: [
        {
          createdAt: '2019-02-28T21:14:39.488Z',
          documentId: 'Petition',
          documentType: 'Petition',
          showValidationInput: '2019-02-28T21:14:39.488Z',
          status: 'served',
        },
      ],
      hasIrsNotice: false,
      hasVerifiedIrsNotice: false,
      petitioners: [{ name: 'bob' }],
    };
    const result = await runCompute(formattedCaseDetail, {
      state: {
        caseDetail,
        caseDetailErrors: {},
        constants,
      },
    });
    expect(result.docketRecordWithDocument[0].document.documentId).toEqual(
      'Petition',
    );
  });

  it('sorts the docket record in the expected order', async () => {
    const caseDetail = {
      caseCaption: 'Brett Osborne, Petitioner',
      docketRecord: [
        {
          description: 'Petition',
          documentId: 'Petition',
          filedBy: 'Jessica Frase Marine',
          filingDate: '2019-10-28T21:14:39.488Z',
        },
        {
          description: 'Request for Place of Trial',
          documentId: null,
          filedBy: 'Jessica Frase Marine',
          filingDate: '2019-01-28T21:14:39.488Z',
        },
        {
          description: 'Ownership Disclosure Statement',
          documentId: 'Ownership Disclosure Statement',
          filedBy: 'Jessica Frase Marine',
          filingDate: '2019-03-28T21:14:39.488Z',
        },
        {
          description: 'Other',
          documentId: 'Other',
          filedBy: 'Jessica Frase Marine',
          filingDate: '2019-01-01T21:14:39.488Z',
        },
      ],
      documents: [
        {
          createdAt: '2019-02-28T21:14:39.488Z',
          documentId: 'Petition',
          documentType: 'Petition',
          showValidationInput: '2019-02-28T21:14:39.488Z',
          status: 'served',
        },
        {
          createdAt: '2019-03-28T21:14:39.488Z',
          documentId: 'Ownership Disclosure Statement',
          documentType: 'Ownership Disclosure Statement',
          showValidationInput: '2019-03-28T21:14:39.488Z',
          status: 'served',
        },
        {
          createdAt: '2019-01-01T21:14:39.488Z',
          documentId: 'Other',
          documentType: 'Other',
          showValidationInput: '2019-01-01T21:14:39.488Z',
          status: 'served',
        },
      ],
      hasIrsNotice: false,
      hasVerifiedIrsNotice: false,
      petitioners: [{ name: 'bob' }],
    };
    const result = await runCompute(formattedCaseDetail, {
      state: {
        caseDetail,
        caseDetailErrors: {},
        constants,
      },
    });
    expect(result.docketRecordWithDocument[0]).toMatchObject({
      document: {
        documentType: 'Petition',
      },
    });
    expect(result.docketRecordWithDocument[1]).toMatchObject({
      record: {
        description: 'Request for Place of Trial',
      },
    });
    expect(result.docketRecordWithDocument[2]).toMatchObject({
      document: {
        documentType: 'Ownership Disclosure Statement',
      },
    });
    expect(result.docketRecordWithDocument[3]).toMatchObject({
      document: {
        documentType: 'Other',
      },
    });
  });

  describe('case name mapping', () => {
    it("should remove ', Petitioner' from caseCaption", async () => {
      const caseDetail = {
        caseCaption: 'Sisqo, Petitioner',
        petitioners: [{ name: 'bob' }],
      };
      const result = await runCompute(formattedCaseDetail, {
        state: {
          caseDetail,
          caseDetailErrors: {},
          constants,
        },
      });
      expect(result.caseName).toEqual('Sisqo');
    });

    it("should remove ', Petitioners' from caseCaption", async () => {
      const caseDetail = {
        caseCaption: 'Sisqo and friends,  Petitioners ',
        petitioners: [{ name: 'bob' }],
      };
      const result = await runCompute(formattedCaseDetail, {
        state: {
          caseDetail,
          caseDetailErrors: {},
          constants,
        },
      });
      expect(result.caseName).toEqual('Sisqo and friends');
    });

    it("should remove ', Petitioner(s)' from caseCaption", async () => {
      const caseDetail = {
        caseCaption: "Sisqo's entourage,,    Petitioner(s)    ",
        petitioners: [{ name: 'bob' }],
      };
      const result = await runCompute(formattedCaseDetail, {
        state: {
          caseDetail,
          caseDetailErrors: {},
          constants,
        },
      });
      expect(result.caseName).toEqual("Sisqo's entourage,");
    });
  });

  describe('practitioner mapping', () => {
    it('should add barnumber into formatted name if available', async () => {
      const caseDetail = {
        caseCaption: 'Sisqo, Petitioner',
        petitioners: [{ name: 'bob' }],
        practitioner: { barNumber: '9999', name: 'Jackie Chan' },
      };
      const result = await runCompute(formattedCaseDetail, {
        state: {
          caseDetail,
          caseDetailErrors: {},
          constants,
        },
      });
      expect(result.practitioner.formattedName).toEqual('Jackie Chan (9999)');
    });
    it('should not add barnumber into formatted name if not available', async () => {
      const caseDetail = {
        caseCaption: 'Sisqo, Petitioner',
        petitioners: [{ name: 'bob' }],
        practitioner: { name: 'Jackie Chan' },
      };
      const result = await runCompute(formattedCaseDetail, {
        state: {
          caseDetail,
          caseDetailErrors: {},
          constants,
        },
      });
      expect(result.practitioner.formattedName).toEqual('Jackie Chan');
    });
  });
});