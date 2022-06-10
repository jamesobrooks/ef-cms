import { docketClerkConsolidatesCaseThatCannotBeConsolidated } from './journey/docketClerkConsolidatesCaseThatCannotBeConsolidated';
import { docketClerkConsolidatesCases } from './journey/docketClerkConsolidatesCases';
import { docketClerkCreatesAnOrder } from './journey/docketClerkCreatesAnOrder';
import { docketClerkOpensCaseConsolidateModal } from './journey/docketClerkOpensCaseConsolidateModal';
import { docketClerkSearchesForCaseToConsolidateWith } from './journey/docketClerkSearchesForCaseToConsolidateWith';
import { docketClerkServesDocumentOnLeadCase } from './journey/docketClerkServesDocumentOnLeadCase';
import { docketClerkSignsOrder } from './journey/docketClerkSignsOrder';
import { docketClerkUnconsolidatesLeadCase } from './journey/docketClerkUnconsolidatesLeadCase';
import { docketClerkUpdatesCaseStatusToReadyForTrial } from './journey/docketClerkUpdatesCaseStatusToReadyForTrial';
import { loginAs, setupTest, uploadPetition } from './helpers';
import { petitionerVerifiesConsolidatedCases } from './journey/petitionerVerifiesConsolidatedCases';
import { petitionerVerifiesUnconsolidatedCases } from './journey/petitionerVerifiesUnconsolidatedCases';
import { petitionerViewsDashboard } from './journey/petitionerViewsDashboard';

const cerebralTest = setupTest();
const trialLocation = `Boise, Idaho, ${Date.now()}`;

const overrides = {
  preferredTrialCity: trialLocation,
  trialLocation,
};

describe('Case Consolidation Journey', () => {
  beforeAll(() => {
    jest.setTimeout(30000);
  });

  afterAll(() => {
    cerebralTest.closeSocket();
  });

  it('login as a petitioner and create the lead case', async () => {
    const caseDetail = await uploadPetition(cerebralTest, overrides);
    expect(caseDetail.docketNumber).toBeDefined();
    cerebralTest.docketNumber = cerebralTest.leadDocketNumber =
      caseDetail.docketNumber;
  });

  loginAs(cerebralTest, 'docketclerk@example.com');
  docketClerkUpdatesCaseStatusToReadyForTrial(cerebralTest);

  it('login as a petitioner and create a case that cannot be consolidated with the lead case', async () => {
    //not passing in overrides to preferredTrialCity to ensure case cannot be consolidated
    const caseDetail = await uploadPetition(cerebralTest);
    expect(caseDetail.docketNumber).toBeDefined();
    cerebralTest.docketNumberDifferentPlaceOfTrial = caseDetail.docketNumber;
  });

  loginAs(cerebralTest, 'docketclerk@example.com');
  docketClerkUpdatesCaseStatusToReadyForTrial(cerebralTest);
  docketClerkOpensCaseConsolidateModal(cerebralTest);
  docketClerkSearchesForCaseToConsolidateWith(cerebralTest);
  docketClerkConsolidatesCaseThatCannotBeConsolidated(cerebralTest);

  it('login as a petitioner and create a case to consolidate with', async () => {
    cerebralTest.docketNumberDifferentPlaceOfTrial = null;
    const caseDetail = await uploadPetition(cerebralTest, overrides);
    expect(caseDetail.docketNumber).toBeDefined();
    cerebralTest.docketNumber = caseDetail.docketNumber;
  });

  loginAs(cerebralTest, 'docketclerk@example.com');
  docketClerkUpdatesCaseStatusToReadyForTrial(cerebralTest);
  docketClerkOpensCaseConsolidateModal(cerebralTest);
  docketClerkSearchesForCaseToConsolidateWith(cerebralTest);
  docketClerkConsolidatesCases(cerebralTest, 2);

  it('login as a petitioner and create another case to consolidate with', async () => {
    cerebralTest.docketNumberDifferentPlaceOfTrial = null;
    const caseDetail = await uploadPetition(cerebralTest, overrides);
    expect(caseDetail.docketNumber).toBeDefined();
    cerebralTest.docketNumber = caseDetail.docketNumber;
  });

  loginAs(cerebralTest, 'docketclerk@example.com');
  docketClerkUpdatesCaseStatusToReadyForTrial(cerebralTest);
  docketClerkOpensCaseConsolidateModal(cerebralTest);
  docketClerkSearchesForCaseToConsolidateWith(cerebralTest);
  docketClerkConsolidatesCases(cerebralTest, 3);

  loginAs(cerebralTest, 'petitioner@example.com');
  petitionerViewsDashboard(cerebralTest);
  petitionerVerifiesConsolidatedCases(cerebralTest, 3);

  //docket clerk serves court issued document on lead case and so on

  loginAs(cerebralTest, 'docketclerk@example.com');
  docketClerkCreatesAnOrder(cerebralTest, {
    documentTitle: 'Order to do something',
    eventCode: 'O',
    expectedDocumentType: 'Order',
  });
  docketClerkSignsOrder(cerebralTest, 0);
  docketClerkServesDocumentOnLeadCase(cerebralTest, 0);

  // TODO: check that document is served on lead case AND any checked consolidated cases

  docketClerkUnconsolidatesLeadCase(cerebralTest);
  loginAs(cerebralTest, 'petitioner@example.com');
  petitionerViewsDashboard(cerebralTest);
  petitionerVerifiesConsolidatedCases(cerebralTest, 2);

  loginAs(cerebralTest, 'docketclerk@example.com');
  docketClerkUnconsolidatesLeadCase(cerebralTest);
  loginAs(cerebralTest, 'petitioner@example.com');
  petitionerViewsDashboard(cerebralTest);
  petitionerVerifiesUnconsolidatedCases(cerebralTest);
});
