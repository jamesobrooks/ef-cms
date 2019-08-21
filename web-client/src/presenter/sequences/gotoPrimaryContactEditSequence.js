import { clearAlertsAction } from '../actions/clearAlertsAction';
import { clearFormAction } from '../actions/clearFormAction';
import { clearScreenMetadataAction } from '../actions/clearScreenMetadataAction';
import { getCaseAction } from '../actions/getCaseAction';
import { isLoggedInAction } from '../actions/isLoggedInAction';
import { redirectToCognitoAction } from '../actions/redirectToCognitoAction';
import { setCaseAction } from '../actions/setCaseAction';
import { setCaseBackupAction } from '../actions/setCaseBackupAction';
import { setCurrentPageAction } from '../actions/setCurrentPageAction';
import { startShowValidationAction } from '../actions/startShowValidationAction';

const gotoPrimaryContactEdit = [
  setCurrentPageAction('Interstitial'),
  startShowValidationAction,
  clearAlertsAction,
  clearFormAction,
  clearScreenMetadataAction,
  getCaseAction,
  setCaseBackupAction,
  setCaseAction,
  setCurrentPageAction('PrimaryContactEdit'),
];

export const gotoPrimaryContactEditSequence = [
  isLoggedInAction,
  {
    isLoggedIn: gotoPrimaryContactEdit,
    unauthorized: [redirectToCognitoAction],
  },
];
