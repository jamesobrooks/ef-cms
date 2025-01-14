import { genericHandler } from '../genericHandler';

/**
 * used for removing pending items from a case
 *
 * @param {object} event the AWS event object
 * @returns {Promise<*|undefined>} the api gateway response object containing the statusCode, body, and headers
 */
export const removeCasePendingItemLambda = event =>
  genericHandler(event, async ({ applicationContext }) => {
    return await applicationContext
      .getUseCases()
      .removeCasePendingItemInteractor(applicationContext, {
        ...event.pathParameters,
      });
  });
