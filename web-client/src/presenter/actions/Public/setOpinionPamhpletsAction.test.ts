import { applicationContextForClient as applicationContext } from '../../../../../shared/src/business/test/createTestApplicationContext';
import { presenter } from '../../presenter-public';
import { runAction } from 'cerebral/test';
import { setOpinionPamhpletsAction } from './setOpinionPamhpletsAction';

describe('setOpinionPamhpletsAction', () => {
  const mockOpinionPamphlets = [
    {
      docketEntryId: '1234',
      documentTitle: 'More opinion reports',
      eventCode: 'TCRP',
    },
    {
      docketEntryId: '5678',
      documentTitle: 'Opinion reports',
      eventCode: 'TCRP',
    },
  ];

  beforeAll(() => {
    presenter.providers.applicationContext = applicationContext;
  });

  it('should set opinionPamphlets on state', async () => {
    const { state } = await runAction(setOpinionPamhpletsAction, {
      modules: {
        presenter,
      },
      props: {
        opinionPamphlets: mockOpinionPamphlets,
      },
      state: {
        opinionPamphlets: undefined,
      },
    });

    expect(state.opinionPamphlets).toMatchObject(mockOpinionPamphlets);
  });
});
