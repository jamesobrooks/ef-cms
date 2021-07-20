import { ADVANCED_SEARCH_TABS } from '../../shared/src/business/entities/EntityConstants';
import { docketClerkAddsDocketEntryFromOrder } from './journey/docketClerkAddsDocketEntryFromOrder';
import { docketClerkCreatesAnOrder } from './journey/docketClerkCreatesAnOrder';
import { docketClerkServesDocument } from './journey/docketClerkServesDocument';
import { docketClerkSignsOrder } from './journey/docketClerkSignsOrder';

import {
  loginAs,
  refreshElasticsearchIndex,
  setupTest,
  uploadPetition,
} from './helpers';
import { petitionsClerkServesElectronicCaseToIrs } from './journey/petitionsClerkServesElectronicCaseToIrs';

const cerebralTest = setupTest();
cerebralTest.draftOrders = [];

describe('order search journey', () => {
  beforeEach(() => {
    jest.setTimeout(30000);
    global.window = {
      ...global.window,
      localStorage: {
        removeItem: () => null,
        setItem: () => null,
      },
    };
  });

  afterAll(() => {
    cerebralTest.closeSocket();
  });

  loginAs(cerebralTest, 'petitioner@example.com');

  it('Creates case', async () => {
    const caseDetail = await uploadPetition(cerebralTest);

    expect(caseDetail.docketNumber).toBeDefined();
    cerebralTest.docketNumber = caseDetail.docketNumber;
  });

  loginAs(cerebralTest, 'petitionsclerk@example.com');
  petitionsClerkServesElectronicCaseToIrs(cerebralTest);

  loginAs(cerebralTest, 'docketclerk@example.com');
  docketClerkCreatesAnOrder(cerebralTest, {
    documentContents: 'welcome to flavortown',
    documentTitle: 'welcome to flavortown',
    eventCode: 'O',
    expectedDocumentType: 'Order',
    signedAtFormatted: '01/02/2020',
  });
  docketClerkSignsOrder(cerebralTest, 0);
  docketClerkAddsDocketEntryFromOrder(cerebralTest, 0);
  docketClerkServesDocument(cerebralTest, 0);

  docketClerkCreatesAnOrder(cerebralTest, {
    documentContents: 'welcome to flavortown',
    documentTitle: 'hold on',
    eventCode: 'O',
    expectedDocumentType: 'Order',
    signedAtFormatted: '01/02/2020',
  });
  docketClerkSignsOrder(cerebralTest, 1);
  docketClerkAddsDocketEntryFromOrder(cerebralTest, 1);
  docketClerkServesDocument(cerebralTest, 1);

  docketClerkCreatesAnOrder(cerebralTest, {
    documentContents: 'wait till the partys over',
    documentTitle: 'welcome to flavortown',
    eventCode: 'O',
    expectedDocumentType: 'Order',
    signedAtFormatted: '01/02/2020',
  });
  docketClerkSignsOrder(cerebralTest, 2);
  docketClerkAddsDocketEntryFromOrder(cerebralTest, 2);
  docketClerkServesDocument(cerebralTest, 2);

  docketClerkCreatesAnOrder(cerebralTest, {
    documentContents: 'nasty weather',
    documentTitle: 'welcome to something flavortown',
    eventCode: 'O',
    expectedDocumentType: 'Order',
    signedAtFormatted: '01/02/2020',
  });
  docketClerkSignsOrder(cerebralTest, 3);
  docketClerkAddsDocketEntryFromOrder(cerebralTest, 3);
  docketClerkServesDocument(cerebralTest, 3);

  docketClerkCreatesAnOrder(cerebralTest, {
    documentContents: 'welcome from flavortown',
    documentTitle: 'welcome from flavortown',
    eventCode: 'O',
    expectedDocumentType: 'Order',
    signedAtFormatted: '01/02/2020',
  });
  docketClerkSignsOrder(cerebralTest, 4);
  docketClerkAddsDocketEntryFromOrder(cerebralTest, 4);
  docketClerkServesDocument(cerebralTest, 4);

  docketClerkCreatesAnOrder(cerebralTest, {
    documentContents: 'welcome to flavor-town',
    documentTitle: 'welcome to flavor-town',
    eventCode: 'O',
    expectedDocumentType: 'Order',
    signedAtFormatted: '01/02/2020',
  });
  docketClerkSignsOrder(cerebralTest, 5);
  docketClerkAddsDocketEntryFromOrder(cerebralTest, 5);
  docketClerkServesDocument(cerebralTest, 5);

  docketClerkCreatesAnOrder(cerebralTest, {
    documentContents: 'welcome to flavortown.',
    documentTitle: 'burning down the house',
    eventCode: 'O',
    expectedDocumentType: 'Order',
    signedAtFormatted: '01/02/2020',
  });
  docketClerkSignsOrder(cerebralTest, 6);
  docketClerkAddsDocketEntryFromOrder(cerebralTest, 6);
  docketClerkServesDocument(cerebralTest, 6);

  loginAs(cerebralTest, 'petitionsclerk@example.com');
  it('searches for an order by keyword `"welcome to flavortown"`', async () => {
    await refreshElasticsearchIndex();
    await cerebralTest.runSequence('gotoAdvancedSearchSequence');
    cerebralTest.setState('advancedSearchTab', ADVANCED_SEARCH_TABS.ORDER);

    cerebralTest.setState('advancedSearchForm', {
      orderSearch: {
        docketNumber: cerebralTest.docketNumber, // we need this because we generate orders with the same title with every re-run
        keyword: '"welcome to flavortown"',
      },
    });

    await cerebralTest.runSequence('submitOrderAdvancedSearchSequence');

    const searchResults = cerebralTest.getState(
      `searchResults.${ADVANCED_SEARCH_TABS.ORDER}`,
    );

    expect(searchResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          docketEntryId: cerebralTest.draftOrders[0].docketEntryId,
          docketNumber: cerebralTest.docketNumber,
          documentTitle: 'welcome to flavortown',
        }),
        expect.objectContaining({
          docketEntryId: cerebralTest.draftOrders[1].docketEntryId,
          docketNumber: cerebralTest.docketNumber,
        }),
        expect.objectContaining({
          docketEntryId: cerebralTest.draftOrders[2].docketEntryId,
          docketNumber: cerebralTest.docketNumber,
          documentTitle: 'welcome to flavortown',
        }),
        expect.objectContaining({
          docketEntryId: cerebralTest.draftOrders[6].docketEntryId,
          docketNumber: cerebralTest.docketNumber,
        }),
      ]),
    );

    expect(searchResults.length).toEqual(4);
  });

  it('searches for an order by keyword `"welcome from flavortown"`', async () => {
    await cerebralTest.runSequence('gotoAdvancedSearchSequence');
    cerebralTest.setState('advancedSearchTab', ADVANCED_SEARCH_TABS.ORDER);

    cerebralTest.setState('advancedSearchForm', {
      orderSearch: {
        docketNumber: cerebralTest.docketNumber, // we need this because we generate orders with the same title with every re-run
        keyword: '"welcome from flavortown"',
      },
    });

    await cerebralTest.runSequence('submitOrderAdvancedSearchSequence');

    const searchResults = cerebralTest.getState(
      `searchResults.${ADVANCED_SEARCH_TABS.ORDER}`,
    );

    expect(searchResults).toEqual([
      expect.objectContaining({
        docketEntryId: cerebralTest.draftOrders[4].docketEntryId,
        docketNumber: cerebralTest.docketNumber,
        documentTitle: 'welcome from flavortown',
      }),
    ]);

    expect(searchResults.length).toEqual(1);
  });

  it('searches for an order by keyword `"welcome to flavor-town"`', async () => {
    await cerebralTest.runSequence('gotoAdvancedSearchSequence');
    cerebralTest.setState('advancedSearchTab', ADVANCED_SEARCH_TABS.ORDER);

    cerebralTest.setState('advancedSearchForm', {
      orderSearch: {
        docketNumber: cerebralTest.docketNumber, // we need this because we generate orders with the same title with every re-run
        keyword: '"welcome to flavor-town"',
      },
    });

    await cerebralTest.runSequence('submitOrderAdvancedSearchSequence');

    const searchResults = cerebralTest.getState(
      `searchResults.${ADVANCED_SEARCH_TABS.ORDER}`,
    );

    expect(searchResults).toEqual([
      expect.objectContaining({
        docketEntryId: cerebralTest.draftOrders[5].docketEntryId,
        docketNumber: cerebralTest.docketNumber,
        documentTitle: 'welcome to flavor-town',
      }),
    ]);

    expect(searchResults.length).toEqual(1);
  });

  it('searches for an order by keyword `"Welcome to Flavortown"`', async () => {
    await cerebralTest.runSequence('gotoAdvancedSearchSequence');
    cerebralTest.setState('advancedSearchTab', ADVANCED_SEARCH_TABS.ORDER);

    cerebralTest.setState('advancedSearchForm', {
      orderSearch: {
        docketNumber: cerebralTest.docketNumber, // we need this because we generate orders with the same title with every re-run
        keyword: '"Welcome to Flavortown"',
      },
    });

    await cerebralTest.runSequence('submitOrderAdvancedSearchSequence');

    const searchResults = cerebralTest.getState(
      `searchResults.${ADVANCED_SEARCH_TABS.ORDER}`,
    );

    expect(searchResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          docketEntryId: cerebralTest.draftOrders[0].docketEntryId,
          docketNumber: cerebralTest.docketNumber,
          documentTitle: 'welcome to flavortown',
        }),
        expect.objectContaining({
          docketEntryId: cerebralTest.draftOrders[1].docketEntryId,
          docketNumber: cerebralTest.docketNumber,
        }),
        expect.objectContaining({
          docketEntryId: cerebralTest.draftOrders[2].docketEntryId,
          docketNumber: cerebralTest.docketNumber,
          documentTitle: 'welcome to flavortown',
        }),
        expect.objectContaining({
          docketEntryId: cerebralTest.draftOrders[6].docketEntryId,
          docketNumber: cerebralTest.docketNumber,
        }),
      ]),
    );

    expect(searchResults.length).toEqual(4);
  });

  it('searches for an order by keyword `"welcomes to flavortown"`', async () => {
    await cerebralTest.runSequence('gotoAdvancedSearchSequence');
    cerebralTest.setState('advancedSearchTab', ADVANCED_SEARCH_TABS.ORDER);

    cerebralTest.setState('advancedSearchForm', {
      orderSearch: {
        docketNumber: cerebralTest.docketNumber, // we need this because we generate orders with the same title with every re-run
        keyword: '"welcomes to flavortown"',
      },
    });

    await cerebralTest.runSequence('submitOrderAdvancedSearchSequence');

    const searchResults = cerebralTest.getState(
      `searchResults.${ADVANCED_SEARCH_TABS.ORDER}`,
    );

    expect(searchResults).toEqual([]);

    expect(searchResults.length).toEqual(0);
  });
});
