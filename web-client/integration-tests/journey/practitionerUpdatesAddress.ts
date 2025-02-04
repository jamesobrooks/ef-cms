import { waitForLoadingComponentToHide } from '../helpers';

const { faker } = require('@faker-js/faker');
const { refreshElasticsearchIndex } = require('../helpers');

export const practitionerUpdatesAddress = cerebralTest => {
  return it('practitioner updates address', async () => {
    await cerebralTest.runSequence('gotoUserContactEditSequence');

    await cerebralTest.runSequence('updateFormValueSequence', {
      key: 'contact.address1',
      value: '',
    });

    await cerebralTest.runSequence(
      'submitUpdateUserContactInformationSequence',
    );
    expect(cerebralTest.getState('validationErrors')).toEqual({
      contact: { address1: expect.anything() },
    });

    cerebralTest.updatedPractitionerAddress = faker.address.streetAddress(true);

    await cerebralTest.runSequence('updateFormValueSequence', {
      key: 'contact.address1',
      value: cerebralTest.updatedPractitionerAddress,
    });

    await cerebralTest.runSequence('updateFormValueSequence', {
      key: 'firmName',
      value: 'My Awesome Law Firm',
    });

    await cerebralTest.runSequence(
      'submitUpdateUserContactInformationSequence',
    );

    expect(cerebralTest.getState('validationErrors')).toEqual({});

    await waitForLoadingComponentToHide({
      cerebralTest,
      component: 'userContactEditProgress.inProgress',
      refreshInterval: 1000,
    });

    await waitForLoadingComponentToHide({ cerebralTest });

    await refreshElasticsearchIndex(5000);

    expect(cerebralTest.getState('alertSuccess')).toMatchObject({
      message: 'Changes saved.',
    });
  });
};
