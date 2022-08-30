import { applicationContext } from '../test/createTestApplicationContext';
import { setItemInteractor } from './setItemInteractor';
import { getItem } from '../../persistence/localStorage/getItem';
import { setItem } from '../../persistence/localStorage/setItem';

describe('setItemInteractor', () => {
  it('should be able to set an item', async () => {
    applicationContext
      .getPersistenceGateway()
      .getItem.mockImplementation(getItem);
    applicationContext
      .getPersistenceGateway()
      .setItem.mockImplementation(setItem);

    await setItemInteractor(applicationContext, {
      key: 'abc',
      value: '123',
    });

    const result = await applicationContext.getPersistenceGateway().getItem({
      applicationContext,
      key: 'abc',
    });

    expect(result).toEqual('123');
  });
});
