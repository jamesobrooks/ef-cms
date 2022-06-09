import { omit } from 'lodash';
import { state } from 'cerebral';

/**
 * validates the trial session.
 *
 * @param {object} providers the providers object
 * @param {object} providers.applicationContext the application context needed for getting the use case
 * @param {object} providers.path the cerebral path which contains the next path in the sequence (path of success or error)
 * @param {object} providers.get the cerebral get function used for getting state.form
 * @returns {object} the next path based on if validation was successful or error
 */
export const validateTrialSessionAction = ({
  applicationContext,
  get,
  path,
  props,
}) => {
  const startDate =
    applicationContext
      .getUtilities()
      .prepareDateFromString(props.computedStartDate)
      ?.toISOString() || null;

  const estimatedEndDate =
    applicationContext
      .getUtilities()
      .prepareDateFromString(props.computedEstimatedEndDate)
      ?.toISOString() || null;

  const trialSession = omit(
    {
      ...get(state.form),
    },
    [
      'startDateYear',
      'startDateMonth',
      'startDateDay',
      'estimatedEndDateDay',
      'estimatedEndDateMonth',
      'estimatedEndDateYear',
    ],
  );

  const errors = applicationContext
    .getUseCases()
    .validateTrialSessionInteractor(applicationContext, {
      trialSession: { ...trialSession, estimatedEndDate, startDate },
    });

  if (!errors) {
    return path.success();
  } else {
    errors.startDate = errors.startDate || errors.term;
    const errorDisplayOrder = [
      'startDate',
      'startTime',
      'estimatedEndDate',
      'swingSessionId',
      'sessionType',
      'maxCases',
      'trialLocation',
      'postalCode',
    ];
    return path.error({
      alertError: {
        title: 'Errors were found. Please correct your form and resubmit.',
      },
      errorDisplayOrder,
      errors,
    });
  }
};
