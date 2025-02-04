import {
  ROLE_PERMISSIONS,
  isAuthorized,
} from '../../../authorization/authorizationClientService';
import {
  RawTrialSession,
  TrialSession,
  isStandaloneRemoteSession,
} from '../../entities/trialSessions/TrialSession';
import { UnauthorizedError } from '../../../errors/errors';

/**
 * createTrialSessionInteractor
 *
 * @param {object} applicationContext the application context
 * @param {object} providers the providers object
 * @param {object} providers.trialSession the trial session data
 * @returns {object} the created trial session
 */
export const createTrialSessionInteractor = async (
  applicationContext: IApplicationContext,
  { trialSession }: { trialSession: RawTrialSession },
) => {
  const user = applicationContext.getCurrentUser();

  if (!isAuthorized(user, ROLE_PERMISSIONS.TRIAL_SESSIONS)) {
    throw new UnauthorizedError('Unauthorized');
  }

  const trialSessionToAdd = new TrialSession(trialSession, {
    applicationContext,
  });

  if (
    ['Motion/Hearing', 'Special'].includes(trialSessionToAdd.sessionType) ||
    isStandaloneRemoteSession(trialSessionToAdd.sessionScope)
  ) {
    trialSessionToAdd.setAsCalendared();
  }

  if (trialSessionToAdd.swingSession && trialSessionToAdd.swingSessionId) {
    applicationContext
      .getUseCaseHelpers()
      .associateSwingTrialSessions(applicationContext, {
        swingSessionId: trialSessionToAdd.swingSessionId,
        trialSessionEntity: trialSessionToAdd,
      });
  }

  return await applicationContext
    .getUseCaseHelpers()
    .createTrialSessionAndWorkingCopy({
      applicationContext,
      trialSessionToAdd,
    });
};
