function getPromoPeriod(bodyText) {
  // --- 1. Extract the Promo Period ---
  let promoPeriod = 'Not found';
  const periodMatch = bodyText.match(/The Promo Period is from (.*?)\n/);
  if (periodMatch && periodMatch[1]) {
    promoPeriod = periodMatch[1].trim();
  }

  return {
    promoPeriod
  };
}

function listCards(cardText) {
  return cardText
    // 1. Globally fix missing spaces between words (e.g., "CardBPI" -> "Card BPI")
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    // 2. Split the entire block of text into an array using positive lookbehind the word Card as the separator
    .split(/(?<=\sCard)\s+/)
    // 3. Clean up each item in the resulting array
    .map(card => card.trim()) // Remove leading/trailing whitespace from each line
    .filter(card => card !== ''); // Remove any empty lines that resulted from the split
}

// Make the function available to other files
module.exports = { getPromoPeriod, listCards };