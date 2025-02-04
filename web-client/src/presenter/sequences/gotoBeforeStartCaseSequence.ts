import { setCurrentPageAction } from '../actions/setCurrentPageAction';
import { startWebSocketConnectionSequenceDecorator } from '../utilities/startWebSocketConnectionSequenceDecorator';

export const gotoBeforeStartCaseSequence =
  startWebSocketConnectionSequenceDecorator([
    setCurrentPageAction('BeforeStartingCase'),
  ]);
