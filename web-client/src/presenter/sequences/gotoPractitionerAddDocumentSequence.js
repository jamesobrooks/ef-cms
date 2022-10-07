import { getPractitionerDetailAction } from '../actions/getPractitionerDetailAction';
import { isLoggedInAction } from '../actions/isLoggedInAction';
import { redirectToCognitoAction } from '../actions/redirectToCognitoAction';
import { setCurrentPageAction } from '../actions/setCurrentPageAction';
import { setPractitionerDetailAction } from '../actions/setPractitionerDetailAction';
import { startWebSocketConnectionSequenceDecorator } from '../utilities/startWebSocketConnectionSequenceDecorator';
import { stopShowValidationAction } from '../actions/stopShowValidationAction';

export const gotoPractitionerAddDocument = [
  setCurrentPageAction('Interstitial'),
  stopShowValidationAction,
  getPractitionerDetailAction,
  setPractitionerDetailAction,
  setCurrentPageAction('PractitionerAddDocument'),
];

export const gotoPractitionerAddDocumentSequence = [
  isLoggedInAction,
  {
    isLoggedIn: startWebSocketConnectionSequenceDecorator(
      gotoPractitionerAddDocument,
    ),
    unauthorized: [redirectToCognitoAction],
  },
];
