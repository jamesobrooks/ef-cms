import { AdvancedSearchHeader } from './AdvancedSearchHeader';
import { CaseSearchForm } from './CaseSearchForm';
import { DocumentSearchResults } from './DocumentSearchResults';
import { ErrorNotification } from '../ErrorNotification';
import { Mobile, NonMobile } from '../../ustc-ui/Responsive/Responsive';
import { OpinionSearchForm } from './OpinionSearchForm';
import { OrderSearchForm } from './OrderSearchForm';
import { PractitionerSearchForm } from './PractitionerSearchForm';
import { PractitionerSearchResults } from './PractitionerSearchResults';
import { SearchBoilerplateText } from '../Public/SearchBoilerplateText';
import { SearchResults } from './SearchResults';
import { SuccessNotification } from '../SuccessNotification';
import { Tab, Tabs } from '../../ustc-ui/Tabs/Tabs';
import { WarningNotification } from '../WarningNotification';
import { connect } from '@cerebral/react';
import { sequences, state } from 'cerebral';
import React from 'react';

export const AdvancedSearch = connect(
  {
    advancedSearchHelper: state.advancedSearchHelper,
    advancedSearchTab: state.advancedSearchTab,
    advancedSearchTabChangeSequence: sequences.advancedSearchTabChangeSequence,
    cerebralBindSimpleSetStateSequence:
      sequences.cerebralBindSimpleSetStateSequence,
    featureFlagHelper: state.featureFlagHelper,
    searchTabs: state.constants.ADVANCED_SEARCH_TABS,
    submitCaseAdvancedSearchSequence:
      sequences.submitCaseAdvancedSearchSequence,
    submitCaseDocketNumberSearchSequence:
      sequences.submitCaseDocketNumberSearchSequence,
    submitOpinionAdvancedSearchSequence:
      sequences.submitOpinionAdvancedSearchSequence,
    submitOrderAdvancedSearchSequence:
      sequences.submitOrderAdvancedSearchSequence,
    submitPractitionerBarNumberSearchSequence:
      sequences.submitPractitionerBarNumberSearchSequence,
    submitPractitionerNameSearchSequence:
      sequences.submitPractitionerNameSearchSequence,
  },
  function AdvancedSearch({
    advancedSearchHelper,
    advancedSearchTab,
    advancedSearchTabChangeSequence,
    cerebralBindSimpleSetStateSequence,
    featureFlagHelper,
    searchTabs,
    submitCaseAdvancedSearchSequence,
    submitCaseDocketNumberSearchSequence,
    submitOpinionAdvancedSearchSequence,
    submitOrderAdvancedSearchSequence,
    submitPractitionerBarNumberSearchSequence,
    submitPractitionerNameSearchSequence,
  }) {
    return (
      <>
        <AdvancedSearchHeader />

        <section className="usa-section grid-container advanced-search">
          <ErrorNotification />
          <SuccessNotification />
          <WarningNotification />
          <NonMobile>
            <Tabs
              bind="advancedSearchTab"
              className="classic-horizontal-header3 tab-border"
              headingLevel="2"
              onSelect={() => {
                advancedSearchTabChangeSequence();
              }}
            >
              <Tab id="tab-case" tabName={searchTabs.CASE} title="Case">
                <SearchBoilerplateText formTypeText="a case" />
                <CaseSearchForm
                  submitAdvancedSearchSequence={
                    submitCaseAdvancedSearchSequence
                  }
                  submitDocketNumberSearchSequence={
                    submitCaseDocketNumberSearchSequence
                  }
                />
                <SearchResults />
              </Tab>
              <Tab
                disabled={!featureFlagHelper.isOrderSearchEnabledForRole}
                id="tab-order"
                tabName={searchTabs.ORDER}
                title={
                  'Order' +
                  (featureFlagHelper.isOrderSearchEnabledForRole
                    ? ''
                    : ' (Coming Soon)')
                }
              >
                <SearchBoilerplateText formTypeText="an order" />
                <OrderSearchForm
                  submitAdvancedSearchSequence={
                    submitOrderAdvancedSearchSequence
                  }
                />
                <DocumentSearchResults />
              </Tab>
              <Tab
                disabled={!featureFlagHelper.isOpinionSearchEnabledForRole}
                id="tab-opinion"
                tabName={searchTabs.OPINION}
                title={
                  'Opinion' +
                  (featureFlagHelper.isOpinionSearchEnabledForRole
                    ? ''
                    : ' (Coming Soon)')
                }
              >
                <SearchBoilerplateText
                  formTypeText="an opinion"
                  isOpinion="true"
                />
                <OpinionSearchForm
                  submitAdvancedSearchSequence={
                    submitOpinionAdvancedSearchSequence
                  }
                />
                <DocumentSearchResults />
              </Tab>
              {advancedSearchHelper.showPractitionerSearch && (
                <Tab
                  id="tab-practitioner"
                  tabName={searchTabs.PRACTITIONER}
                  title="Practitioner"
                >
                  <PractitionerSearchForm
                    submitPractitionerBarNumberSearchSequence={
                      submitPractitionerBarNumberSearchSequence
                    }
                    submitPractitionerNameSearchSequence={
                      submitPractitionerNameSearchSequence
                    }
                  />
                  <PractitionerSearchResults />
                </Tab>
              )}
            </Tabs>
          </NonMobile>

          <Mobile>
            <div className="margin-bottom-3">
              <select
                aria-label="advanced search type"
                className="usa-select"
                id="advanced-search-type-mobile-selector"
                value={advancedSearchTab}
                onChange={e => {
                  cerebralBindSimpleSetStateSequence({
                    key: 'advancedSearchTab',
                    value: e.target.value,
                  });
                }}
              >
                <option value={searchTabs.CASE}>Case</option>
                <option
                  disabled={!featureFlagHelper.isOrderSearchEnabledForRole}
                  value={searchTabs.ORDER}
                >
                  Order
                  {featureFlagHelper.isOrderSearchEnabledForRole
                    ? ''
                    : ' (Coming Soon)'}
                </option>
                <option
                  disabled={!featureFlagHelper.isOpinionSearchEnabledForRole}
                  value={searchTabs.OPINION}
                >
                  Opinion
                  {featureFlagHelper.isOpinionSearchEnabledForRole
                    ? ''
                    : ' (Coming Soon)'}
                </option>
                <option value={searchTabs.PRACTITIONER}>Practitioner</option>
              </select>
            </div>
            {(!advancedSearchTab || advancedSearchTab === searchTabs.CASE) && (
              <>
                <SearchBoilerplateText formTypeText="a case" />

                <CaseSearchForm
                  submitAdvancedSearchSequence={
                    submitCaseAdvancedSearchSequence
                  }
                  submitDocketNumberSearchSequence={
                    submitCaseDocketNumberSearchSequence
                  }
                />
                <SearchResults />
              </>
            )}
            {advancedSearchTab === searchTabs.ORDER && (
              <>
                <OrderSearchForm
                  submitAdvancedSearchSequence={
                    submitOrderAdvancedSearchSequence
                  }
                />
                <DocumentSearchResults />
              </>
            )}
            {advancedSearchTab === searchTabs.OPINION && (
              <>
                <SearchBoilerplateText
                  formTypeText="an opinion"
                  isOpinion="true"
                />
                <OpinionSearchForm
                  submitAdvancedSearchSequence={
                    submitOpinionAdvancedSearchSequence
                  }
                />
                <DocumentSearchResults />
              </>
            )}
            {advancedSearchHelper.showPractitionerSearch &&
              advancedSearchTab === searchTabs.PRACTITIONER && (
                <>
                  <PractitionerSearchForm
                    submitPractitionerBarNumberSearchSequence={
                      submitPractitionerBarNumberSearchSequence
                    }
                    submitPractitionerNameSearchSequence={
                      submitPractitionerNameSearchSequence
                    }
                  />
                  <PractitionerSearchResults />
                </>
              )}
          </Mobile>
        </section>
      </>
    );
  },
);

AdvancedSearch.displayName = 'AdvancedSearch';
