import { clearAlertsAction } from '../actions/clearAlertsAction';
import { computeFilingFormDateAction } from '../actions/FileDocument/computeFilingFormDateAction';
import { computeFormDateFactoryAction } from '../actions/computeFormDateFactoryAction';
import { setComputeFormDateFactoryAction } from '../actions/setComputeFormDateFactoryAction';
import { setComputeFormDayFactoryAction } from '../actions/setComputeFormDayFactoryAction';
import { setComputeFormMonthFactoryAction } from '../actions/setComputeFormMonthFactoryAction';
import { setComputeFormYearFactoryAction } from '../actions/setComputeFormYearFactoryAction';
import { setValidationErrorsByFlagAction } from '../actions/WorkItem/setValidationErrorsByFlagAction';
import { shouldValidateAction } from '../actions/shouldValidateAction';
import { validateDocumentAction } from '../actions/EditDocketRecordEntry/validateDocumentAction';

export const validateDocumentSequence = [
  shouldValidateAction,
  {
    ignore: [],
    validate: [
      computeFilingFormDateAction,
      setComputeFormDayFactoryAction('dateReceivedDay'),
      setComputeFormMonthFactoryAction('dateReceivedMonth'),
      setComputeFormYearFactoryAction('dateReceivedYear'),
      computeFormDateFactoryAction(null),
      setComputeFormDateFactoryAction('dateReceived'),
      validateDocumentAction,
      {
        error: [setValidationErrorsByFlagAction],
        success: [clearAlertsAction],
      },
    ],
  },
];
