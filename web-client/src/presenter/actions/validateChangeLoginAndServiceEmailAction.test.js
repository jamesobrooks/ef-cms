import { applicationContextForClient as applicationContext } from '../../../../shared/src/business/test/createTestApplicationContext';
import { presenter } from '../presenter-mock';
import { runAction } from 'cerebral/test';
import { validateChangeLoginAndServiceEmailAction } from './validateChangeLoginAndServiceEmailAction';

const errorMock = jest.fn();
const successMock = jest.fn();

describe('validateChangeLoginAndServiceEmailAction', () => {
  beforeAll(() => {
    presenter.providers.applicationContext = applicationContext;
    presenter.providers.path = {
      error: errorMock,
      success: successMock,
    };
  });

  it('should return the error path if update user email form is invalid', async () => {
    applicationContext
      .getUseCases()
      .validateUpdateUserEmailInteractor.mockReturnValue(
        'something went wrong',
      );

    runAction(validateChangeLoginAndServiceEmailAction, {
      modules: {
        presenter,
      },
      state: { form: {} },
    });

    expect(errorMock).toHaveBeenCalled();
  });

  it('should return the success path if update user email form is valid', async () => {
    applicationContext
      .getUseCases()
      .validateUpdateUserEmailInteractor.mockReturnValue(undefined);

    runAction(validateChangeLoginAndServiceEmailAction, {
      modules: {
        presenter,
      },
      state: {
        form: { confirmEmail: 'test@example.com', email: 'test@example.com' },
      },
    });

    expect(successMock).toHaveBeenCalled();
  });
});
