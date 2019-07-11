import { Focus } from '../../ustc-ui/Focus/Focus';
import { NonstandardForm } from './NonstandardForm';
import { Text } from '../../ustc-ui/Text/Text';
import { connect } from '@cerebral/react';
import { sequences, state } from 'cerebral';
import React from 'react';
import Select from 'react-select';

export const CompleteDocumentTypeSection = connect(
  {
    completeDocumentTypeSectionHelper: state.completeDocumentTypeSectionHelper,
    updateFileDocumentWizardFormValueSequence:
      sequences.updateFileDocumentWizardFormValueSequence,
    updateScreenMetadataSequence: sequences.updateScreenMetadataSequence,
    validateSelectDocumentTypeSequence:
      sequences.validateSelectDocumentTypeSequence,
    validationErrors: state.validationErrors,
  },
  ({
    completeDocumentTypeSectionHelper,
    updateFileDocumentWizardFormValueSequence,
    updateScreenMetadataSequence,
    validateSelectDocumentTypeSequence,
    validationErrors,
  }) => {
    return (
      <React.Fragment>
        <div
          className={`usa-form-group ${
            validationErrors.documentType ? 'usa-form-group--error' : ''
          }`}
        >
          <label className="usa-label" htmlFor="document-type">
            Document Type
          </label>
          <Select
            aria-describedby="document-type-label"
            className="select-react-element"
            classNamePrefix="select-react-element"
            id="document-type"
            isClearable={true}
            name="eventCode"
            options={
              completeDocumentTypeSectionHelper.documentTypesForSelectSorted
            }
            placeholder="- Select -"
            onChange={(inputValue, { action }) => {
              switch (action) {
                case 'select-option':
                  updateFileDocumentWizardFormValueSequence({
                    key: 'category',
                    value: inputValue.category,
                  });
                  updateFileDocumentWizardFormValueSequence({
                    key: 'documentType',
                    value: inputValue.documentType,
                  });
                  updateFileDocumentWizardFormValueSequence({
                    key: 'documentTitle',
                    value: inputValue.documentTitle,
                  });
                  updateFileDocumentWizardFormValueSequence({
                    key: 'eventCode',
                    value: inputValue.eventCode,
                  });
                  updateFileDocumentWizardFormValueSequence({
                    key: 'scenario',
                    value: inputValue.scenario,
                  });
                  validateSelectDocumentTypeSequence();
                  break;
                case 'clear':
                  updateFileDocumentWizardFormValueSequence({
                    key: 'category',
                    value: '',
                  });
                  validateSelectDocumentTypeSequence();
                  break;
              }
              return true;
            }}
            onInputChange={(inputText, { action }) => {
              if (action == 'input-change') {
                updateScreenMetadataSequence({
                  key: 'searchText',
                  value: inputText,
                });
              }
            }}
          />
          <Text
            bind="validationErrors.documentType"
            className="usa-error-message"
          />
        </div>

        {completeDocumentTypeSectionHelper.primary.showNonstandardForm && (
          <NonstandardForm
            helper="completeDocumentTypeSectionHelper"
            level="primary"
            updateSequence="updateFileDocumentWizardFormValueSequence"
            validateSequence="validateSelectDocumentTypeSequence"
            validationErrors="validationErrors"
          />
        )}

        {completeDocumentTypeSectionHelper.secondary && (
          <>
            <Focus>
              <h4 className="focusable" tabIndex="-1">
                Which Document Are You Requesting Leave to File For?
              </h4>
            </Focus>
            <div
              className={`usa-form-group ${
                validationErrors.secondaryDocument &&
                validationErrors.secondaryDocument.documentType
                  ? 'usa-form-group--error'
                  : ''
              }`}
            >
              <label
                className="usa-label"
                htmlFor="secondary-doc-secondary-document-type"
              >
                Document Type
              </label>
              <Select
                aria-describedby="document-type-label"
                className="select-react-element"
                classNamePrefix="select-react-element"
                id="secondary-doc-secondary-document-type"
                isClearable={true}
                name="secondaryDocument.eventCode"
                options={
                  completeDocumentTypeSectionHelper.documentTypesForSecondarySelectSorted
                }
                placeholder="- Select -"
                onChange={(inputValue, { action }) => {
                  switch (action) {
                    case 'select-option':
                      updateFileDocumentWizardFormValueSequence({
                        key: 'secondaryDocument.category',
                        value: inputValue.category,
                      });
                      updateFileDocumentWizardFormValueSequence({
                        key: 'secondaryDocument.documentType',
                        value: inputValue.documentType,
                      });
                      updateFileDocumentWizardFormValueSequence({
                        key: 'secondaryDocument.documentTitle',
                        value: inputValue.documentTitle,
                      });
                      updateFileDocumentWizardFormValueSequence({
                        key: 'secondaryDocument.eventCode',
                        value: inputValue.eventCode,
                      });
                      updateFileDocumentWizardFormValueSequence({
                        key: 'secondaryDocument.scenario',
                        value: inputValue.scenario,
                      });
                      validateSelectDocumentTypeSequence();
                      break;
                    case 'clear':
                      updateFileDocumentWizardFormValueSequence({
                        key: 'secondaryDocument.category',
                        value: '',
                      });
                      validateSelectDocumentTypeSequence();
                      break;
                  }
                  return true;
                }}
                onInputChange={(inputText, { action }) => {
                  if (action == 'input-change') {
                    updateScreenMetadataSequence({
                      key: 'searchText',
                      value: inputText,
                    });
                  }
                }}
              />
              <Text
                bind="validationErrors.secondaryDocument.documentType"
                className="usa-error-message"
              />
            </div>
            {completeDocumentTypeSectionHelper.secondary
              .showNonstandardForm && (
              <NonstandardForm
                helper="completeDocumentTypeSectionHelper"
                level="secondary"
                namespace="secondaryDocument"
                updateSequence="updateFileDocumentWizardFormValueSequence"
                validateSequence="validateSelectDocumentTypeSequence"
                validationErrors="validationErrors.secondaryDocument"
              />
            )}
          </>
        )}
      </React.Fragment>
    );
  },
);
