/**
 * Replaces a series of [square bracketed strings] with values
 *
 * @param {string} template the template for replacement
 * @param  {...any} values the values to replace the brackets
 * @returns {string|void} the template with the brackets replaced with replacement values
 */
export const replaceBracketed = (template, ...values) => {
  if (!template) return;
  const bracketsMatcher = /\[.*?\]/;
  while (bracketsMatcher.test(template)) {
    template = template.replace(bracketsMatcher, values.shift() || '');
  }
  template = template.trim();
  return template;
};
