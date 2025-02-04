import { clearModalStateAction } from '../actions/clearModalStateAction';
import { generateDocketRecordPdfUrlAction } from '../actions/generateDocketRecordPdfUrlAction';
import { getCaseAction } from '../actions/getCaseAction';
import { getCaseAssociationAction } from '../actions/getCaseAssociationAction';
import { getConsolidatedCasesByCaseAction } from '../actions/CaseConsolidation/getConsolidatedCasesByCaseAction';
import { setCaseAction } from '../actions/setCaseAction';
import { setConsolidatedCasesForCaseAction } from '../actions/CaseConsolidation/setConsolidatedCasesForCaseAction';
import { setPdfPreviewUrlSequence } from './setPdfPreviewUrlSequence';
import { setShowModalFactoryAction } from '../actions/setShowModalFactoryAction';
import { showProgressSequenceDecorator } from '../utilities/showProgressSequenceDecorator';
import { startWebSocketConnectionSequenceDecorator } from '../utilities/startWebSocketConnectionSequenceDecorator';

export const gotoPrintableDocketRecordSequence =
  startWebSocketConnectionSequenceDecorator(
    showProgressSequenceDecorator([
      clearModalStateAction,
      getCaseAction,
      setCaseAction,
      getConsolidatedCasesByCaseAction,
      setConsolidatedCasesForCaseAction,
      getCaseAssociationAction,
      generateDocketRecordPdfUrlAction,
      setPdfPreviewUrlSequence,
      setShowModalFactoryAction('OpenPrintableDocketRecordModal'),
    ]),
  );
