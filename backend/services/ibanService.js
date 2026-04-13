const crypto = require('crypto');

// Générer un IBAN fictif
const generateIBAN = () => {
  const countryCode = 'FR';
  const bankCode = '12345'; // Code banque fictif
  const accountNumber = crypto.randomBytes(10).toString('hex').toUpperCase();
  return `${countryCode}${bankCode}${accountNumber}`;
};

module.exports = { generateIBAN };