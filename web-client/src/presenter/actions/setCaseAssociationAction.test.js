import { runAction } from 'cerebral/test';
import { setCaseAssociationAction } from './setCaseAssociationAction';

describe('setCaseAssociationAction', () => {
  it('sets state.screenMetadata.isAssociated and state.screenMetadata.pendingAssociation and state.screenMetadata.isDirectlyAssociated from props', async () => {
    const { state } = await runAction(setCaseAssociationAction, {
      props: {
        isAssociated: true,
        isDirectlyAssociated: true,
        pendingAssociation: true,
      },
      state: {
        screenMetadata: {
          isAssociated: false,
          isDirectlyAssociated: false,
          pendingAssociation: false,
        },
      },
    });

    expect(state.screenMetadata.isAssociated).toBeTruthy();
    expect(state.screenMetadata.pendingAssociation).toBeTruthy();
    expect(state.screenMetadata.isDirectlyAssociated).toBeTruthy();
  });
});
