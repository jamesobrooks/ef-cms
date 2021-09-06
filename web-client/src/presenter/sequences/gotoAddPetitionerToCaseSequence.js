import { clearFormAction } from '../actions/clearFormAction';
import { getCaseAction } from '../actions/getCaseAction';
import { isLoggedInAction } from '../actions/isLoggedInAction';
import { redirectToCognitoAction } from '../actions/redirectToCognitoAction';
import { setCaseAction } from '../actions/setCaseAction';
import { setCurrentPageAction } from '../actions/setCurrentPageAction';
import { setDefaultAddPetitionerToCaseFormAction } from '../actions/setDefaultAddPetitionerToCaseFormAction';
import { startWebSocketConnectionSequenceDecorator } from '../utilities/startWebSocketConnectionSequenceDecorator';
import { stopShowValidationAction } from '../actions/stopShowValidationAction';

export const gotoAddPetitionerToCaseSequence =
  startWebSocketConnectionSequenceDecorator([
    isLoggedInAction,
    {
      isLoggedIn: [
        setCurrentPageAction('Interstitial'),
        stopShowValidationAction,
        clearFormAction,
        getCaseAction,
        setCaseAction,
        setDefaultAddPetitionerToCaseFormAction,
        setCurrentPageAction('AddPetitionerToCase'),
      ],
      unauthorized: [redirectToCognitoAction],
    },
  ]);
