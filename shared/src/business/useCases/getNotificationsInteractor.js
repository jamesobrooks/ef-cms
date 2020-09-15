const {
  isAuthorized,
  ROLE_PERMISSIONS,
} = require('../../authorization/authorizationClientService');
const { UnauthorizedError } = require('../../errors/errors');

/**
 * getNotificationsInteractor
 *
 * @param {object} providers the providers object
 * @param {object} providers.applicationContext the application context
 * @returns {object} inbox unread message counts for the individual and section inboxes
 */
exports.getNotificationsInteractor = async ({ applicationContext }) => {
  const authorizedUser = applicationContext.getCurrentUser();

  if (!isAuthorized(authorizedUser, ROLE_PERMISSIONS.MESSAGES)) {
    throw new UnauthorizedError('Unauthorized to get inbox counts');
  }

  const user = await applicationContext
    .getPersistenceGateway()
    .getUserById({ applicationContext, userId: authorizedUser.userId });

  const { section, userId } = user;

  const documentQCInbox = await applicationContext
    .getPersistenceGateway()
    .getDocumentQCInboxForUser({
      applicationContext,
      userId,
    });

  const userInbox = await applicationContext
    .getPersistenceGateway()
    .getUserInboxMessages({ applicationContext, userId });

  const sectionInbox = await applicationContext
    .getPersistenceGateway()
    .getSectionInboxMessages({ applicationContext, section });

  const unreadMessageCount = userInbox.filter(message => !message.isRead)
    .length;

  return {
    qcUnreadCount: documentQCInbox.filter(item => !item.isRead).length,
    unreadMessageCount,
    userInboxCount: userInbox.length,
    userSectionCount: sectionInbox.length,
  };
};
