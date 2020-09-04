const {
  aggregatePartiesForService,
} = require('../utilities/aggregatePartiesForService');
const {
  DOCKET_SECTION,
  DOCUMENT_PROCESSING_STATUS_OPTIONS,
} = require('../entities/EntityConstants');
const { addCoverToPdf } = require('./addCoversheetInteractor');
const { Case } = require('../entities/cases/Case');
const { DocketEntry } = require('../entities/DocketEntry');
const { getCaseCaptionMeta } = require('../utilities/getCaseCaptionMeta');
const { NotFoundError, UnauthorizedError } = require('../../errors/errors');
const { WorkItem } = require('../entities/WorkItem');

/**
 * updatePrimaryContactInteractor
 *
 * @param {object} providers the providers object
 * @param {object} providers.applicationContext the application context
 * @param {string} providers.docketNumber the docket number of the case to update the primary contact
 * @param {object} providers.contactInfo the contact info to update on the case
 * @returns {object} the updated case
 */
exports.updatePrimaryContactInteractor = async ({
  applicationContext,
  contactInfo,
  docketNumber,
}) => {
  const user = applicationContext.getCurrentUser();

  const editableFields = {
    address1: contactInfo.address1,
    address2: contactInfo.address2,
    address3: contactInfo.address3,
    city: contactInfo.city,
    country: contactInfo.country,
    countryType: contactInfo.countryType,
    phone: contactInfo.phone,
    postalCode: contactInfo.postalCode,
    state: contactInfo.state,
  };

  const caseToUpdate = await applicationContext
    .getPersistenceGateway()
    .getCaseByDocketNumber({
      applicationContext,
      docketNumber,
    });

  if (!caseToUpdate) {
    throw new NotFoundError(`Case ${docketNumber} was not found.`);
  }

  const caseEntity = new Case(
    {
      ...caseToUpdate,
      contactPrimary: { ...caseToUpdate.contactPrimary, ...editableFields },
    },
    { applicationContext },
  );

  const userIsAssociated = applicationContext
    .getUseCases()
    .userIsAssociated({ applicationContext, caseDetail: caseToUpdate, user });

  if (!userIsAssociated) {
    throw new UnauthorizedError('Unauthorized for update case contact');
  }

  const documentType = applicationContext
    .getUtilities()
    .getDocumentTypeForAddressChange({
      newData: editableFields,
      oldData: caseToUpdate.contactPrimary,
    });

  if (documentType) {
    const { caseCaptionExtension, caseTitle } = getCaseCaptionMeta(caseEntity);

    const changeOfAddressPdf = await applicationContext
      .getDocumentGenerators()
      .changeOfAddress({
        applicationContext,
        content: {
          caseCaptionExtension,
          caseTitle,
          docketNumber: caseEntity.docketNumber,
          docketNumberWithSuffix: caseEntity.docketNumberWithSuffix,
          documentTitle: documentType.title,
          name: contactInfo.name,
          newData: contactInfo,
          oldData: caseToUpdate.contactPrimary,
        },
      });

    const newDocumentId = applicationContext.getUniqueId();

    const changeOfAddressDocument = new DocketEntry(
      {
        addToCoversheet: true,
        additionalInfo: `for ${caseToUpdate.contactPrimary.name}`,
        description: documentType.title,
        docketNumber: caseEntity.docketNumber,
        documentId: newDocumentId,
        documentTitle: documentType.title,
        documentType: documentType.title,
        eventCode: documentType.eventCode,
        isAutoGenerated: true,
        isOnDocketRecord: true,
        partyPrimary: true,
        processingStatus: DOCUMENT_PROCESSING_STATUS_OPTIONS.COMPLETE,
        userId: user.userId,
        ...caseEntity.getCaseContacts({
          contactPrimary: true,
        }),
      },
      { applicationContext },
    );

    const servedParties = aggregatePartiesForService(caseEntity);

    changeOfAddressDocument.setAsServed(servedParties.all);

    await applicationContext.getUseCaseHelpers().sendServedPartiesEmails({
      applicationContext,
      caseEntity,
      documentEntity: changeOfAddressDocument,
      servedParties,
    });

    const workItem = new WorkItem(
      {
        assigneeId: null,
        assigneeName: null,
        associatedJudge: caseEntity.associatedJudge,
        caseIsInProgress: caseEntity.inProgress,
        caseStatus: caseEntity.status,
        caseTitle: Case.getCaseTitle(Case.getCaseCaption(caseEntity)),
        docketNumber: caseEntity.docketNumber,
        docketNumberWithSuffix: caseEntity.docketNumberWithSuffix,
        document: {
          ...changeOfAddressDocument.toRawObject(),
          createdAt: changeOfAddressDocument.createdAt,
        },
        section: DOCKET_SECTION,
        sentBy: user.name,
        sentByUserId: user.userId,
      },
      { applicationContext },
    );

    changeOfAddressDocument.setWorkItem(workItem);

    caseEntity.addDocument(changeOfAddressDocument);

    const { pdfData: changeOfAddressPdfWithCover } = await addCoverToPdf({
      applicationContext,
      caseEntity,
      documentEntity: changeOfAddressDocument,
      pdfData: changeOfAddressPdf,
    });

    await applicationContext.getPersistenceGateway().saveDocumentFromLambda({
      applicationContext,
      document: changeOfAddressPdfWithCover,
      documentId: newDocumentId,
    });

    await applicationContext.getPersistenceGateway().saveWorkItemForNonPaper({
      applicationContext,
      workItem: workItem.validate().toRawObject(),
    });

    await applicationContext.getPersistenceGateway().updateCase({
      applicationContext,
      caseToUpdate: caseEntity.validate().toRawObject(),
    });
  }

  return caseEntity.validate().toRawObject();
};
