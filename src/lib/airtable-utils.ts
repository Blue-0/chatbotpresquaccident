/**
 * Airtable utility functions for secure query construction
 */

/**
 * Escapes special characters for Airtable formula queries
 * Prevents formula injection attacks
 *
 * @param value - The string value to escape
 * @returns Safely escaped string for use in Airtable formulas
 */
export function escapeAirtableFormula(value: string): string {
  if (typeof value !== 'string') {
    throw new Error('Value must be a string');
  }

  // Escape special characters that could break out of the formula
  return value
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/"/g, '\\"')    // Escape double quotes
    .replace(/\n/g, '\\n')   // Escape newlines
    .replace(/\r/g, '\\r')   // Escape carriage returns
    .replace(/\t/g, '\\t');  // Escape tabs
}

/**
 * Creates a safe Airtable filter formula for email matching
 * Uses LOWER() for case-insensitive comparison
 *
 * @param email - The email to search for
 * @param fieldName - The field name in Airtable (default: 'mail')
 * @returns Safe filter formula string
 */
export function createEmailFilterFormula(
  email: string,
  fieldName: string = 'mail'
): string {
  const escapedEmail = escapeAirtableFormula(email.toLowerCase().trim());
  return `LOWER({${fieldName}}) = "${escapedEmail}"`;
}

/**
 * Creates a safe Airtable filter formula for identifier or email matching
 * Searches in both 'username' and 'mail' fields with case-insensitive comparison
 *
 * @param identifier - The identifier or email to search for
 * @param usernameField - The username field name in Airtable (default: 'username')
 * @param emailField - The email field name in Airtable (default: 'mail')
 * @returns Safe filter formula string
 */
export function createIdentifierFilterFormula(
  identifier: string,
  usernameField: string = 'username',
  emailField: string = 'mail'
): string {
  const escapedIdentifier = escapeAirtableFormula(identifier.toLowerCase().trim());

  // Recherche dans le champ username OU mail (insensible à la casse)
  return `OR(LOWER({${usernameField}}) = "${escapedIdentifier}", LOWER({${emailField}}) = "${escapedIdentifier}")`;
}
