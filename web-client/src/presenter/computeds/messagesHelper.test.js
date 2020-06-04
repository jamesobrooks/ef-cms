import { messagesHelper } from './messagesHelper';
import { runCompute } from 'cerebral/test';

describe('messagesHelper', () => {
  it('should set showIndividualMessages true and showSectionMessages false if messageBoxToDisplay.queue is my', () => {
    const result = runCompute(messagesHelper, {
      state: {
        messageBoxToDisplay: {
          queue: 'my',
        },
      },
    });
    expect(result.showIndividualMessages).toBeTruthy();
    expect(result.showSectionMessages).toBeFalsy();
  });

  it('should set showIndividualMessages false and showSectionMessages true if messageBoxToDisplay.queue is section', () => {
    const result = runCompute(messagesHelper, {
      state: {
        messageBoxToDisplay: {
          queue: 'section',
        },
      },
    });
    expect(result.showIndividualMessages).toBeFalsy();
    expect(result.showSectionMessages).toBeTruthy();
  });
});
