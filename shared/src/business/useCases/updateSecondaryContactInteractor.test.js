const {
  applicationContext,
  fakeData,
} = require('../test/createTestApplicationContext');
const {
  COUNTRY_TYPES,
  PARTY_TYPES,
  ROLES,
} = require('../entities/EntityConstants');
const {
  updateSecondaryContactInteractor,
} = require('./updateSecondaryContactInteractor');
const { MOCK_CASE } = require('../../test/mockCase');
const { User } = require('../entities/User');

describe('updateSecondaryContactInteractor', () => {
  const mockContactSecondary = {
    address1: 'nothing',
    city: 'Somewhere',
    countryType: COUNTRY_TYPES.DOMESTIC,
    email: 'secondary@example.com',
    name: 'Secondary Party',
    phone: '9876543210',
    postalCode: '12345',
    state: 'TN',
  };
  let mockCase = {
    ...MOCK_CASE,
    contactSecondary: mockContactSecondary,
    partyType: PARTY_TYPES.petitionerSpouse,
  };

  let mockUser = new User({
    name: 'bob',
    role: ROLES.petitioner,
    userId: '6805d1ab-18d0-43ec-bafb-654e83405416',
  });

  beforeEach(() => {
    applicationContext
      .getPersistenceGateway()
      .getCaseByDocketNumber.mockImplementation(() => mockCase);

    applicationContext
      .getChromiumBrowser()
      .newPage()
      .pdf.mockReturnValue(fakeData);

    applicationContext
      .getUseCases()
      .generatePdfFromHtmlInteractor.mockReturnValue(fakeData);
    applicationContext.getUseCases().userIsAssociated.mockReturnValue(true);

    applicationContext.getCurrentUser.mockReturnValue(mockUser);

    applicationContext.getUtilities().getAddressPhoneDiff.mockReturnValue({
      address1: {
        newData: 'new test',
        oldData: 'test',
      },
    });

    applicationContext
      .getUtilities()
      .getDocumentTypeForAddressChange.mockReturnValue({
        eventCode: 'NCA',
        title: 'Notice of Change of Address',
      });
  });

  it('should update contactSecondary editable fields', async () => {
    const caseDetail = await updateSecondaryContactInteractor({
      applicationContext,
      contactInfo: {
        address1: '453 Electric Ave',
        city: 'Philadelphia',
        countryType: COUNTRY_TYPES.DOMESTIC,
        email: 'secondary@example.com',
        name: 'New Secondary',
        phone: '1234567890',
        postalCode: '99999',
        state: 'PA',
      },
      docketNumber: MOCK_CASE.docketNumber,
    });

    const updatedCase = applicationContext.getPersistenceGateway().updateCase
      .mock.calls[0][0].caseToUpdate;
    const changeOfAddressDocument = updatedCase.documents.find(
      d => d.documentType === 'Notice of Change of Address',
    );
    expect(updatedCase.contactSecondary).toMatchObject({
      address1: '453 Electric Ave',
      city: 'Philadelphia',
      countryType: COUNTRY_TYPES.DOMESTIC,
      email: mockContactSecondary.email,
      name: mockContactSecondary.name,
      phone: '1234567890',
      postalCode: '99999',
      state: 'PA',
    });
    expect(changeOfAddressDocument).toMatchObject({
      isAutoGenerated: true,
    });
    expect(
      applicationContext.getDocumentGenerators().changeOfAddress,
    ).toHaveBeenCalled();
    expect(caseDetail.documents[4].servedAt).toBeDefined();
  });

  it('throws an error if the case was not found', async () => {
    mockCase = null;

    await expect(
      updateSecondaryContactInteractor({
        applicationContext,
        contactInfo: {},
        docketNumber: MOCK_CASE.docketNumber,
      }),
    ).rejects.toThrow('Case 101-18 was not found.');
  });

  it('throws an error if the user making the request is not associated with the case', async () => {
    mockCase = {
      ...MOCK_CASE,
      userId: 'e8577e31-d6d5-4c4a-adc6-520075f3dde5',
    };
    applicationContext.getUseCases().userIsAssociated.mockReturnValue(false);

    await expect(
      updateSecondaryContactInteractor({
        applicationContext,
        contactInfo: {},
        docketNumber: MOCK_CASE.docketNumber,
      }),
    ).rejects.toThrow('Unauthorized for update case contact');
  });

  it('does not update the case if the contact information does not change', async () => {
    applicationContext
      .getUtilities()
      .getDocumentTypeForAddressChange.mockReturnValue(undefined);
    applicationContext.getUtilities().getAddressPhoneDiff.mockReturnValue({});

    await updateSecondaryContactInteractor({
      applicationContext,
      contactInfo: {
        // Matches current contact info
        address1: 'nothing',
        city: 'Somewhere',
        countryType: COUNTRY_TYPES.DOMESTIC,
        email: 'secondary@example.com',
        name: 'Secondary Party',
        phone: '9876543210',
        postalCode: '12345',
        state: 'TN',
      },
      docketNumber: MOCK_CASE.docketNumber,
    });

    expect(
      applicationContext.getPersistenceGateway().updateCase,
    ).not.toHaveBeenCalled();
    expect(
      applicationContext.getDocumentGenerators().changeOfAddress,
    ).not.toHaveBeenCalled();
  });

  it('does not update the contact secondary email or name', async () => {
    mockCase = {
      ...MOCK_CASE,
      contactSecondary: mockContactSecondary,
      partyType: PARTY_TYPES.petitionerSpouse,
    };
    applicationContext
      .getUtilities()
      .getDocumentTypeForAddressChange.mockReturnValue(undefined);

    const caseDetail = await updateSecondaryContactInteractor({
      applicationContext,
      contactInfo: {
        address1: 'nothing',
        city: 'Somewhere',
        countryType: COUNTRY_TYPES.DOMESTIC,
        email: 'hello123@example.com',
        name: 'Secondary Party Name Changed',
        phone: '9876543210',
        postalCode: '12345',
        state: 'TN',
      },
      docketNumber: MOCK_CASE.docketNumber,
    });

    expect(caseDetail.contactSecondary.name).not.toBe(
      'Secondary Party Name Changed',
    );
    expect(caseDetail.contactSecondary.name).toBe(mockContactSecondary.name);
    expect(caseDetail.contactSecondary.email).not.toBe('hello123@example.com');
    expect(caseDetail.contactSecondary.email).toBe(mockContactSecondary.email);
  });

  it('does not generate a change of address when inCareOf is updated', async () => {
    applicationContext
      .getUtilities()
      .getDocumentTypeForAddressChange.mockReturnValue(undefined);
    applicationContext
      .getUtilities()
      .getAddressPhoneDiff.mockReturnValue({ inCareOf: {} });

    await updateSecondaryContactInteractor({
      applicationContext,
      contactInfo: {
        address1: 'nothing',
        city: 'Somewhere',
        countryType: COUNTRY_TYPES.DOMESTIC,
        email: 'secondary@example.com',
        inCareOf: 'Andy Dwyer',
        name: 'Secondary Party',
        phone: '9876543210',
        postalCode: '12345',
        state: 'TN',
      },
      docketNumber: MOCK_CASE.docketNumber,
    });

    expect(
      applicationContext.getPersistenceGateway().updateCase,
    ).toHaveBeenCalled();
    expect(
      applicationContext.getDocumentGenerators().changeOfAddress,
    ).not.toHaveBeenCalled();
  });
});
