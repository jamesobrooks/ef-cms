const {
  validateInitialWorkItemMessage,
} = require('./validateInitialWorkItemMessageInteractor');
const {
  InitialWorkItemMessage,
} = require('../../entities/InitialWorkItemMessage');

describe('validateInitialWorkItemMessage', () => {
  it('returns the expected errors object on an empty message', () => {
    const errors = validateInitialWorkItemMessage({
      applicationContext: {
        getEntityConstructors: () => ({
          InitialWorkItemMessage,
        }),
      },
      message: {},
    });

    expect(errors).toEqual({
      assigneeId: 'Recipient is a required field.',
      message: 'Message is a required field.',
      section: 'Section is a required field.',
    });
  });

  it('returns no errors when all properties are defined', () => {
    const errors = validateInitialWorkItemMessage({
      applicationContext: {
        getEntityConstructors: () => ({
          InitialWorkItemMessage,
        }),
      },
      message: {
        assigneeId: '6805d1ab-18d0-43ec-bafb-654e83405416',
        message: 'hello world',
        section: 'docket',
      },
    });

    expect(errors).toEqual(null);
  });
});
