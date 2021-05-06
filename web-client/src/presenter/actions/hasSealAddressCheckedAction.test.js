import { hasSealAddressCheckedAction } from './hasSealAddressCheckedAction';
import { presenter } from '../presenter-mock';
import { runAction } from 'cerebral/test';

describe('hasUpdatedPetitionerEmailAction', () => {
  let pathNoStub = jest.fn();
  let pathYesStub = jest.fn();

  beforeAll(() => {
    presenter.providers.path = {
      no: pathNoStub,
      yes: pathYesStub,
    };
  });

  it('returns the yes path when form.isAddressSealed is true', async () => {
    runAction(hasSealAddressCheckedAction, {
      modules: { presenter },
      state: {
        form: { contact: {}, isAddressSealed: true },
      },
    });

    expect(pathYesStub).toHaveBeenCalled();
  });

  it('returns the no path when form.isAddressSealed is false', async () => {
    runAction(hasSealAddressCheckedAction, {
      modules: { presenter },
      state: {
        form: { contact: {}, isAddressSealed: false },
      },
    });

    expect(pathNoStub).toHaveBeenCalled();
  });

  it('returns the no path if the address was already sealed nad isAddressSealed is true', async () => {
    runAction(hasSealAddressCheckedAction, {
      modules: { presenter },
      state: {
        form: { contact: { isAddressSealed: true }, isAddressSealed: true },
      },
    });

    expect(pathNoStub).toHaveBeenCalled();
  });
});