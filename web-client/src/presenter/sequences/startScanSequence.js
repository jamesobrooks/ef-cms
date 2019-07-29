import { areSelectedDocumentsMatchingAction } from '../actions/areSelectedDocumentsMatchingAction';
import { changeToNewScanBatchAction } from '../actions/changeToNewScanBatchAction';
import { clearModalAction } from '../actions/clearModalAction';
import { getCachedScannerSourceAction } from '../actions/getCachedScannerSourceAction';
import { getScannerSourcesAction } from '../actions/getScannerSourcesAction';
import { set } from 'cerebral/factories';
import { setFormSubmittingAction } from '../actions/setFormSubmittingAction';
import { startScanAction } from '../actions/startScanAction';
import { state } from 'cerebral';
import { unsetFormSubmittingAction } from '../actions/unsetFormSubmittingAction';
import { waitForSpinnerAction } from '../actions/waitForSpinnerAction';

export const startScanSequence = [
  clearModalAction,
  areSelectedDocumentsMatchingAction,
  {
    no: [set(state.showModal, 'UnfinishedScansModal')],
    yes: [
      setFormSubmittingAction,
      waitForSpinnerAction,
      getCachedScannerSourceAction,
      {
        selectSource: [
          getScannerSourcesAction,
          set(state.showModal, 'SelectScannerSourceModal'),
        ],
        success: [startScanAction],
      },
      unsetFormSubmittingAction,
    ],
  },
];
