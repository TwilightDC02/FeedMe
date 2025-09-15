function getPromoPeriod(bodyText) {
  // --- 1. Extract the Promo Period ---
  let promoPeriod = 'Not found';
  const periodMatch = bodyText.match(/Promo Period is from (.*?)(?:\.|\n)/i);
  if (periodMatch && periodMatch[1]) {
    promoPeriod = periodMatch[1].trim();
  }

  return {
    promoPeriod
  };
}

function normalizeOfferDetails(offerText) {
  const normalized = {
    discountValue: null,
    discountType: '% off',
    dealType: 'General',
    minSpend: null,
    maxDiscount: null,
    validDays: [],
    blackoutDates: '',
    conditions: [],
    rawText: offerText
  };

  const lowercasedText = offerText.toLowerCase();

  // --- Extract Numerical Values ---
  const discountMatch = lowercasedText.match(/(\d+)% off/);
  if (discountMatch && discountMatch[1]) {
    normalized.discountValue = parseInt(discountMatch[1], 10);
  }

  const minSpendMatch = lowercasedText.match(/(?:minimum|min) spend of php ([\d,]+)/);
  if (minSpendMatch && minSpendMatch[1]) {
    normalized.minSpend = parseInt(minSpendMatch[1].replace(/,/g, ''), 10);
  }

  const maxDiscountMatch = lowercasedText.match(/(?:maximum|max) discount of php ([\d,]+)/);
  if (maxDiscountMatch && maxDiscountMatch[1]) {
    normalized.maxDiscount = parseInt(maxDiscountMatch[1].replace(/,/g, ''), 10);
  }

  // --- Extract Text-Based Conditions ---
  const validDaysMatch = lowercasedText.match(/valid on (monday|tuesday|wednesday|thursday|friday|saturday|sunday,?\s?)+/);
  if (validDaysMatch && validDaysMatch[0]) {
    normalized.validDays = validDaysMatch[0].replace('valid on', '').trim().split(/,\s*/);
  }

  const blackoutDatesMatch = lowercasedText.match(/blackout dates:([\s\S]*)/);
  if (blackoutDatesMatch && blackoutDatesMatch[1]) {
    normalized.blackoutDates = blackoutDatesMatch[1].trim();
  }
  
  if (lowercasedText.includes('dine-in only')) {
    normalized.conditions.push('Dine-in only');
  }
  if (lowercasedText.includes('food orders only')) {
    normalized.conditions.push('Food orders only');
  }

  return normalized;
}

module.exports = { normalizeOfferDetails };

// Make the function available to other files
module.exports = { getPromoPeriod, normalizeOfferDetails };