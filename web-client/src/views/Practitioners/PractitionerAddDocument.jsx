import { BindedSelect } from '../../ustc-ui/BindedSelect/BindedSelect';
import { BindedTextarea } from '../../ustc-ui/BindedTextarea/BindedTextarea';
import { Button } from '../../ustc-ui/Button/Button';
import { ErrorNotification } from '../ErrorNotification';
import { FormGroup } from '../../ustc-ui/FormGroup/FormGroup';
import { PractitionerUserHeader } from './PractitionerUserHeader';
import { StateDrivenFileInput } from '../FileDocument/StateDrivenFileInput';
import { SuccessNotification } from '../SuccessNotification';
import { connect } from '@cerebral/react';
import { sequences, state } from 'cerebral';
import React from 'react';
import classNames from 'classnames';

export const PractitionerAddDocument = connect(
  {
    barNumber: state.practitionerDetails.barNumber,
    constants: state.constants,
    documentTypes: state.constants.PRACTITIONER_DOCUMENT_TYPES,
    navigateToPractitionerDocumentsPageSequence:
      sequences.navigateToPractitionerDocumentsPageSequence,
    practitionerDocumentationHelper: state.practitionerDocumentationHelper,
    submitAddPractitionerDocumentSequence:
      sequences.submitAddPractitionerDocumentSequence,
    usStates: state.constants.US_STATES,
    usStatesOther: state.constants.US_STATES_OTHER,
    validateAddPractitionerDocumentSequence:
      sequences.validateAddPractitionerDocumentSequence,
    validationErrors: state.validationErrors,
  },
  function PractitionerAddDocument({
    barNumber,
    constants,
    documentTypes,
    navigateToPractitionerDocumentsPageSequence,
    practitionerDocumentationHelper,
    submitAddPractitionerDocumentSequence,
    usStates,
    usStatesOther,
    validateAddPractitionerDocumentSequence,
    validationErrors,
  }) {
    return (
      <>
        <PractitionerUserHeader />

        <section className="grid-container">
          <SuccessNotification />
          <ErrorNotification />
          <h1 className="margin-bottom-1">Add File</h1>
          <div className="grid-row margin-bottom-4">
            <div className="grid-col-12">
              <p>All fields required unless otherwise noted</p>
              <h2>Practitioner File Information</h2>
              <div className="blue-container">
                <div className="grid-row grid-gap">
                  <div className="grid-col-5">
                    <FormGroup
                      errorText={validationErrors.practitionerDocumentFile}
                    >
                      <label
                        className={classNames(
                          'usa-label ustc-upload with-hint',
                        )}
                        htmlFor="practitioner-document-file"
                        id="practitioner-document-label"
                      >
                        Upload your file{' '}
                      </label>
                      <span className="usa-hint">
                        File must be in PDF format (.pdf), MS-Word (.doc, .docx)
                        or an image file (.jpg, .jpeg, .png). Max file size{' '}
                        {constants.MAX_FILE_SIZE_MB}MB.
                      </span>
                      <StateDrivenFileInput
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        aria-describedby="practitioner-document-file-label"
                        id="practitioner-document-file"
                        name="practitionerDocumentFile"
                        updateFormValueSequence="updateFormValueSequence"
                        validationSequence="validateAddPractitionerDocumentSequence"
                      />
                    </FormGroup>
                    <FormGroup errorText={validationErrors.categoryType}>
                      <label
                        className="usa-label"
                        htmlFor="category-type"
                        id="category-type-label"
                      >
                        Category
                      </label>
                      <BindedSelect
                        aria-describedby="documentation-category-label"
                        aria-label="documentation category dropdown"
                        bind="form.categoryType"
                        id="category-type"
                        name="categoryType"
                        onChange={validateAddPractitionerDocumentSequence}
                      >
                        <option value="">-- Select --</option>
                        {documentTypes.map(fileType => (
                          <option key={fileType} value={fileType}>
                            {fileType}
                          </option>
                        ))}
                      </BindedSelect>
                    </FormGroup>
                    {practitionerDocumentationHelper.isCertificateOfGoodStanding && (
                      <FormGroup errorText={validationErrors.location}>
                        <label
                          className="usa-label"
                          htmlFor="location"
                          id="location-label"
                        >
                          State/Territory
                        </label>
                        <BindedSelect
                          aria-describedby="location"
                          aria-label="documentation location dropdown"
                          bind="form.location"
                          className="usa-input"
                          id="location"
                          name="location"
                          onChange={validateAddPractitionerDocumentSequence}
                        >
                          <option value="">- Select -</option>
                          <optgroup label="State">
                            {Object.keys(usStates).map(abbrev => {
                              const fullStateName = usStates[abbrev];
                              return (
                                <option key={fullStateName} value={abbrev}>
                                  {fullStateName}
                                </option>
                              );
                            })}
                          </optgroup>
                          <optgroup label="Other">
                            {usStatesOther.map(abbrev => {
                              return (
                                <option key={abbrev} value={abbrev}>
                                  {abbrev}
                                </option>
                              );
                            })}
                          </optgroup>
                        </BindedSelect>
                      </FormGroup>
                    )}
                    <FormGroup>
                      <label
                        className="usa-label"
                        htmlFor="documentation-notes"
                        id="documentation-notes-label"
                      >
                        Description (optional)
                      </label>
                      <BindedTextarea
                        bind="form.description"
                        id="documentation-notes"
                        required={false}
                      ></BindedTextarea>
                    </FormGroup>
                  </div>
                </div>
              </div>
              <div className="grid-row margin-bottom-6 margin-top-5">
                <div className="grid-col-12">
                  <Button onClick={submitAddPractitionerDocumentSequence}>
                    Add File
                  </Button>
                  <Button
                    link
                    onClick={() =>
                      navigateToPractitionerDocumentsPageSequence({
                        barNumber,
                        tab: 'practitioner-documentation',
                      })
                    }
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  },
);

PractitionerAddDocument.displayName = 'PractitionerAddDocument';
