import { isEmpty, orderBy, uniq } from 'lodash';
import { state } from 'cerebral';

export const opinionPamphletsHelper = (get, applicationContext) => {
  const opinionPamphlets = get(state.opinionPamphlets);
  // const opinionPamphletsFormatted = orderBy(
  //   opinionPamphlets,
  //   ['filingDate'],
  //   ['desc'],
  // );
  //order by filing date descending
  const pamphletsByDate = {};

  opinionPamphlets.forEach(pamphlet => {
    pamphlet.formattedFilingDate = applicationContext
      .getUtilities()
      .formatDateString(pamphlet.filingDate, 'YYYYMMDD');

    pamphlet.filingDate = applicationContext
      .getUtilities()
      .formatDateString(pamphlet.filingDate, 'MMDDYY');

    if (isEmpty(pamphletsByDate[pamphlet.formattedFilingDate])) {
      pamphletsByDate[pamphlet.formattedFilingDate] = [pamphlet];
    } else {
      pamphletsByDate[pamphlet.formattedFilingDate].push(pamphlet);
    }
  });

  const filedPamphletDatesSorted = orderBy(
    Object.keys(pamphletsByDate),
    ['filingDate'],
    ['desc'],
  );

  const pamphletPeriods = uniq(
    filedPamphletDatesSorted.map(filingDate => {
      const b = applicationContext.getUtilities().deconstructDate(filingDate);
      return b.year;
    }),
  );

  return { pamphletPeriods, pamphletsByDate };
};

//filed datwe same for all tcrps tacross diff cases that refer to one papmhlet
//last name of primary petr/ just business name a-z
