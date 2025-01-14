import { clearErrorAlertsAction } from '../actions/clearErrorAlertsAction';
import { completeDocketEntryQCAction } from '../actions/EditDocketRecord/completeDocketEntryQCAction';
import { computeCertificateOfServiceFormDateAction } from '../actions/FileDocument/computeCertificateOfServiceFormDateAction';
import { formHasSecondaryDocumentAction } from '../actions/FileDocument/formHasSecondaryDocumentAction';
import { generateTitleAction } from '../actions/FileDocument/generateTitleAction';
import { getCaseAction } from '../actions/getCaseAction';
import { getComputedFormDateFactoryAction } from '../actions/getComputedFormDateFactoryAction';
import { isWorkItemAlreadyCompletedAction } from '../actions/isWorkItemAlreadyCompletedAction';
import { navigateToDocumentQCAction } from '../actions/navigateToDocumentQCAction';
import { refreshExternalDocumentTitleFromEventCodeAction } from '../actions/FileDocument/refreshExternalDocumentTitleFromEventCodeAction';
import { setAlertErrorAction } from '../actions/setAlertErrorAction';
import { setAlertSuccessAction } from '../actions/setAlertSuccessAction';
import { setCaseAction } from '../actions/setCaseAction';
import { setComputeFormDateFactoryAction } from '../actions/setComputeFormDateFactoryAction';
import { setFilersFromFilersMapAction } from '../actions/setFilersFromFilersMapAction';
import { setPaperServicePartiesAction } from '../actions/setPaperServicePartiesAction';
import { setPdfPreviewUrlAction } from '../actions/CourtIssuedOrder/setPdfPreviewUrlAction';
import { setPreviousDocumentDocketEntryAction } from '../actions/FileDocument/setPreviousDocumentDocketEntryAction';
import { setSaveAlertsForNavigationAction } from '../actions/setSaveAlertsForNavigationAction';
import { setShowModalFactoryAction } from '../actions/setShowModalFactoryAction';
import { setValidationAlertErrorsAction } from '../actions/setValidationAlertErrorsAction';
import { setValidationErrorsAction } from '../actions/setValidationErrorsAction';
import { showProgressSequenceDecorator } from '../utilities/showProgressSequenceDecorator';
import { startShowValidationAction } from '../actions/startShowValidationAction';
import { stopShowValidationAction } from '../actions/stopShowValidationAction';
import { switchErrorActionFactory } from '../actions/switchErrorActionFactory';
import { validateDocketEntryAction } from '../actions/DocketEntry/validateDocketEntryAction';

export const completeDocketEntryQCSequence = [
  getCaseAction,
  setCaseAction,
  isWorkItemAlreadyCompletedAction,
  {
    no: [
      startShowValidationAction,
      getComputedFormDateFactoryAction(null),
      formHasSecondaryDocumentAction,
      {
        no: [],
        yes: [
          getComputedFormDateFactoryAction('secondaryDocument.serviceDate'),
          setComputeFormDateFactoryAction('secondaryDocument.serviceDate'),
        ],
      },
      computeCertificateOfServiceFormDateAction,
      getComputedFormDateFactoryAction('dateReceived'),
      setComputeFormDateFactoryAction('dateReceived'),
      getComputedFormDateFactoryAction('serviceDate'),
      setComputeFormDateFactoryAction('serviceDate'),
      setFilersFromFilersMapAction,
      validateDocketEntryAction,
      {
        error: [
          setAlertErrorAction,
          setValidationErrorsAction,
          setValidationAlertErrorsAction,
        ],
        success: showProgressSequenceDecorator([
          stopShowValidationAction,
          refreshExternalDocumentTitleFromEventCodeAction,
          setPreviousDocumentDocketEntryAction,
          generateTitleAction,
          completeDocketEntryQCAction,
          {
            error: [
              switchErrorActionFactory({
                'currently being updated': 'completed',
              }),
              {
                completed: [
                  setShowModalFactoryAction('WorkItemAlreadyCompletedModal'),
                ],
                default: [setShowModalFactoryAction('GenericErrorModal')],
              },
            ],
            success: [
              setPdfPreviewUrlAction,
              setCaseAction,
              setAlertSuccessAction,
              setPaperServicePartiesAction,
              setSaveAlertsForNavigationAction,
              navigateToDocumentQCAction,
              clearErrorAlertsAction,
            ],
          },
        ]),
      },
    ],
    yes: [setShowModalFactoryAction('WorkItemAlreadyCompletedModal')],
  },
];
