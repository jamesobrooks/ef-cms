import { clearFormAction } from '../actions/clearFormAction';
import { clearScansAction } from '../actions/clearScansAction';
import { clearScreenMetadataAction } from '../actions/clearScreenMetadataAction';
import { getCaseAction } from '../actions/getCaseAction';
import { isLoggedInAction } from '../actions/isLoggedInAction';
import { redirectToCognitoAction } from '../actions/redirectToCognitoAction';
import { resetAddCorrespondenceAction } from '../actions/resetAddCorrespondenceAction';
import { setCaseAction } from '../actions/setCaseAction';
import { setCurrentPageAction } from '../actions/setCurrentPageAction';
import { startWebSocketConnectionSequenceDecorator } from '../utilities/startWebSocketConnectionSequenceDecorator';
import { stopShowValidationAction } from '../actions/stopShowValidationAction';

const gotoUploadCorrespondenceDocument =
  startWebSocketConnectionSequenceDecorator([
    setCurrentPageAction('Interstitial'),
    stopShowValidationAction,
    clearScansAction,
    clearFormAction,
    clearScreenMetadataAction,
    getCaseAction,
    setCaseAction,
    resetAddCorrespondenceAction,
    setCurrentPageAction('AddCorrespondenceDocument'),
  ]);

export const gotoUploadCorrespondenceDocumentSequence = [
  isLoggedInAction,
  {
    isLoggedIn: [gotoUploadCorrespondenceDocument],
    unauthorized: [redirectToCognitoAction],
  },
];
