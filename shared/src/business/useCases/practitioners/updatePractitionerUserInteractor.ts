import {
  isAuthorized,
  ROLE_PERMISSIONS,
} from '../../../authorization/authorizationClientService';
import { generateChangeOfAddress } from '../users/generateChangeOfAddress';
import { omit, union } from 'lodash';
import { Practitioner } from '../../entities/Practitioner';
import { UnauthorizedError } from '../../../errors/errors';

const updateUserPendingEmail = async ({ applicationContext, user }) => {
  const isEmailAvailable = await applicationContext
    .getPersistenceGateway()
    .isEmailAvailable({
      applicationContext,
      email: user.updatedEmail,
    });

  if (!isEmailAvailable) {
    throw new Error('Email is not available');
  }

  const pendingEmailVerificationToken = applicationContext.getUniqueId();
  user.pendingEmailVerificationToken = pendingEmailVerificationToken;
  user.pendingEmail = user.updatedEmail;
};

const getUpdatedFieldNames = ({ applicationContext, oldUser, updatedUser }) => {
  const updatedPractitionerRaw = new Practitioner(updatedUser, {
    applicationContext,
  }).toRawObject();
  const oldPractitionerRaw = new Practitioner(oldUser, {
    applicationContext,
  }).toRawObject();

  const practitionerDetailDiff = applicationContext
    .getUtilities()
    .getAddressPhoneDiff({
      newData: {
        ...omit(updatedPractitionerRaw, 'contact'),
        ...updatedPractitionerRaw.contact,
      },
      oldData: {
        ...omit(oldPractitionerRaw, 'contact'),
        ...oldPractitionerRaw.contact,
      },
    });

  return Object.keys(practitionerDetailDiff);
};

/**
 * updatePractitionerUserInteractor
 *
 * @param {object} applicationContext the application context
 * @param {object} providers the providers object
 * @param {object} providers.barNumber the barNumber of the user to update
 * @param {object} providers.user the user data
 */
export const updatePractitionerUserInteractor = async (
  applicationContext: IApplicationContext,
  {
    barNumber,
    bypassDocketEntry = false,
    user,
  }: { barNumber: string; bypassDocketEntry?: boolean; user: TPractitioner },
) => {
  const requestUser = applicationContext.getCurrentUser();

  if (
    !isAuthorized(requestUser, ROLE_PERMISSIONS.ADD_EDIT_PRACTITIONER_USER) ||
    !isAuthorized(requestUser, ROLE_PERMISSIONS.EMAIL_MANAGEMENT)
  ) {
    throw new UnauthorizedError('Unauthorized for updating practitioner user');
  }

  const oldUser = await applicationContext
    .getPersistenceGateway()
    .getPractitionerByBarNumber({ applicationContext, barNumber });

  const userHasAccount = !!oldUser.email;
  const userIsUpdatingEmail = !!user.updatedEmail;

  if (oldUser.userId !== user.userId) {
    throw new Error('Bar number does not match user data.');
  }

  if (userHasAccount && userIsUpdatingEmail) {
    await updateUserPendingEmail({ applicationContext, user });
  }

  // do not allow edit of bar number
  const validatedUserData = new Practitioner(
    {
      ...user,
      barNumber: oldUser.barNumber,
      email: oldUser.email,
    },
    { applicationContext },
  )
    .validate()
    .toRawObject();

  let updatedUser = validatedUserData;
  if (oldUser.email) {
    updatedUser = await applicationContext
      .getPersistenceGateway()
      .updatePractitionerUser({
        applicationContext,
        user: validatedUserData,
      });
  } else if (!oldUser.email && user.updatedEmail) {
    updatedUser = await applicationContext
      .getPersistenceGateway()
      .createNewPractitionerUser({
        applicationContext,
        user: new Practitioner({
          ...validatedUserData,
          pendingEmail: user.updatedEmail,
        })
          .validate()
          .toRawObject(),
      });
  } else {
    await applicationContext.getPersistenceGateway().updateUserRecords({
      applicationContext,
      oldUser: new Practitioner(oldUser).validate().toRawObject(),
      updatedUser: validatedUserData,
      userId: oldUser.userId,
    });
  }

  await applicationContext.getNotificationGateway().sendNotificationToUser({
    applicationContext,
    message: {
      action: 'admin_contact_initial_update_complete',
    },
    userId: requestUser.userId,
  });

  if (userHasAccount && userIsUpdatingEmail) {
    await applicationContext.getUseCaseHelpers().sendEmailVerificationLink({
      applicationContext,
      pendingEmail: user.pendingEmail,
      pendingEmailVerificationToken: user.pendingEmailVerificationToken,
    });
  }

  const updatedFields = getUpdatedFieldNames({
    applicationContext,
    oldUser,
    updatedUser,
  });

  const propertiesNotRequiringChangeOfAddress = [
    'pendingEmail',
    'pendingEmailVerificationToken',
    'practitionerNotes',
  ];
  const combinedDiffKeys = union(
    updatedFields,
    propertiesNotRequiringChangeOfAddress,
  );

  if (combinedDiffKeys.length > propertiesNotRequiringChangeOfAddress.length) {
    await generateChangeOfAddress({
      applicationContext,
      bypassDocketEntry,
      contactInfo: validatedUserData.contact,
      firmName: validatedUserData.firmName,
      requestUserId: requestUser.userId,
      updatedEmail: validatedUserData.email,
      updatedName: validatedUserData.name,
      user: oldUser,
      websocketMessagePrefix: 'admin',
    });
  }

  await applicationContext.getNotificationGateway().sendNotificationToUser({
    applicationContext,
    message: {
      action: 'admin_contact_full_update_complete',
    },
    userId: requestUser.userId,
  });
};