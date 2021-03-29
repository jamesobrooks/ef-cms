const {
  isAuthorized,
  ROLE_PERMISSIONS,
} = require('../../authorization/authorizationClientService');
const {
  UnauthorizedError,
  UnprocessableEntityError,
} = require('../../errors/errors');
const { Case, updatePetitioner } = require('../entities/cases/Case');
const { ContactFactory } = require('../entities/contacts/ContactFactory');
const { isEmpty } = require('lodash');
const { WorkItem } = require('../entities/WorkItem');

/**
 * saveCaseDetailInternalEditInteractor
 *
 * @param {object} applicationContext the application context
 * @param {object} providers the providers object
 * @param {string} providers.docketNumber the docket number of the case to update
 * @param {object} providers.caseToUpdate the updated case data
 * @returns {object} the updated case data
 */
exports.saveCaseDetailInternalEditInteractor = async (
  applicationContext,
  { caseToUpdate, docketNumber },
) => {
  const authorizedUser = applicationContext.getCurrentUser();

  if (!isAuthorized(authorizedUser, ROLE_PERMISSIONS.UPDATE_CASE)) {
    throw new UnauthorizedError('Unauthorized for update case');
  }

  const user = await applicationContext
    .getPersistenceGateway()
    .getUserById({ applicationContext, userId: authorizedUser.userId });

  if (!caseToUpdate || docketNumber !== caseToUpdate.docketNumber) {
    throw new UnprocessableEntityError();
  }

  const caseRecord = await applicationContext
    .getPersistenceGateway()
    .getCaseByDocketNumber({
      applicationContext,
      docketNumber,
    });

  const editableFields = {
    caseCaption: caseToUpdate.caseCaption,
    caseType: caseToUpdate.caseType,
    contactPrimary: caseToUpdate.contactPrimary,
    contactSecondary: caseToUpdate.contactSecondary,
    docketNumber: caseToUpdate.docketNumber,
    docketNumberSuffix: caseToUpdate.docketNumberSuffix,
    filingType: caseToUpdate.filingType,
    hasVerifiedIrsNotice: caseToUpdate.hasVerifiedIrsNotice,
    irsNoticeDate: caseToUpdate.irsNoticeDate,
    mailingDate: caseToUpdate.mailingDate,
    noticeOfAttachments: caseToUpdate.noticeOfAttachments,
    orderDesignatingPlaceOfTrial: caseToUpdate.orderDesignatingPlaceOfTrial,
    orderForAmendedPetition: caseToUpdate.orderForAmendedPetition,
    orderForAmendedPetitionAndFilingFee:
      caseToUpdate.orderForAmendedPetitionAndFilingFee,
    orderForFilingFee: caseToUpdate.orderForFilingFee,
    orderForOds: caseToUpdate.orderForOds,
    orderForRatification: caseToUpdate.orderForRatification,
    orderToShowCause: caseToUpdate.orderToShowCause,
    partyType: caseToUpdate.partyType,
    petitionPaymentDate: caseToUpdate.petitionPaymentDate,
    petitionPaymentMethod: caseToUpdate.petitionPaymentMethod,
    petitionPaymentStatus: caseToUpdate.petitionPaymentStatus,
    petitionPaymentWaivedDate: caseToUpdate.petitionPaymentWaivedDate,
    preferredTrialCity: caseToUpdate.preferredTrialCity,
    procedureType: caseToUpdate.procedureType,
    receivedAt: caseToUpdate.receivedAt,
    statistics: caseToUpdate.statistics,
  };

  const caseWithFormEdits = {
    ...caseRecord,
    ...editableFields,
  };

  if (!isEmpty(caseWithFormEdits.contactPrimary)) {
    updatePetitioner(caseWithFormEdits, caseWithFormEdits.contactPrimary);
    // caseWithFormEdits.contactPrimary = ContactFactory.createContacts({
    //   applicationContext,
    //   contactInfo: { primary: caseWithFormEdits.contactPrimary },
    //   partyType: caseWithFormEdits.partyType,
    // }).primary.toRawObject();
    // console.log('in interesting code', caseWithFormEdits.contactPrimary);
  }

  if (!isEmpty(caseWithFormEdits.contactSecondary)) {
    caseWithFormEdits.contactSecondary = ContactFactory.createContacts({
      applicationContext,
      contactInfo: { secondary: caseWithFormEdits.contactSecondary },
      partyType: caseWithFormEdits.partyType,
    }).secondary.toRawObject();
  }

  const caseEntity = new Case(caseWithFormEdits, {
    applicationContext,
  });

  console.log('in action, contactPrim', caseEntity.contactPrimary);
  console.log('in action, petitioners', caseEntity.petitioners);

  if (caseEntity.isPaper) {
    await applicationContext.getUseCaseHelpers().updateInitialFilingDocuments({
      applicationContext,
      authorizedUser,
      caseEntity,
      caseToUpdate,
    });
  } else {
    const petitionDocketEntry = caseEntity.getPetitionDocketEntry();

    const initializeCaseWorkItem = petitionDocketEntry.workItem;

    await applicationContext.getPersistenceGateway().deleteWorkItemFromInbox({
      applicationContext,
      workItem: initializeCaseWorkItem.validate().toRawObject(),
    });

    const workItemEntity = new WorkItem(
      {
        ...initializeCaseWorkItem,
        assigneeId: user.userId,
        assigneeName: user.name,
        caseIsInProgress: true,
      },
      { applicationContext },
    );

    await applicationContext
      .getPersistenceGateway()
      .saveWorkItemAndAddToUserAndSectionInbox({
        applicationContext,
        workItem: workItemEntity.validate().toRawObject(),
      });
  }

  const updatedCase = await applicationContext
    .getUseCaseHelpers()
    .updateCaseAndAssociations({
      applicationContext,
      caseToUpdate: caseEntity,
    });

  return new Case(updatedCase, { applicationContext }).toRawObject();
};
