/* eslint-disable max-lines */
import * as DateHandler from '../utilities/DateHandler';
import * as pdfLib from 'pdf-lib';
import {
  Case,
  canAllowDocumentServiceForCase,
  caseHasServedDocketEntries,
  caseHasServedPetition,
  getContactPrimary,
  getContactSecondary,
  getOtherFilers,
  getPetitionDocketEntry,
  getPetitionerById,
  getPractitionersRepresenting,
  isLeadCase,
  isSealedCase,
  isUserIdRepresentedByPrivatePractitioner,
  isUserPartOfGroup,
} from '../entities/cases/Case';
import { ClientApplicationContext } from '../../../../web-client/src/applicationContext';
import { ConsolidatedCaseDTO } from '../dto/cases/ConsolidatedCaseDTO';
import {
  DocketEntry,
  getServedPartiesCode,
  isServed,
} from '../entities/DocketEntry';
import {
  ERROR_MAP_429,
  getCognitoLoginUrl,
  getPublicSiteUrl,
  getUniqueId,
} from '../../sharedAppContext';
import { ROLES } from '../entities/EntityConstants';
import { User } from '../entities/User';
import { abbreviateState } from '../utilities/abbreviateState';
import { addDocketEntryForSystemGeneratedOrder } from '../useCaseHelper/addDocketEntryForSystemGeneratedOrder';
import { aggregatePartiesForService } from '../utilities/aggregatePartiesForService';
import { bulkDeleteRecords } from '../../persistence/elasticsearch/bulkDeleteRecords';
import { bulkIndexRecords } from '../../persistence/elasticsearch/bulkIndexRecords';
import { combineTwoPdfs } from '../utilities/documentGenerators/combineTwoPdfs';
import {
  compareCasesByDocketNumber,
  formatCase as formatCaseForTrialSession,
  getFormattedTrialSessionDetails,
} from '../utilities/getFormattedTrialSessionDetails';
import {
  compareISODateStrings,
  compareStrings,
} from '../utilities/sortFunctions';
import { copyPagesAndAppendToTargetPdf } from '../utilities/copyPagesAndAppendToTargetPdf';
import { createCase } from '../../persistence/dynamo/cases/createCase';
import { createCaseAndAssociations } from '../useCaseHelper/caseAssociation/createCaseAndAssociations';
import { createDocketNumber } from '../../persistence/dynamo/cases/docketNumberGenerator';
import { createMockDocumentClient } from './createMockDocumentClient';
import { deleteRecord } from '../../persistence/elasticsearch/deleteRecord';
import { deleteWorkItem } from '../../persistence/dynamo/workitems/deleteWorkItem';
import { documentUrlTranslator } from '../../../src/business/utilities/documentUrlTranslator';
import { fileAndServeDocumentOnOneCase } from '../useCaseHelper/docketEntry/fileAndServeDocumentOnOneCase';
import { filterEmptyStrings } from '../utilities/filterEmptyStrings';
import { formatAttachments } from '../../../src/business/utilities/formatAttachments';
import {
  formatCase,
  formatDocketEntry,
  getFormattedCaseDetail,
  sortDocketEntries,
} from '../../../src/business/utilities/getFormattedCaseDetail';
import { formatDollars } from '../utilities/formatDollars';
import {
  formatJudgeName,
  getJudgeLastName,
} from '../../../src/business/utilities/getFormattedJudgeName';
import { formatPhoneNumber } from '../../../src/business/utilities/formatPhoneNumber';
import { generateAndServeDocketEntry } from '../useCaseHelper/service/createChangeItems';
import { generateNoticesForCaseTrialSessionCalendarInteractor } from '../useCases/trialSessions/generateNoticesForCaseTrialSessionCalendarInteractor';
import {
  getAddressPhoneDiff,
  getDocumentTypeForAddressChange,
} from '../utilities/generateChangeOfAddressTemplate';
import { getAllWebSocketConnections } from '../../persistence/dynamo/notifications/getAllWebSocketConnections';
import { getCaseByDocketNumber } from '../../persistence/dynamo/cases/getCaseByDocketNumber';
import { getCaseDeadlinesByDocketNumber } from '../../persistence/dynamo/caseDeadlines/getCaseDeadlinesByDocketNumber';
import {
  getChambersSections,
  getChambersSectionsLabels,
  getJudgesChambers,
  getJudgesChambersWithLegacy,
} from '../../persistence/dynamo/chambers/getJudgesChambers';
import { getConstants } from '../../../../web-client/src/getConstants';
import { getCropBox } from '../../../src/business/utilities/getCropBox';
import { getDescriptionDisplay } from '../utilities/getDescriptionDisplay';
import {
  getDocQcSectionForUser,
  getWorkQueueFilters,
} from '../utilities/getWorkQueueFilters';
import { getDocumentQCInboxForSection as getDocumentQCInboxForSectionPersistence } from '../../persistence/elasticsearch/workitems/getDocumentQCInboxForSection';
import { getDocumentTitleWithAdditionalInfo } from '../../../src/business/utilities/getDocumentTitleWithAdditionalInfo';
import { getFakeFile } from './getFakeFile';
import { getFormattedPartiesNameAndTitle } from '../utilities/getFormattedPartiesNameAndTitle';
import { getItem } from '../../persistence/localStorage/getItem';
import { getSealedDocketEntryTooltip } from '../../../src/business/utilities/getSealedDocketEntryTooltip';
import { getStampBoxCoordinates } from '../../../src/business/utilities/getStampBoxCoordinates';
import { getTextByCount } from '../utilities/getTextByCount';
import { getUserById as getUserByIdPersistence } from '../../persistence/dynamo/users/getUserById';
import { getUserIdForNote } from '../useCaseHelper/getUserIdForNote';
import { getWorkItemById as getWorkItemByIdPersistence } from '../../persistence/dynamo/workitems/getWorkItemById';
import { incrementCounter } from '../../persistence/dynamo/helpers/incrementCounter';
import { isStandaloneRemoteSession } from '../entities/trialSessions/TrialSession';
import { putWorkItemInOutbox } from '../../persistence/dynamo/workitems/putWorkItemInOutbox';
import { removeCounselFromRemovedPetitioner } from '../useCaseHelper/caseAssociation/removeCounselFromRemovedPetitioner';
import { removeItem } from '../../persistence/localStorage/removeItem';
import { replaceBracketed } from '../utilities/replaceBracketed';
import { saveWorkItem } from '../../persistence/dynamo/workitems/saveWorkItem';
import { sealCaseInteractor } from '../useCases/sealCaseInteractor';
import { sealDocketEntryInteractor } from '../useCases/docketEntry/sealDocketEntryInteractor';
import { serveCaseDocument } from '../utilities/serveCaseDocument';
import { setConsolidationFlagsForDisplay } from '../utilities/setConsolidationFlagsForDisplay';
import { setItem } from '../../persistence/localStorage/setItem';
import { setNoticesForCalendaredTrialSessionInteractor } from '../useCases/trialSessions/setNoticesForCalendaredTrialSessionInteractor';
import { setPdfFormFields } from '../useCaseHelper/pdf/setPdfFormFields';
import { setServiceIndicatorsForCase } from '../utilities/setServiceIndicatorsForCase';
import { setupPdfDocument } from '../../../src/business/utilities/setupPdfDocument';
import { unsealDocketEntryInteractor } from '../useCases/docketEntry/unsealDocketEntryInteractor';
import { updateCase } from '../../persistence/dynamo/cases/updateCase';
import { updateCaseAndAssociations } from '../useCaseHelper/caseAssociation/updateCaseAndAssociations';
import { updateCaseAutomaticBlock } from '../useCaseHelper/automaticBlock/updateCaseAutomaticBlock';
import { updateCaseCorrespondence } from '../../persistence/dynamo/correspondence/updateCaseCorrespondence';
import { updateDocketEntry } from '../../persistence/dynamo/documents/updateDocketEntry';
import { updateUserRecords } from '../../persistence/dynamo/users/updateUserRecords';
import { uploadDocumentAndMakeSafeInteractor } from '../useCases/uploadDocumentAndMakeSafeInteractor';
import { validatePenaltiesInteractor } from '../useCases/validatePenaltiesInteractor';
import { verifyCaseForUser } from '../../persistence/dynamo/cases/verifyCaseForUser';
import path from 'path';
import pug from 'pug';
import sass from 'sass';

const scannerResourcePath = path.join(__dirname, '../../../shared/test-assets');

const appContextProxy = (initial = {}, makeMock = true) => {
  const applicationContextHandler = {
    get(target, myName, receiver) {
      if (!Reflect.has(target, myName)) {
        Reflect.set(target, myName, jest.fn(), receiver);
      }
      return Reflect.get(target, myName, receiver);
    },
  };
  const proxied = new Proxy(initial, applicationContextHandler);
  return makeMock ? jest.fn().mockReturnValue(proxied) : proxied;
};

export const createTestApplicationContext = ({ user } = {}) => {
  const emptyAppContextProxy = appContextProxy();

  const mockGetPdfJsReturnValue = {
    getDocument: jest.fn().mockReturnValue({
      promise: Promise.resolve({
        getPage: () => ({
          cleanup: () => {},
          getViewport: () => ({
            height: 100,
            width: 100,
          }),
          render: () => null,
        }),
        numPages: 5,
      }),
    }),
    version: '1',
  };

  const mockGetScannerReturnValue = {
    getSourceNameByIndex: jest.fn().mockReturnValue('scanner'),
    getSources: jest.fn(),
    loadDynamsoft: jest.fn().mockReturnValue('dynam-scanner-injection'),
    setSourceByIndex: jest.fn(),
    setSourceByName: jest.fn().mockReturnValue(null),
    startScanSession: jest.fn().mockReturnValue({
      scannedBuffer: [],
    }),
  };

  const mockGetReduceImageBlobValue = {
    toBlob: jest.fn(),
  };

  const mockGetDTOs = {
    ConsolidatedCaseDTO,
  };

  const mockGetUtilities = appContextProxy({
    abbreviateState: jest.fn().mockImplementation(abbreviateState),
    aggregatePartiesForService: jest
      .fn()
      .mockImplementation(aggregatePartiesForService),
    calculateISODate: jest
      .fn()
      .mockImplementation(DateHandler.calculateISODate),
    canAllowDocumentServiceForCase: jest
      .fn()
      .mockImplementation(canAllowDocumentServiceForCase),
    caseHasServedDocketEntries: jest
      .fn()
      .mockImplementation(caseHasServedDocketEntries),
    caseHasServedPetition: jest.fn().mockImplementation(caseHasServedPetition),
    checkDate: jest.fn().mockImplementation(DateHandler.checkDate),
    combineTwoPdfs: jest.fn().mockImplementation(combineTwoPdfs),
    compareCasesByDocketNumber: jest
      .fn()
      .mockImplementation(compareCasesByDocketNumber),
    compareISODateStrings: jest.fn().mockImplementation(compareISODateStrings),
    compareStrings: jest.fn().mockImplementation(compareStrings),
    computeDate: jest.fn().mockImplementation(DateHandler.computeDate),
    copyPagesAndAppendToTargetPdf: jest
      .fn()
      .mockImplementation(copyPagesAndAppendToTargetPdf),
    createEndOfDayISO: jest
      .fn()
      .mockImplementation(DateHandler.createEndOfDayISO),
    createISODateString: jest
      .fn()
      .mockImplementation(DateHandler.createISODateString),
    createISODateStringFromObject: jest
      .fn()
      .mockImplementation(DateHandler.createISODateStringFromObject),
    createStartOfDayISO: jest
      .fn()
      .mockImplementation(DateHandler.createStartOfDayISO),
    dateStringsCompared: jest
      .fn()
      .mockImplementation(DateHandler.dateStringsCompared),
    deconstructDate: jest.fn().mockImplementation(DateHandler.deconstructDate),
    filterEmptyStrings: jest.fn().mockImplementation(filterEmptyStrings),
    formatAttachments: jest.fn().mockImplementation(formatAttachments),
    formatCase: jest.fn().mockImplementation(formatCase),
    formatCaseForTrialSession: jest
      .fn()
      .mockImplementation(formatCaseForTrialSession),
    formatDateString: jest
      .fn()
      .mockImplementation(DateHandler.formatDateString),
    formatDocketEntry: jest.fn().mockImplementation(formatDocketEntry),
    formatDollars: jest.fn().mockImplementation(formatDollars),
    formatJudgeName: jest.fn().mockImplementation(formatJudgeName),
    formatNow: jest.fn().mockImplementation(DateHandler.formatNow),
    formatPhoneNumber: jest.fn().mockImplementation(formatPhoneNumber),
    getAddressPhoneDiff: jest.fn().mockImplementation(getAddressPhoneDiff),
    getAttachmentDocumentById: jest
      .fn()
      .mockImplementation(Case.getAttachmentDocumentById),
    getBusinessDateInFuture: jest
      .fn()
      .mockImplementation(DateHandler.getBusinessDateInFuture),
    getCaseCaption: jest.fn().mockImplementation(Case.getCaseCaption),
    getContactPrimary: jest.fn().mockImplementation(getContactPrimary),
    getContactSecondary: jest.fn().mockImplementation(getContactSecondary),
    getCropBox: jest.fn().mockImplementation(getCropBox),
    getDescriptionDisplay: jest.fn().mockImplementation(getDescriptionDisplay),
    getDocQcSectionForUser: jest
      .fn()
      .mockImplementation(getDocQcSectionForUser),
    getDocumentTitleWithAdditionalInfo: jest
      .fn()
      .mockImplementation(getDocumentTitleWithAdditionalInfo),
    getDocumentTypeForAddressChange: jest
      .fn()
      .mockImplementation(getDocumentTypeForAddressChange),
    getFilingsAndProceedings: jest.fn().mockReturnValue(''),
    getFormattedCaseDetail: jest
      .fn()
      .mockImplementation(getFormattedCaseDetail),
    getFormattedPartiesNameAndTitle: jest
      .fn()
      .mockImplementation(getFormattedPartiesNameAndTitle),
    getFormattedTrialSessionDetails: jest
      .fn()
      .mockImplementation(getFormattedTrialSessionDetails),
    getJudgeLastName: jest.fn().mockImplementation(getJudgeLastName),
    getJudgesChambers: jest.fn().mockImplementation(getJudgesChambers),
    getMonthDayYearInETObj: jest
      .fn()
      .mockImplementation(DateHandler.getMonthDayYearInETObj),
    getOtherFilers: jest.fn().mockImplementation(getOtherFilers),
    getPetitionDocketEntry: jest
      .fn()
      .mockImplementation(getPetitionDocketEntry),
    getPetitionerById: jest.fn().mockImplementation(getPetitionerById),
    getPractitionersRepresenting: jest
      .fn()
      .mockImplementation(getPractitionersRepresenting),
    getSealedDocketEntryTooltip: jest
      .fn()
      .mockImplementation(getSealedDocketEntryTooltip),
    getServedPartiesCode: jest.fn().mockImplementation(getServedPartiesCode),
    getSortableDocketNumber: jest
      .fn()
      .mockImplementation(Case.getSortableDocketNumber),
    getStampBoxCoordinates: jest
      .fn()
      .mockImplementation(getStampBoxCoordinates),
    getTextByCount: jest.fn().mockImplementation(getTextByCount),
    getWorkQueueFilters: jest.fn().mockImplementation(getWorkQueueFilters),
    isExternalUser: User.isExternalUser,
    isInternalUser: jest.fn().mockImplementation(User.isInternalUser),
    isLeadCase: jest.fn().mockImplementation(isLeadCase),
    isPending: jest.fn().mockImplementation(DocketEntry.isPending),
    isSealedCase: jest.fn().mockImplementation(isSealedCase),
    isServed: jest.fn().mockImplementation(isServed),
    isStandaloneRemoteSession: jest
      .fn()
      .mockImplementation(isStandaloneRemoteSession),
    isStringISOFormatted: jest
      .fn()
      .mockImplementation(DateHandler.isStringISOFormatted),
    isUserIdRepresentedByPrivatePractitioner: jest
      .fn()
      .mockImplementation(isUserIdRepresentedByPrivatePractitioner),
    isUserPartOfGroup: jest.fn().mockImplementation(isUserPartOfGroup),
    isValidDateString: jest
      .fn()
      .mockImplementation(DateHandler.isValidDateString),
    prepareDateFromString: jest
      .fn()
      .mockImplementation(DateHandler.prepareDateFromString),
    replaceBracketed: jest.fn().mockImplementation(replaceBracketed),

    serveCaseDocument: jest.fn().mockImplementation(serveCaseDocument),
    setConsolidationFlagsForDisplay: jest
      .fn()
      .mockImplementation(setConsolidationFlagsForDisplay),
    setServiceIndicatorsForCase: jest
      .fn()
      .mockImplementation(setServiceIndicatorsForCase),
    setupPdfDocument: jest.fn().mockImplementation(setupPdfDocument),
    sortDocketEntries: jest.fn().mockImplementation(sortDocketEntries),
    uploadToS3: jest.fn(),
    validateDateAndCreateISO: jest
      .fn()
      .mockImplementation(DateHandler.validateDateAndCreateISO),
  });

  const mockGetHttpClientReturnValue = {
    get: () => ({
      data: 'url',
    }),
    post: jest.fn(),
  };

  const mockGetUseCases = appContextProxy({
    generateNoticesForCaseTrialSessionCalendarInteractor: jest
      .fn()
      .mockImplementation(generateNoticesForCaseTrialSessionCalendarInteractor),
    sealCaseInteractor: jest.fn().mockImplementation(sealCaseInteractor),
    sealDocketEntryInteractor: jest
      .fn()
      .mockImplementation(sealDocketEntryInteractor),
    setNoticesForCalendaredTrialSessionInteractor: jest
      .fn()
      .mockImplementation(setNoticesForCalendaredTrialSessionInteractor),
    unsealDocketEntryInteractor: jest
      .fn()
      .mockImplementation(unsealDocketEntryInteractor),
    uploadDocumentAndMakeSafeInteractor: jest
      .fn()
      .mockImplementation(uploadDocumentAndMakeSafeInteractor),
    validatePenaltiesInteractor: jest
      .fn()
      .mockImplementation(validatePenaltiesInteractor),
  });

  const mockGetUseCaseHelpers = appContextProxy({
    addDocketEntryForSystemGeneratedOrder: jest
      .fn()
      .mockImplementation(addDocketEntryForSystemGeneratedOrder),
    createCaseAndAssociations: jest
      .fn()
      .mockImplementation(createCaseAndAssociations),
    fileAndServeDocumentOnOneCase: jest
      .fn()
      .mockImplementation(fileAndServeDocumentOnOneCase),
    generateAndServeDocketEntry: jest
      .fn()
      .mockImplementation(generateAndServeDocketEntry),
    getJudgeInSectionHelper: jest.fn(),
    getUserIdForNote: jest.fn().mockImplementation(getUserIdForNote),
    removeCounselFromRemovedPetitioner: jest
      .fn()
      .mockImplementation(removeCounselFromRemovedPetitioner),
    sendServedPartiesEmails: jest.fn(),
    setPdfFormFields: jest.fn().mockImplementation(setPdfFormFields),
    updateCaseAndAssociations: jest
      .fn()
      .mockImplementation(updateCaseAndAssociations),
    updateCaseAutomaticBlock: jest
      .fn()
      .mockImplementation(updateCaseAutomaticBlock),
    updateUserRecords: jest.fn().mockImplementation(updateUserRecords),
  });

  const getDocumentGeneratorsReturnMock = {
    addressLabelCoverSheet: jest.fn().mockImplementation(getFakeFile),
    caseInventoryReport: jest.fn().mockImplementation(getFakeFile),
    changeOfAddress: jest.fn().mockImplementation(getFakeFile),
    coverSheet: jest.fn().mockImplementation(getFakeFile),
    docketRecord: jest.fn().mockImplementation(getFakeFile),
    noticeOfChangeOfTrialJudge: jest.fn().mockImplementation(getFakeFile),
    noticeOfChangeToInPersonProceeding: jest
      .fn()
      .mockImplementation(getFakeFile),
    noticeOfChangeToRemoteProceeding: jest.fn().mockImplementation(getFakeFile),
    noticeOfDocketChange: jest.fn().mockImplementation(getFakeFile),
    noticeOfReceiptOfPetition: jest.fn().mockImplementation(getFakeFile),
    noticeOfTrialIssued: jest.fn().mockImplementation(getFakeFile),
    noticeOfTrialIssuedInPerson: jest.fn().mockImplementation(getFakeFile),
    order: jest.fn().mockImplementation(getFakeFile),
    pendingReport: jest.fn().mockImplementation(getFakeFile),
    practitionerCaseList: jest.fn().mockImplementation(getFakeFile),
    printableWorkingCopySessionList: jest.fn().mockImplementation(getFakeFile),
    receiptOfFiling: jest.fn().mockImplementation(getFakeFile),
    standingPretrialOrder: jest.fn().mockImplementation(getFakeFile),
    standingPretrialOrderForSmallCase: jest
      .fn()
      .mockImplementation(getFakeFile),
    trialCalendar: jest.fn().mockImplementation(getFakeFile),
    trialSessionPlanningReport: jest.fn().mockImplementation(getFakeFile),
  };

  const mockGetChromiumBrowserReturnValue = {
    close: jest.fn(),
    newPage: jest.fn().mockReturnValue({
      pdf: jest.fn(),
      setContent: jest.fn(),
    }),
  };

  const mockGetStorageClient = appContextProxy({
    deleteObject: jest.fn().mockReturnValue({ promise: () => {} }),
    getObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ Body: 's3-get-object-body' }),
    }),
    putObject: jest.fn().mockReturnValue({ promise: () => {} }),
  });

  const mockGetPersistenceGateway = appContextProxy({
    acquireLock: jest.fn().mockImplementation(() => Promise.resolve(null)),
    addCaseToHearing: jest.fn(),
    bulkDeleteRecords: jest.fn().mockImplementation(bulkDeleteRecords),
    bulkIndexRecords: jest.fn().mockImplementation(bulkIndexRecords),
    createCase: jest.fn().mockImplementation(createCase),
    createCaseTrialSortMappingRecords: jest.fn(),
    createElasticsearchReindexRecord: jest.fn(),
    deleteCaseTrialSortMappingRecords: jest.fn(),
    deleteDocumentFile: jest.fn(),
    deleteElasticsearchReindexRecord: jest.fn(),
    deleteKeyCount: jest.fn(),
    deleteLock: jest.fn().mockImplementation(() => Promise.resolve(null)),
    deleteRecord: jest.fn().mockImplementation(deleteRecord),
    deleteWorkItem: jest.fn(deleteWorkItem),
    fetchPendingItems: jest.fn(),
    getAllWebSocketConnections: jest
      .fn()
      .mockImplementation(getAllWebSocketConnections),
    getCalendaredCasesForTrialSession: jest.fn(),
    getCaseByDocketNumber: jest.fn().mockImplementation(getCaseByDocketNumber),
    getCaseDeadlinesByDateRange: jest.fn(),
    getCaseDeadlinesByDocketNumber: jest
      .fn()
      .mockImplementation(getCaseDeadlinesByDocketNumber),
    getChambersSections: jest.fn().mockImplementation(getChambersSections),
    getChambersSectionsLabels: jest
      .fn()
      .mockImplementation(getChambersSectionsLabels),
    getDispatchNotification: jest.fn(),
    getDocument: jest.fn(),
    getDocumentQCInboxForSection: jest.fn(),
    getDocumentQCInboxForUser: jest.fn(),
    getDocumentQCServedForSection: jest
      .fn()
      .mockImplementation(getDocumentQCInboxForSectionPersistence),
    getDownloadPolicyUrl: jest
      .fn()
      .mockReturnValue({ url: 'http://example.com/' }),
    getElasticsearchReindexRecords: jest.fn(),
    getItem: jest.fn().mockImplementation(getItem),
    getJudgesChambers: jest.fn().mockImplementation(getJudgesChambers),
    getJudgesChambersWithLegacy: jest
      .fn()
      .mockImplementation(getJudgesChambersWithLegacy),
    getLimiterByKey: jest.fn(),
    getMaintenanceMode: jest.fn(),
    getMessagesByDocketNumber: jest.fn(),
    getPractitionerDocuments: jest.fn(),
    getReconciliationReport: jest.fn(),
    getRecord: jest.fn(),
    getTrialSessionJobStatusForCase: jest.fn(),
    getUserById: jest.fn().mockImplementation(getUserByIdPersistence),
    getUserCaseMappingsByDocketNumber: jest.fn().mockReturnValue([]),
    getWorkItemById: jest.fn().mockImplementation(getWorkItemByIdPersistence),
    getWorkItemsByDocketNumber: jest.fn().mockReturnValue([]),
    incrementCounter,
    incrementKeyCount: jest.fn(),
    isEmailAvailable: jest.fn(),
    isFileExists: jest.fn(),
    persistUser: jest.fn(),
    putWorkItemInOutbox: jest.fn().mockImplementation(putWorkItemInOutbox),
    removeItem: jest.fn().mockImplementation(removeItem),
    saveDispatchNotification: jest.fn(),
    saveDocumentFromLambda: jest.fn(),
    saveWorkItem: jest.fn().mockImplementation(saveWorkItem),
    setExpiresAt: jest.fn(),
    setItem: jest.fn().mockImplementation(setItem),
    setPriorityOnAllWorkItems: jest.fn(),
    setTrialSessionJobStatusForCase: jest.fn(),
    updateCase: jest.fn().mockImplementation(updateCase),
    updateCaseCorrespondence: jest
      .fn()
      .mockImplementation(updateCaseCorrespondence),
    updateCaseHearing: jest.fn(),
    updateDocketEntry: jest.fn().mockImplementation(updateDocketEntry),
    uploadPdfFromClient: jest.fn().mockImplementation(() => ''),
    verifyCaseForUser: jest.fn().mockImplementation(verifyCaseForUser),
  });

  const mockGetEmailClient = {
    sendBulkTemplatedEmail: jest.fn(),
  };

  const mockGetMessagingClient = {
    deleteMessage: jest.fn().mockReturnValue({ promise: () => {} }),
    sendMessage: jest.fn().mockReturnValue({ promise: () => {} }),
  };

  const mockDocumentClient = createMockDocumentClient();

  const mockCreateDocketNumberGenerator = {
    createDocketNumber: jest.fn().mockImplementation(createDocketNumber),
  };

  const mockBroadcastGateway = {
    postMessage: jest.fn(),
  };

  const mockGetNotificationService = {
    publish: jest.fn().mockReturnValue({
      promise: () => Promise.resolve('ok'),
    }),
  };

  const applicationContext = {
    barNumberGenerator: {
      createBarNumber: jest.fn().mockReturnValue('CS20001'),
    },
    convertBlobToUInt8Array: jest
      .fn()
      .mockImplementation(() => new Uint8Array([])),
    docketNumberGenerator: mockCreateDocketNumberGenerator,
    documentUrlTranslator: jest.fn().mockImplementation(documentUrlTranslator),
    environment: {
      appEndpoint: 'localhost:1234',
      dynamoDbTableName: 'efcms-local',
      stage: 'local',
      tempDocumentsBucketName: 'MockDocumentBucketName',
    },
    filterCaseMetadata: jest.fn(),
    getAppEndpoint: () => 'localhost:1234',
    getBaseUrl: () => 'http://localhost',
    getBounceAlertRecipients: jest.fn(),
    getBroadcastGateway: jest.fn().mockReturnValue(mockBroadcastGateway),
    getCaseTitle: jest.fn().mockImplementation(Case.getCaseTitle),
    getChromiumBrowser: jest.fn().mockImplementation(() => {
      return mockGetChromiumBrowserReturnValue;
    }),
    getClerkOfCourtNameForSigning: jest.fn(),
    getCognito: appContextProxy({
      adminCreateUser: jest.fn().mockReturnValue({
        promise: jest.fn(),
      }),
      adminUpdateUserAttributes: jest.fn().mockReturnValue({
        promise: jest.fn(),
      }),
    }),
    getCognitoClientId: jest.fn(),
    getCognitoLoginUrl,
    getCognitoRedirectUrl: jest.fn(),
    getCognitoTokenUrl: jest.fn(),
    getConstants: jest.fn().mockImplementation(() => {
      return {
        ...getConstants(),
        ERROR_MAP_429,
      };
    }),
    getCurrentUser: jest.fn().mockImplementation(() => {
      return new User(
        user || {
          name: 'richard',
          role: ROLES.petitioner,
          userId: 'a805d1ab-18d0-43ec-bafb-654e83405416',
        },
      );
    }),
    getCurrentUserPermissions: jest.fn(),
    getCurrentUserToken: () => {
      return '';
    },
    getDTOs: jest.fn().mockImplementation(() => mockGetDTOs),
    getDispatchers: jest.fn().mockReturnValue({
      sendBulkTemplatedEmail: jest.fn(),
      sendNotificationOfSealing: jest.fn(),
      sendSlackNotification: jest.fn(),
    }),
    getDocumentClient: jest.fn().mockImplementation(() => mockDocumentClient),
    getDocumentGenerators: jest
      .fn()
      .mockReturnValue(getDocumentGeneratorsReturnMock),
    getDocumentsBucketName: jest.fn().mockReturnValue('DocumentBucketName'),
    getEmailClient: jest.fn().mockReturnValue(mockGetEmailClient),
    getEntityByName: jest.fn(),
    getEnvironment: jest.fn().mockReturnValue({
      stage: 'local',
    }),
    getFileReaderInstance: jest.fn(),
    getHttpClient: jest.fn().mockReturnValue(mockGetHttpClientReturnValue),
    getIrsSuperuserEmail: jest.fn(),
    getLogger: jest.fn().mockReturnValue({
      error: jest.fn(),
    }),
    getMessageGateway: appContextProxy({
      sendCalendarSessionEvent: jest.fn(),
      sendEmailEventToQueue: jest.fn(),
      sendSetTrialSessionCalendarEvent: jest.fn(),
      sendUpdatePetitionerCasesMessage: jest.fn(),
    }),
    getMessagingClient: jest.fn().mockReturnValue(mockGetMessagingClient),
    getNodeSass: jest.fn().mockReturnValue(sass),
    getNotificationClient: jest.fn(),
    getNotificationGateway: emptyAppContextProxy,
    getNotificationService: jest
      .fn()
      .mockReturnValue(mockGetNotificationService),
    getPdfJs: jest.fn().mockReturnValue(mockGetPdfJsReturnValue),
    getPdfLib: jest.fn().mockResolvedValue(pdfLib),
    getPersistenceGateway: mockGetPersistenceGateway,
    getPublicSiteUrl,
    getPug: jest.fn().mockReturnValue(pug),
    getQuarantineBucketName: jest.fn().mockReturnValue('QuarantineBucketName'),
    getReduceImageBlob: jest.fn().mockReturnValue(mockGetReduceImageBlobValue),
    getScanner: jest.fn().mockReturnValue(mockGetScannerReturnValue),
    getScannerResourceUri: jest.fn().mockReturnValue(scannerResourcePath),
    getSearchClient: emptyAppContextProxy,
    getSlackWebhookUrl: jest.fn(),
    getStorageClient: mockGetStorageClient,
    getTempDocumentsBucketName: jest.fn(),
    getUniqueId: jest.fn().mockImplementation(getUniqueId),
    getUseCaseHelpers: mockGetUseCaseHelpers,
    getUseCases: mockGetUseCases,
    getUtilities: mockGetUtilities,
    isFeatureEnabled: jest.fn(),
    logger: {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    },
    runVirusScan: jest.fn(),
    setCurrentUser: jest.fn(),
    setCurrentUserToken: jest.fn(),
  };
  return applicationContext;
};

export const applicationContext = createTestApplicationContext();

/*
  If you receive an error when testing cerebral that says:
  `The property someProperty passed to Provider is not a method`
  it is because the cerebral testing framework expects all objects on the
  applicationContext to be functions.  The code below walks the original
  applicationContext and adds ONLY the functions to the
  applicationContextForClient.
*/
const intermediary = {};
Object.entries(applicationContext).forEach(([key, value]) => {
  if (typeof value === 'function') {
    intermediary[key] = value;
  }
});
export const applicationContextForClient =
  intermediary as ClientApplicationContext;
