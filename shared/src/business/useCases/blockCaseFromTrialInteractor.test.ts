import { MOCK_CASE } from '../../test/mockCase';
import { ROLES } from '../entities/EntityConstants';
import { applicationContext } from '../test/createTestApplicationContext';
import { blockCaseFromTrialInteractor } from './blockCaseFromTrialInteractor';

describe('blockCaseFromTrialInteractor', () => {
  beforeEach(() => {
    applicationContext.getCurrentUser.mockReturnValue({
      role: ROLES.petitionsClerk,
      userId: 'petitionsclerk',
    });
    applicationContext
      .getPersistenceGateway()
      .getCaseByDocketNumber.mockReturnValue(MOCK_CASE);
    applicationContext
      .getUseCaseHelpers()
      .updateCaseAndAssociations.mockImplementation(
        ({ caseToUpdate }) => caseToUpdate,
      );
  });

  it('should update the case with the blocked flag set as true and attach a reason', async () => {
    const result = await blockCaseFromTrialInteractor(applicationContext, {
      docketNumber: MOCK_CASE.docketNumber,
      reason: 'just because',
    });

    expect(result).toMatchObject({
      blocked: true,
      blockedReason: 'just because',
    });
    expect(
      applicationContext.getPersistenceGateway()
        .deleteCaseTrialSortMappingRecords,
    ).toHaveBeenCalled();
    expect(
      applicationContext.getPersistenceGateway()
        .deleteCaseTrialSortMappingRecords.mock.calls[0][0].docketNumber,
    ).toEqual(MOCK_CASE.docketNumber);
  });

  it('should throw an unauthorized error if the user has no access to block cases', async () => {
    applicationContext.getCurrentUser.mockReturnValue({
      role: 'nope',
      userId: 'nope',
    });

    await expect(
      blockCaseFromTrialInteractor(applicationContext, {
        docketNumber: '123-45',
      } as any),
    ).rejects.toThrow('Unauthorized');
  });
});
