/**
 * authenticateUserInteractor
 *
 * @param {object} applicationContext the application context
 * @param {object} auth an object
 * @param {string} auth.code the OAuth2 authorization code generated by our AuthN/AuthZ provider
 * @returns {Promise} the promise of both the refresh token and the auth token
 */
export const authenticateUserInteractor = async (
  applicationContext: IApplicationContext,
  { code }: { code: string },
) => {
  const { refreshToken, token } = await applicationContext
    .getPersistenceGateway()
    .confirmAuthCode(applicationContext, { code });

  return {
    refreshToken,
    token,
  };
};
