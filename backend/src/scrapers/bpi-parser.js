function getPromoPeriod(bodyText) {
  // --- 1. Extract the Promo Period ---
  let promoPeriod = 'Not found';
  const periodMatch = bodyText.match(/Promo Period is from (.*?)\./i);
  if (periodMatch && periodMatch[1]) {
    promoPeriod = periodMatch[1].trim();
  }

  return {
    promoPeriod
  };
}

// Make the function available to other files
module.exports = { getPromoPeriod };