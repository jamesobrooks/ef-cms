import { state } from 'cerebral';

/**
 * takes the yes path if either contact primary or secondary email has been updated on the form;
 * takes the no path otherwise
 * @param {object} providers the providers object
 * @param {object} providers.get the cerebral get function
 * @param {object} providers.path the cerebral path function
 * @returns {object} continue path for the sequence
 */
export const hasUpdatedPetitionerEmailAction = ({ get, path }: ActionProps) => {
  const { contact: formContact } = get(state.form);

  if (formContact.updatedEmail) {
    formContact.updatedEmail = formContact.updatedEmail.trim();
    formContact.confirmEmail = formContact.confirmEmail.trim();

    return path.yes();
  }

  return path.no();
};
