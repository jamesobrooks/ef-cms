import { state } from 'cerebral';

/**
 * calls the unblockCaseFromTrialInteractor to remove the block on the case
 * @param {object} providers the providers object
 * @param {object} providers.applicationContext the application context
 * @param {Function} providers.get the cerebral get function
 * @returns {object} the alertSuccess and updated caseDetail object
 */
export const unblockCaseFromTrialAction = async ({
  applicationContext,
  get,
}: ActionProps) => {
  const docketNumber = get(state.caseDetail.docketNumber);

  const caseDetail = await applicationContext
    .getUseCases()
    .unblockCaseFromTrialInteractor(applicationContext, {
      docketNumber,
    });

  return {
    alertSuccess: {
      message:
        'Block removed. Case is eligible for next available trial session.',
    },
    caseDetail,
  };
};
