const {
  aggregatePartiesForService,
} = require('../../utilities/aggregatePartiesForService');
const {
  CASE_STATUS_TYPES,
  DOCUMENT_PROCESSING_STATUS_OPTIONS,
  SYSTEM_GENERATED_DOCUMENT_TYPES,
  TRIAL_SESSION_PROCEEDING_TYPES,
} = require('../../entities/EntityConstants');
const { DocketEntry } = require('../../entities/DocketEntry');
const { get } = require('lodash');

const serveNoticesForCase = async (
  applicationContext,
  {
    caseEntity,
    newPdfDoc,
    noticeDocketEntryEntity,
    noticeDocumentPdfData,
    PDFDocument,
    servedParties,
  },
) => {
  await applicationContext.getUseCaseHelpers().sendServedPartiesEmails({
    applicationContext,
    caseEntity,
    docketEntryId: noticeDocketEntryEntity.docketEntryId,
    servedParties,
  });

  if (servedParties.paper.length > 0) {
    const noticeDocumentPdf = await PDFDocument.load(noticeDocumentPdfData);

    await applicationContext
      .getUseCaseHelpers()
      .appendPaperServiceAddressPageToPdf({
        applicationContext,
        caseEntity,
        newPdfDoc,
        noticeDoc: noticeDocumentPdf,
        servedParties,
      });
  }
};

/**
 * setNoticeOfChangeOfTrialJudge
 *
fixme
 */
exports.setNoticeOfChangeOfTrialJudge = async (
  applicationContext,
  {
    caseEntity,
    currentTrialSession,
    newPdfDoc,
    newTrialSessionEntity,
    PDFDocument,
    userId,
  },
) => {
  const trialSessionJudgeHasChanged =
    (!get(currentTrialSession, 'judge.userId') &&
      get(newTrialSessionEntity, 'judge.userId')) ||
    (currentTrialSession.judge &&
      newTrialSessionEntity.judge &&
      currentTrialSession.judge.userId !== newTrialSessionEntity.judge.userId);

  const shouldIssueNoticeOfChangeOfTrialJudge =
    currentTrialSession.isCalendared &&
    trialSessionJudgeHasChanged &&
    caseEntity.status !== CASE_STATUS_TYPES.closed;

  if (shouldIssueNoticeOfChangeOfTrialJudge) {
    const trialSessionInformation = {
      chambersPhoneNumber: newTrialSessionEntity.chambersPhoneNumber,
      joinPhoneNumber: newTrialSessionEntity.joinPhoneNumber,
      judgeName: newTrialSessionEntity.judge.name,
      meetingId: newTrialSessionEntity.meetingId,
      password: newTrialSessionEntity.password,
      startDate: newTrialSessionEntity.startDate,
      startTime: newTrialSessionEntity.startTime,
      trialLocation: newTrialSessionEntity.trialLocation,
    };

    const notice = await applicationContext
      .getUseCases()
      .generateNoticeOfChangeOfTrialJudgeInteractor(applicationContext, {
        docketNumber: caseEntity.docketNumber,
        trialSessionInformation,
      });

    // const docketEntryId = applicationContext.getUniqueId();

    // await applicationContext.getPersistenceGateway().saveDocumentFromLambda({
    //   applicationContext,
    //   document: notice,
    //   key: docketEntryId,
    // });

    // const noticeOfChangeToRemoteProceedingDocketEntry = new DocketEntry(
    //   {
    //     date: newTrialSessionEntity.startDate,
    //     docketEntryId,
    //     documentTitle:
    //       SYSTEM_GENERATED_DOCUMENT_TYPES.noticeOfChangeToRemoteProceeding
    //         .documentTitle,
    //     documentType:
    //       SYSTEM_GENERATED_DOCUMENT_TYPES.noticeOfChangeToRemoteProceeding
    //         .documentType,
    //     eventCode:
    //       SYSTEM_GENERATED_DOCUMENT_TYPES.noticeOfChangeToRemoteProceeding
    //         .eventCode,
    //     isAutoGenerated: true,
    //     isFileAttached: true,
    //     isOnDocketRecord: true,
    //     processingStatus: DOCUMENT_PROCESSING_STATUS_OPTIONS.COMPLETE,
    //     signedAt: applicationContext.getUtilities().createISODateString(),
    //     trialLocation: newTrialSessionEntity.trialLocation,
    //     userId,
    //   },
    //   { applicationContext },
    // );

    // noticeOfChangeToRemoteProceedingDocketEntry.numberOfPages =
    //   await applicationContext.getUseCaseHelpers().countPagesInDocument({
    //     applicationContext,
    //     docketEntryId:
    //       noticeOfChangeToRemoteProceedingDocketEntry.docketEntryId,
    //   });

    // caseEntity.addDocketEntry(noticeOfChangeToRemoteProceedingDocketEntry);
    // const servedParties = aggregatePartiesForService(caseEntity);

    // noticeOfChangeToRemoteProceedingDocketEntry.setAsServed(servedParties.all);

    // await serveNoticesForCase(applicationContext, {
    //   PDFDocument,
    //   caseEntity,
    //   newPdfDoc,
    //   noticeDocketEntryEntity: noticeOfChangeToRemoteProceedingDocketEntry,
    //   noticeDocumentPdfData: notice,
    //   servedParties,
    // });
  }
};
