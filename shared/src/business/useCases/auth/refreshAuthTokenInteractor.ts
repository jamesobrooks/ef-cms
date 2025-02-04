/**
 * refreshAuthTokenInteractor
 *
 * @param {object} applicationContext the application context
 * @param {object} auth an object
 * @param {string} auth.refreshToken the refresh token generated by our AuthN/AuthZ provider
 * @returns {Promise} the promise of a new auth token that can be used to call our authenticated endpoints
 */
export const refreshAuthTokenInteractor = async (
  applicationContext: IApplicationContext,
  { refreshToken }: { refreshToken: string },
) => {
  if (!refreshToken) {
    throw new Error('refreshToken is required');
  }
  const { token } = await applicationContext
    .getPersistenceGateway()
    .refreshToken(applicationContext, { refreshToken });
  return {
    token,
  };
};
