import { applicationContextForClient as applicationContext } from '../../../../../shared/src/business/test/createTestApplicationContext';
import { presenter } from '../../presenter-public';
import { runAction } from 'cerebral/test';
import { submitPublicOpinionAdvancedSearchAction } from './submitPublicOpinionAdvancedSearchAction';

describe('submitPublicOpinionAdvancedSearchAction', () => {
  beforeAll(() => {
    presenter.providers.applicationContext = applicationContext;
  });

  it('gets the public opinion information', async () => {
    await runAction(submitPublicOpinionAdvancedSearchAction, {
      modules: {
        presenter,
      },
      state: {
        advancedSearchForm: {
          opinionSearch: {
            keyword: 'a',
            opinionTypes: {},
          },
        },
      },
    });

    expect(
      applicationContext.getUseCases().opinionPublicSearchInteractor,
    ).toHaveBeenCalled();
    expect(
      applicationContext.getUseCases().opinionPublicSearchInteractor.mock
        .calls[0][1],
    ).toMatchObject({
      searchParams: {
        keyword: 'a',
      },
    });
  });

  it('should remove the docketNumberSuffix when a docket number is present', async () => {
    await runAction(submitPublicOpinionAdvancedSearchAction, {
      modules: {
        presenter,
      },
      state: {
        advancedSearchForm: {
          opinionSearch: {
            docketNumber: '105-20L',
            keyword: 'a',
            opinionTypes: {},
          },
        },
      },
    });

    expect(
      applicationContext.getUseCases().opinionPublicSearchInteractor.mock.calls
        .length,
    ).toEqual(1);
    expect(
      applicationContext.getUseCases().opinionPublicSearchInteractor.mock
        .calls[0][1],
    ).toMatchObject({
      searchParams: {
        docketNumber: '105-20',
        keyword: 'a',
      },
    });
  });

  it('should set an alert if a 429 error is thrown', async () => {
    applicationContext
      .getUseCases()
      .opinionPublicSearchInteractor.mockImplementation(() => {
        const e = new Error();
        e.originalError = {
          response: {
            data: {
              type: 'ip-limiter',
            },
          },
        };
        e.responseCode = 429;
        throw e;
      });

    const { state } = await runAction(submitPublicOpinionAdvancedSearchAction, {
      modules: {
        presenter,
      },
      state: {
        advancedSearchForm: {
          opinionSearch: {
            docketNumber: '105-20L',
            keyword: 'a',
            opinionTypes: {},
          },
        },
      },
    });

    expect(state.alertError).toEqual({
      message: 'Please wait 1 minute before trying your search again.',
      title: "You've reached your search limit",
    });
  });

  it('should filter out opinion types that are not selected for search', async () => {
    await runAction(submitPublicOpinionAdvancedSearchAction, {
      modules: {
        presenter,
      },
      state: {
        advancedSearchForm: {
          opinionSearch: {
            opinionTypes: {
              Avocado: false,
              Banana: false,
              Cucumber: true,
            },
          },
        },
        form: {},
      },
    });

    expect(
      applicationContext.getUseCases().opinionPublicSearchInteractor.mock
        .calls[0][1].searchParams.opinionTypes,
    ).toEqual(['Cucumber']);
  });
});
