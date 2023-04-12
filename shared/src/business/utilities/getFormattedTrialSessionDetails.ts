const { compact, partition } = require('lodash');
const { PARTIES_CODES } = require('../entities/EntityConstants');

exports.setPretrialMemorandumFiler = ({ caseItem }) => {
  let filingPartiesCode;
  let numberOfPetitionerFilers = 0;

  const pretrialMemorandumDocketEntries = caseItem.docketEntries.filter(
    d => d.eventCode === 'PMT' && !d.isStricken,
  );

  if (pretrialMemorandumDocketEntries.length > 0) {
    pretrialMemorandumDocketEntries.forEach(docketEntry => {
      docketEntry.filers.forEach(filerId => {
        if (caseItem.petitioners.some(p => p.contactId === filerId)) {
          numberOfPetitionerFilers++;
        }
      });
    });

    if (
      numberOfPetitionerFilers > 0 &&
      pretrialMemorandumDocketEntries.some(d => d.partyIrsPractitioner)
    ) {
      filingPartiesCode = PARTIES_CODES.BOTH;
    } else if (numberOfPetitionerFilers > 0) {
      filingPartiesCode = PARTIES_CODES.PETITIONER;
    } else if (
      pretrialMemorandumDocketEntries.some(d => d.partyIrsPractitioner)
    ) {
      filingPartiesCode = PARTIES_CODES.RESPONDENT;
    }
  } else {
    filingPartiesCode = undefined;
  }

  return filingPartiesCode;
};

exports.formatCase = ({
  applicationContext,
  caseItem,
  eligibleCases,
  setFilingPartiesCode = false,
}) => {
  caseItem.caseTitle = applicationContext.getCaseTitle(
    caseItem.caseCaption || '',
  );
  if (caseItem.removedFromTrialDate) {
    caseItem.removedFromTrialDateFormatted = applicationContext
      .getUtilities()
      .formatDateString(caseItem.removedFromTrialDate, 'MMDDYY');
  }
  const { DOCKET_NUMBER_SUFFIXES } = applicationContext.getConstants();
  const highPrioritySuffixes = [
    DOCKET_NUMBER_SUFFIXES.LIEN_LEVY, // L
    DOCKET_NUMBER_SUFFIXES.PASSPORT, // P
    DOCKET_NUMBER_SUFFIXES.SMALL_LIEN_LEVY, // SL
  ];
  caseItem.isDocketSuffixHighPriority = highPrioritySuffixes.includes(
    caseItem.docketNumberSuffix,
  );

  if (setFilingPartiesCode) {
    caseItem.filingPartiesCode = exports.setPretrialMemorandumFiler({
      caseItem,
    });
  }

  const newCaseItem = applicationContext
    .getUtilities()
    .setConsolidationFlagsForDisplay(caseItem, eligibleCases);

  return newCaseItem;
};

const getDocketNumberSortString = ({ allCases = [], theCase }) => {
  const leadCase = allCases.find(
    aCase => aCase.docketNumber === theCase.leadDocketNumber,
  );

  const isLeadCaseInList = !!theCase.leadDocketNumber && !!leadCase;

  return `${getSortableDocketNumber(
    isLeadCaseInList
      ? theCase.docketNumber === theCase.leadDocketNumber
        ? theCase.docketNumber
        : theCase.leadDocketNumber
      : theCase.docketNumber,
  )}-${getSortableDocketNumber(theCase.docketNumber)}`;
};

const compareCasesByDocketNumberFactory =
  ({ allCases }) =>
  (a, b) => {
    const aSortString = getDocketNumberSortString({
      allCases,
      theCase: a,
    });
    const bSortString = getDocketNumberSortString({
      allCases,
      theCase: b,
    });
    return aSortString.localeCompare(bSortString);
  };

const getSortableDocketNumber = docketNumber => {
  const [number, year] = docketNumber.split('-');
  return `${year}-${number.padStart(6, '0')}`;
};

const compareCasesByDocketNumber = (a, b) => {
  const aSortString = getSortableDocketNumber(a.docketNumber);
  const bSortString = getSortableDocketNumber(b.docketNumber);
  return aSortString.localeCompare(bSortString);
};

exports.compareCasesByDocketNumberFactory = compareCasesByDocketNumberFactory;
exports.compareCasesByDocketNumber = compareCasesByDocketNumber;

exports.getFormattedTrialSessionDetails = ({
  applicationContext,
  trialSession,
}) => {
  if (!trialSession) return undefined;

  const allCases = (trialSession.calendaredCases || []).map(caseItem =>
    exports.formatCase({
      applicationContext,
      caseItem,
      setFilingPartiesCode: true,
    }),
  );

  const [inactiveCases, openCases] = partition(
    allCases,
    item => item.removedFromTrial === true,
  );

  trialSession.openCases = openCases
    .map(caseItem =>
      applicationContext
        .getUtilities()
        .setConsolidationFlagsForDisplay(caseItem, openCases),
    )
    .sort(compareCasesByDocketNumberFactory({ allCases: openCases }));

  trialSession.inactiveCases = inactiveCases
    .map(caseItem =>
      applicationContext
        .getUtilities()
        .setConsolidationFlagsForDisplay(caseItem, inactiveCases),
    )
    .sort(
      compareCasesByDocketNumberFactory({
        allCases: inactiveCases,
      }),
    );

  trialSession.allCases = allCases
    .map(caseItem =>
      applicationContext
        .getUtilities()
        .setConsolidationFlagsForDisplay(caseItem, allCases),
    )
    .sort(
      compareCasesByDocketNumberFactory({
        allCases,
      }),
    );

  trialSession.formattedTerm = `${
    trialSession.term
  } ${trialSession.termYear.substr(-2)}`;

  trialSession.formattedStartDate = applicationContext
    .getUtilities()
    .formatDateString(trialSession.startDate, 'MMDDYY');

  trialSession.formattedEstimatedEndDate = applicationContext
    .getUtilities()
    .formatDateString(trialSession.estimatedEndDate, 'MMDDYY');

  trialSession.formattedStartDateFull = applicationContext
    .getUtilities()
    .formatDateString(trialSession.startDate, 'MONTH_DAY_YEAR');

  let [hour, min] = trialSession.startTime.split(':');
  let startTimeExtension = +hour >= 12 ? 'pm' : 'am';

  if (+hour > 12) {
    hour = +hour - 12;
  }

  trialSession.formattedStartTime = `${hour}:${min} ${startTimeExtension}`;
  trialSession.formattedJudge =
    (trialSession.judge && trialSession.judge.name) || 'Not assigned';
  trialSession.formattedTrialClerk =
    (trialSession.trialClerk && trialSession.trialClerk.name) ||
    trialSession.alternateTrialClerkName ||
    'Not assigned';
  trialSession.formattedCourtReporter =
    trialSession.courtReporter || 'Not assigned';
  trialSession.formattedIrsCalendarAdministrator =
    trialSession.irsCalendarAdministrator || 'Not assigned';
  trialSession.formattedChambersPhoneNumber =
    trialSession.chambersPhoneNumber || 'No phone number';

  trialSession.formattedCity = undefined;
  if (trialSession.city) trialSession.formattedCity = `${trialSession.city},`;

  trialSession.formattedCityStateZip = compact([
    trialSession.formattedCity,
    trialSession.state,
    trialSession.postalCode,
  ]).join(' ');

  trialSession.noLocationEntered =
    !trialSession.courthouseName &&
    !trialSession.address1 &&
    !trialSession.address2 &&
    !trialSession.formattedCityStateZip;

  trialSession.showSwingSession =
    !!trialSession.swingSession &&
    !!trialSession.swingSessionId &&
    !!trialSession.swingSessionLocation;

  const trialDate = applicationContext
    .getUtilities()
    .formatDateString(trialSession.startDate, 'FILENAME_DATE');
  const { trialLocation } = trialSession;
  trialSession.zipName = `${trialDate}-${trialLocation}.zip`
    .replace(/\s/g, '_')
    .replace(/,/g, '');

  return trialSession;
};