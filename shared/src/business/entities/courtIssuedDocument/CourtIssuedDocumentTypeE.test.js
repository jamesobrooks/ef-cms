const {
  calculateISODate,
  createISODateString,
} = require('../../utilities/DateHandler');
const { CourtIssuedDocumentFactory } = require('./CourtIssuedDocumentFactory');
const { VALIDATION_ERROR_MESSAGES } = require('./CourtIssuedDocumentConstants');

describe('CourtIssuedDocumentTypeE', () => {
  describe('constructor', () => {
    it('should set attachments to false when no value is provided', () => {
      const documentInstance = CourtIssuedDocumentFactory.get({
        date: '2025-04-10T04:00:00.000Z',
        documentTitle:
          'Order time is extended to [Date] for petr(s) to pay the filing fee',
        documentType:
          'Order time is extended for petr(s) to pay the filing fee',
        scenario: 'Type E',
      });
      expect(documentInstance.attachments).toBe(false);
    });
  });
  describe('validation', () => {
    it('should have error messages for missing fields', () => {
      const documentInstance = CourtIssuedDocumentFactory.get({
        scenario: 'Type E',
      });
      expect(documentInstance.getFormattedValidationErrors()).toEqual({
        date: VALIDATION_ERROR_MESSAGES.date[2],
        documentType: VALIDATION_ERROR_MESSAGES.documentType,
      });
    });

    it('should have error message for past date', () => {
      const date = calculateISODate({
        dateString: createISODateString(),
        howMuch: -5,
        unit: 'days',
      });
      const extDoc = CourtIssuedDocumentFactory.get({
        attachments: false,
        date,
        documentTitle:
          'Order time is extended to [Date] for petr(s) to pay the filing fee',
        documentType:
          'Order time is extended for petr(s) to pay the filing fee',
        scenario: 'Type E',
      });
      expect(extDoc.getFormattedValidationErrors()).toEqual({
        date: VALIDATION_ERROR_MESSAGES.date[0].message,
      });
    });

    it('should be valid when all fields are present', () => {
      const documentInstance = CourtIssuedDocumentFactory.get({
        attachments: false,
        date: '2025-04-10T04:00:00.000Z',
        documentTitle:
          'Order time is extended to [Date] for petr(s) to pay the filing fee',
        documentType:
          'Order time is extended for petr(s) to pay the filing fee',
        scenario: 'Type E',
      });
      expect(documentInstance.getFormattedValidationErrors()).toEqual(null);
    });
  });

  describe('title generation', () => {
    it('should generate valid title', () => {
      const extDoc = CourtIssuedDocumentFactory.get({
        attachments: false,
        date: '2025-04-10T04:00:00.000Z',
        documentTitle:
          'Order time is extended to [Date] for petr(s) to pay the filing fee',
        documentType:
          'Order time is extended for petr(s) to pay the filing fee',
        scenario: 'Type E',
      });
      expect(extDoc.getDocumentTitle()).toEqual(
        'Order time is extended to 04-10-2025 for petr(s) to pay the filing fee',
      );
    });
  });
});
