import { Button } from '../../ustc-ui/Button/Button';
import { DocketRecordHeader } from './DocketRecordHeader';
import { DocketRecordOverlay } from './DocketRecordOverlay';
import { FilingsAndProceedings } from '../DocketRecord/FilingsAndProceedings';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { SealDocketEntryModal } from './SealDocketEntryModal';
import { UnsealDocketEntryModal } from './UnsealDocketEntryModal';
import { connect } from '@cerebral/react';
import { sequences, state } from 'cerebral';
import React from 'react';
import classNames from 'classnames';

export const DocketRecord = connect(
  {
    docketRecordHelper: state.docketRecordHelper,
    formattedDocketEntries: state.formattedDocketEntries,
    openSealDocketEntryModalSequence:
      sequences.openSealDocketEntryModalSequence,
    openUnsealDocketEntryModalSequence:
      sequences.openUnsealDocketEntryModalSequence,
    showModal: state.modal.showModal,
  },

  function DocketRecord({
    docketRecordHelper,
    formattedDocketEntries,
    openSealDocketEntryModalSequence,
    openUnsealDocketEntryModalSequence,
    showModal,
  }) {
    return (
      <>
        <DocketRecordHeader />
        <table
          aria-label="docket record"
          className="usa-table case-detail ustc-table responsive-table"
          id="docket-record-table"
        >
          <thead>
            <tr>
              <th className="center-column">
                <span>
                  <span className="usa-sr-only">Number</span>
                  <span aria-hidden="true">No.</span>
                </span>
              </th>
              <th>Date</th>
              <th className="center-column">Event</th>
              <th aria-hidden="true" className="icon-column" />
              <th>Filings and Proceedings</th>
              <th>Pages</th>
              <th>Filed By</th>
              <th>Action</th>
              <th>Served</th>
              <th className="center-column">Parties</th>
              {docketRecordHelper.showEditOrSealDocketRecordEntry && (
                <th>&nbsp;</th>
              )}
            </tr>
          </thead>
          <tbody>
            {formattedDocketEntries.formattedDocketEntriesOnDocketRecord.map(
              (entry, arrayIndex) => {
                return (
                  <tr
                    className={classNames(
                      entry.isInProgress && 'in-progress',
                      entry.qcWorkItemsUntouched && 'qc-untouched',
                    )}
                    key={entry.docketEntryId}
                  >
                    <td className="center-column hide-on-mobile">
                      {entry.index}
                    </td>
                    <td>
                      <span
                        className={classNames(
                          entry.isStricken && 'stricken-docket-record',
                          'no-wrap',
                        )}
                      >
                        {entry.createdAtFormatted}
                      </span>
                    </td>
                    <td className="center-column hide-on-mobile">
                      {entry.eventCode}
                    </td>
                    <td aria-hidden="true" className="filing-type-icon">
                      {entry.iconsToDisplay.map(iconInfo => (
                        <FontAwesomeIcon key={iconInfo.icon} {...iconInfo} />
                      ))}
                    </td>
                    <td>
                      <FilingsAndProceedings
                        arrayIndex={arrayIndex}
                        entry={entry}
                      />
                    </td>
                    <td className="hide-on-mobile number-of-pages">
                      {entry.numberOfPages}
                    </td>
                    <td className="hide-on-mobile">{entry.filedBy}</td>
                    <td className="hide-on-mobile">{entry.action}</td>
                    <td className="hide-on-mobile">
                      {entry.showNotServed && (
                        <span className="text-semibold not-served">
                          Not served
                        </span>
                      )}
                      {entry.showServed && (
                        <span>{entry.servedAtFormatted}</span>
                      )}
                    </td>
                    <td className="center-column hide-on-mobile">
                      <span className="responsive-label">Parties</span>
                      {entry.showServed && entry.servedPartiesCode}
                    </td>
                    {docketRecordHelper.showEditOrSealDocketRecordEntry && (
                      <td>
                        {entry.showEditDocketRecordEntry && (
                          <Button
                            link
                            href={entry.editDocketEntryMetaLink}
                            icon="edit"
                          >
                            Edit
                          </Button>
                        )}
                        {entry.showSealDocketRecordEntry && (
                          <Button
                            link
                            className={entry.isSealed && 'red-warning'}
                            data-test={`seal-docket-entry-button-${arrayIndex}`}
                            icon={entry.sealIcon}
                            tooltip={entry.sealButtonTooltip}
                            onClick={() => {
                              entry.isSealed
                                ? openUnsealDocketEntryModalSequence({
                                    docketEntryId: entry.docketEntryId,
                                    showModal: 'UnsealDocketEntryModal',
                                  })
                                : openSealDocketEntryModalSequence({
                                    docketEntryId: entry.docketEntryId,
                                    showModal: 'SealDocketEntryModal',
                                  });
                            }}
                          >
                            {entry.sealButtonText}
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
        {showModal == 'DocketRecordOverlay' && <DocketRecordOverlay />}
        {showModal == 'SealDocketEntryModal' && <SealDocketEntryModal />}
        {showModal == 'UnsealDocketEntryModal' && <UnsealDocketEntryModal />}
      </>
    );
  },
);

DocketRecord.displayName = 'DocketRecord';