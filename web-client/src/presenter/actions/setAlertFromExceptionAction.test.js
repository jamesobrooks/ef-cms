import { runAction } from 'cerebral/test';
import { setAlertFromExceptionAction } from './setAlertFromExceptionAction';

describe('setAlertFromExceptionAction', () => {
  it('sets alertError when valid message provided', async () => {
    const error = {
      message: 'my message',
      title: 'my title',
    };
    const { state } = await runAction(setAlertFromExceptionAction, {
      props: { error },
    });
    expect(state.alertError).toEqual(error);
  });
  it('sets alertError when only title is provided', async () => {
    const error = {
      title: 'my title',
    };
    const { state } = await runAction(setAlertFromExceptionAction, {
      props: { error },
    });
    expect(state.alertError).toEqual(error);
  });
  it('sets alertError when only message is provided', async () => {
    const error = {
      message: 'my message',
    };
    const { state } = await runAction(setAlertFromExceptionAction, {
      props: { error },
    });
    expect(state.alertError).toEqual(error);
  });
  it('does not set alertError when error object has no title or message', async () => {
    const error = {
      foo: 'bar',
    };
    const { state } = await runAction(setAlertFromExceptionAction, {
      props: { error },
    });
    expect(state.alertError).not.toEqual(error);
  });
  it('does not set alertError when error object is null', async () => {
    const { state } = await runAction(setAlertFromExceptionAction, {
      props: {},
    });
    expect(state.alertError).toEqual({});
  });
});
