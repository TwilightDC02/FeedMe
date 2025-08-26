function segregatePromoText(bodyText) {
  // --- 1. Extract the Promo Period ---
  let promoPeriod = 'Not found';
  const periodMatch = bodyText.match(/The Promo Period is from (.*?)\n/);
  if (periodMatch && periodMatch[1]) {
    promoPeriod = periodMatch[1].trim();
  }

  // --- 2. Extract the Offer Details ---
  let offerDetails = 'Not found';
  const offerMatch = bodyText.match(/Promo Offer\n([\s\S]*?)Promo Mechanics/);
  if (offerMatch && offerMatch[1]) {
    offerDetails = offerMatch[1]
      .replace(/\n\s*\n/g, '\n') // Remove extra blank lines
      .trim();
  }

//   // --- 3. Extract the Participating Cards ---
//   let participatingCards = [];
//   const cardsMatch = bodyText.match(/BPI Credit Cards\n([\s\S]*?)2./);
//   if (cardsMatch && cardsMatch[1]) {
//     participatingCards = cardsMatch[1]
//       // 1. Globally fix missing spaces between words (e.g., "CardBPI" -> "Card BPI")
//     .replace(/([a-z])([A-Z])/g, '$1 $2')
//     .trim()
//     // 2. Split the entire block of text into an array using the newline as the separator
//     .split('\n')
//     // 3. Clean up each item in the resulting array
//     .map(card => card.trim()) // Remove leading/trailing whitespace from each line
//     .filter(card => card !== ''); // Remove any empty lines that resulted from the split
//   }

  return {
    promoPeriod,
    offerDetails,
  };
}

function listCards(cardText) {
  return cardText
    // 1. Globally fix missing spaces between words (e.g., "CardBPI" -> "Card BPI")
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    // 2. Split the entire block of text into an array using the newline as the separator
    .split('\n')
    // 3. Clean up each item in the resulting array
    .map(card => card.trim()) // Remove leading/trailing whitespace from each line
    .filter(card => card !== ''); // Remove any empty lines that resulted from the split
}

// Make the function available to other files
module.exports = { segregatePromoText, listCards };