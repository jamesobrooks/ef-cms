import { find, orderBy } from 'lodash';
import {
  getOptionsForCategory,
  getPreviouslyFiledDocuments,
} from './selectDocumentTypeHelper';
import { state } from 'cerebral';
import { supportingDocumentFreeTextTypes } from './fileDocumentHelper';

const getInternalDocumentTypes = typeMap => {
  let filteredTypeList = [];
  Object.keys(typeMap).forEach(category => {
    filteredTypeList.push(...typeMap[category]);
  });
  filteredTypeList = filteredTypeList.map(e => {
    return { label: e.documentType, value: e.eventCode };
  });
  return orderBy(filteredTypeList, ['label'], ['asc']);
};

export const getSupportingDocumentTypeList = categoryMap => {
  return categoryMap['Supporting Document'].map(entry => {
    const entryCopy = { ...entry }; //to prevent against modifying constants
    entryCopy.documentTypeDisplay = entryCopy.documentType.replace(
      /\sin\sSupport$/i,
      '',
    );
    return entryCopy;
  });
};

export const addDocketEntryHelper = (get, applicationContext) => {
  const { INTERNAL_CATEGORY_MAP } = applicationContext.getConstants();
  const caseDetail = get(state.caseDetail);
  if (!caseDetail.partyType) {
    return {};
  }
  const showDateReceivedEdit = caseDetail.isPaper;
  const documentIdWhitelist = get(state.screenMetadata.filedDocumentIds);
  const form = get(state.form);

  const internalDocumentTypes = getInternalDocumentTypes(INTERNAL_CATEGORY_MAP);

  const supportingDocumentTypeList = getSupportingDocumentTypeList(
    INTERNAL_CATEGORY_MAP,
  );

  const objectionDocumentTypes = [
    ...INTERNAL_CATEGORY_MAP['Motion'].map(entry => {
      return entry.documentType;
    }),
    'Motion to Withdraw Counsel (filed by petitioner)',
    'Motion to Withdraw as Counsel',
    'Application to Take Deposition',
  ];

  const amendmentEventCodes = ['AMAT', 'ADMT'];

  const { certificateOfServiceDate } = form;
  let certificateOfServiceDateFormatted;
  if (certificateOfServiceDate) {
    certificateOfServiceDateFormatted = applicationContext
      .getUtilities()
      .formatDateString(certificateOfServiceDate, 'MMDDYY');
  }

  const previouslyFiledWizardDocuments = getPreviouslyFiledDocuments(
    applicationContext,
    caseDetail,
    documentIdWhitelist,
  );

  const selectedEventCode = form.eventCode;
  const secondarySelectedEventCode = get(
    state.form.secondaryDocument.eventCode,
  );

  let categoryInformation;
  let secondaryCategoryInformation;

  find(
    INTERNAL_CATEGORY_MAP,
    entries =>
      (categoryInformation = find(entries, { eventCode: selectedEventCode })),
  );

  find(
    INTERNAL_CATEGORY_MAP,
    entries =>
      (secondaryCategoryInformation = find(entries, {
        eventCode: secondarySelectedEventCode,
      })),
  );

  const optionsForCategory = getOptionsForCategory(
    applicationContext,
    caseDetail,
    categoryInformation,
  );

  const secondaryOptionsForCategory = getOptionsForCategory(
    applicationContext,
    caseDetail,
    secondaryCategoryInformation,
  );

  if (optionsForCategory.showSecondaryDocumentSelect) {
    optionsForCategory.showSecondaryDocumentSelect = false;
    optionsForCategory.showSecondaryDocumentForm = true;
  }

  const showTrackOption = !applicationContext
    .getUtilities()
    .isPendingOnCreation(form);

  return {
    certificateOfServiceDateFormatted,
    internalDocumentTypes,
    previouslyFiledWizardDocuments,
    primary: optionsForCategory,
    secondary: secondaryOptionsForCategory,
    showDateReceivedEdit,
    showObjection:
      objectionDocumentTypes.includes(form.documentType) ||
      (amendmentEventCodes.includes(form.eventCode) &&
        objectionDocumentTypes.includes(form.previousDocument?.documentType)),
    showPrimaryDocumentValid: !!form.primaryDocumentFile,
    showSecondaryDocumentValid: !!form.secondaryDocumentFile,
    showSecondarySupportingDocumentValid: !!form.secondarySupportingDocumentFile,
    showSupportingDocumentFreeText: supportingDocumentFreeTextTypes.includes(
      form.documentType,
    ),
    showSupportingDocumentSelect: form.documentType && form.documentType !== '',
    showSupportingDocumentValid: !!form.supportingDocumentFile,
    showTrackOption,
    supportingDocumentTypeList,
  };
};
