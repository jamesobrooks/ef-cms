const { post } = require('../requests');

/**
 * generateDraftStampOrderInteractor
 *
 * @param {object} applicationContext the application context
 * @param {object} providers the providers object
 * @param {string} providers.docketNumber the docket number of the case
 * @param {string} providers.docketEntryId the docket entry id
 * @returns {Promise<*>} the promise of the api call
 */
exports.generateDraftStampOrderInteractor = (
  applicationContext,
  { docketEntryId, docketNumber },
) => {
  return post({
    applicationContext,
    endpoint: `/case-documents/${docketNumber}/${docketEntryId}/draft-stamp-order`,
  });
};
