import { MOCK_CASE } from '../../../test/mockCase';
import { ROLES } from '../../entities/EntityConstants';
import { applicationContext } from '../../test/createTestApplicationContext';
import { removeConsolidatedCasesInteractor } from './removeConsolidatedCasesInteractor';

let mockCases;
const allDocketNumbers = ['101-19', '102-19', '103-19', '104-19', '105-19'];

describe('removeConsolidatedCasesInteractor', () => {
  beforeEach(() => {
    mockCases = {
      '101-19': {
        ...MOCK_CASE,
        createdAt: '2019-03-19T17:29:13.120Z',
        docketNumber: '101-19',
        leadDocketNumber: '101-19',
      },
      '102-19': {
        ...MOCK_CASE,
        createdAt: '2019-03-19T17:29:13.120Z',
        docketNumber: '102-19',
        leadDocketNumber: '101-19',
      },
      '103-19': {
        ...MOCK_CASE,
        createdAt: '2019-03-19T17:29:13.120Z',
        docketNumber: '103-19',
        leadDocketNumber: '101-19',
      },
      '104-19': {
        ...MOCK_CASE,
        createdAt: '2019-03-19T17:29:13.120Z',
        docketNumber: '104-19',
        leadDocketNumber: '104-19',
      },
      '105-19': {
        ...MOCK_CASE,
        createdAt: '2019-03-19T17:29:13.120Z',
        docketNumber: '105-19',
        leadDocketNumber: '104-19',
      },
    };

    applicationContext.getCurrentUser.mockReturnValue({
      role: ROLES.docketClerk,
    });
    applicationContext
      .getPersistenceGateway()
      .getCaseByDocketNumber.mockImplementation(({ docketNumber }) => {
        return mockCases[docketNumber];
      });
    applicationContext
      .getPersistenceGateway()
      .getCasesByLeadDocketNumber.mockImplementation(({ leadDocketNumber }) => {
        return Object.keys(mockCases)
          .map(key => mockCases[key])
          .filter(mockCase => mockCase.leadDocketNumber === leadDocketNumber);
      });
    applicationContext
      .getPersistenceGateway()
      .updateCase.mockImplementation(({ caseToUpdate }) => caseToUpdate);
  });

  it('Should return an Unauthorized error if the user does not have the CONSOLIDATE_CASES permission', async () => {
    applicationContext.getCurrentUser.mockReturnValue({
      role: ROLES.petitioner,
    });

    await expect(
      removeConsolidatedCasesInteractor(applicationContext, {
        docketNumber: '102-19',
        docketNumbersToRemove: ['101-19'],
      }),
    ).rejects.toThrow('Unauthorized for case consolidation');
  });

  it('Should try to get the case by its docketNumber', async () => {
    await removeConsolidatedCasesInteractor(applicationContext, {
      docketNumber: '102-19',
      docketNumbersToRemove: ['101-19'],
    });

    expect(
      applicationContext.getPersistenceGateway().getCaseByDocketNumber,
    ).toHaveBeenCalled();
  });

  it('Should return a Not Found error if the case to update can not be found', async () => {
    await expect(
      removeConsolidatedCasesInteractor(applicationContext, {
        docketNumber: '111-11',
        docketNumbersToRemove: ['101-19'],
      }),
    ).rejects.toThrow('Case 111-11 was not found.');
  });

  it('Should return a Not Found error if the case to remove cannot be found', async () => {
    await expect(
      removeConsolidatedCasesInteractor(applicationContext, {
        docketNumber: '102-19',
        docketNumbersToRemove: ['111-11'],
      }),
    ).rejects.toThrow('Case to consolidate with (111-11) was not found.');
  });

  it('Should only update the removed case if the case to remove is not the lead case', async () => {
    await removeConsolidatedCasesInteractor(applicationContext, {
      docketNumber: '101-19',
      docketNumbersToRemove: ['102-19'],
    });

    expect(
      applicationContext.getPersistenceGateway().updateCase.mock.calls.length,
    ).toEqual(1);
    expect(
      applicationContext.getPersistenceGateway().updateCase.mock.calls[0][0]
        .caseToUpdate,
    ).toMatchObject({
      docketNumber: '102-19',
      leadDocketNumber: undefined,
    });
  });

  it('Should update the removed case and all other currently consolidated cases if the case to remove is the lead case', async () => {
    await removeConsolidatedCasesInteractor(applicationContext, {
      docketNumber: '102-19',
      docketNumbersToRemove: ['101-19'],
    });

    expect(
      applicationContext.getPersistenceGateway().updateCase.mock.calls.length,
    ).toEqual(3);
    // first updates cases with new lead docket number
    expect(
      applicationContext.getPersistenceGateway().updateCase.mock.calls[0][0]
        .caseToUpdate,
    ).toMatchObject({
      docketNumber: '102-19',
      leadDocketNumber: '102-19',
    });
    expect(
      applicationContext.getPersistenceGateway().updateCase.mock.calls[1][0]
        .caseToUpdate,
    ).toMatchObject({
      docketNumber: '103-19',
      leadDocketNumber: '102-19',
    });
    // then removes leadDocketNumber from case to remove
    expect(
      applicationContext.getPersistenceGateway().updateCase.mock.calls[2][0]
        .caseToUpdate,
    ).toMatchObject({
      docketNumber: '101-19',
      leadDocketNumber: undefined,
    });
  });

  it('Should update all cases to remove consolidation if new consolidated cases length is 0', async () => {
    const docketNumbersToRemove = allDocketNumbers;
    await removeConsolidatedCasesInteractor(applicationContext, {
      docketNumber: '101-19',
      docketNumbersToRemove,
    });
    expect(
      applicationContext.getUseCaseHelpers().updateCaseAndAssociations,
    ).toHaveBeenCalledTimes(docketNumbersToRemove.length);
  });

  it('Should update ALL cases to remove consolidation if new consolidated cases length is 1', async () => {
    const docketNumbersToRemove = [
      // 101-19 is the lead case but not in the list to be removed
      '102-19',
      '103-19',
      '104-19',
      '105-19',
    ];
    await removeConsolidatedCasesInteractor(applicationContext, {
      docketNumber: '101-19',
      docketNumbersToRemove,
    });

    expect(
      applicationContext.getUseCaseHelpers().updateCaseAndAssociations,
    ).toHaveBeenCalledTimes(allDocketNumbers.length);

    allDocketNumbers.forEach((docketNumber, callIndex) => {
      expect(
        applicationContext.getUseCaseHelpers().updateCaseAndAssociations.mock
          .calls[callIndex][0].caseToUpdate.docketNumber,
      ).toBe(docketNumber);
    });
  });

  it('Should update the removed case and remove consolidation from the original lead case if there is only one case remaining after removal', async () => {
    await removeConsolidatedCasesInteractor(applicationContext, {
      docketNumber: '104-19',
      docketNumbersToRemove: ['105-19'],
    });

    expect(
      applicationContext.getPersistenceGateway().updateCase.mock.calls.length,
    ).toEqual(2);
    // first removes leadDocketNumber from original case
    expect(
      applicationContext.getPersistenceGateway().updateCase.mock.calls[0][0]
        .caseToUpdate,
    ).toMatchObject({
      docketNumber: '104-19',
      leadDocketNumber: undefined,
    });
    // then removes leadDocketNumber from case to remove
    expect(
      applicationContext.getPersistenceGateway().updateCase.mock.calls[1][0]
        .caseToUpdate,
    ).toMatchObject({
      docketNumber: '105-19',
      leadDocketNumber: undefined,
    });
  });

  it('Should update the removed case and remove consolidation from the original non-lead case if there is only one case remaining after removal', async () => {
    await removeConsolidatedCasesInteractor(applicationContext, {
      docketNumber: '105-19',
      docketNumbersToRemove: ['104-19'],
    });

    expect(
      applicationContext.getPersistenceGateway().updateCase.mock.calls.length,
    ).toEqual(2);
    // first removes leadDocketNumber from original case
    expect(
      applicationContext.getPersistenceGateway().updateCase.mock.calls[0][0]
        .caseToUpdate,
    ).toMatchObject({
      docketNumber: '105-19',
      leadDocketNumber: undefined,
    });
    // then removes leadDocketNumber from case to remove
    expect(
      applicationContext.getPersistenceGateway().updateCase.mock.calls[1][0]
        .caseToUpdate,
    ).toMatchObject({
      docketNumber: '104-19',
      leadDocketNumber: undefined,
    });
  });
});
