import { runAction } from 'cerebral/test';
import { setProcedureTypeToAllAction } from './setProcedureTypeToAllAction';

describe('setProcedureTypeToAllAction', () => {
  it('sets state.form.procedureType to All', async () => {
    const result = await runAction(setProcedureTypeToAllAction, {
      state: {
        form: {
          procedureType: undefined,
        },
      },
    });

    expect(result.state.form.procedureType).toEqual('All');
  });
});
