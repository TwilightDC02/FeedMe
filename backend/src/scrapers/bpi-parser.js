function getPromoPeriod(bodyText) {
  // Normalize whitespace first
  const normalizedText = bodyText.replace(/\s+/g, ' ').trim();
  
  // Pattern 1: "Promo Period is from ... to ..."
  let match = normalizedText.match(/Promo Period is from\s+(.*?)\s+(?:to|until)\s+(.*?)(?:\s+Step|\.|;|$)/i);
  if (match && match[1] && match[2]) {
    const start = match[1].trim();
    const end = match[2].trim();
    return `${start} to ${end}`;
  }

  // Pattern 2: "Valid from ... to ..."
  match = normalizedText.match(/Valid from\s+(.*?)\s+(?:to|until)\s+(.*?)(?:\s+Step|\.|;|$)/i);
  if (match && match[1] && match[2]) {
    const start = match[1].trim();
    const end = match[2].trim();
    return `${start} to ${end}`;
  }

  return 'Not found';
}

module.exports = { getPromoPeriod };