require('dotenv').config({ path: '../../.env' });
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const Promo = require('../models/Promo.js');

const { getPromoPeriod } = require('./bpi-parser.js')

async function fetchAllPromoLinks() {
  let browser;
  try {
    const baseUrl = 'https://www.bpi.com.ph';
    const listUrl = `${baseUrl}/personal/rewards-and-promotions/promos?tab=All&chip=Restaurants`;
    
    browser = await puppeteer.launch({
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    await page.goto(listUrl, { waitUntil: 'networkidle2' });
    console.log('Now waiting for filter');
    
    await page.waitForSelector('#All-tabpanel #Restaurants-chippanel.article-chip.active');
    console.log('Filter active');
    await page.waitForSelector('.social-share--component-link.ga');
    console.log('Page loaded, starting to scrape...');
    
    const loadMoreButtonSelector = '#All-tabpanel .btn.tabs-showmore-btn';
    let loadMoreButtonVisible = true;
    while (loadMoreButtonVisible) {
      try {
        await page.waitForSelector(loadMoreButtonSelector, { visible: true, timeout: 5000 });
        console.log('Clicking "Load More"');
        await page.click(loadMoreButtonSelector);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      catch (error) {
        loadMoreButtonVisible = false;
        console.log('No more "Load More" buttons found.');
      }
    }    

    let promoLinks = await page.evaluate((baseUrl) => {
      const promos = [];
      const promoCards = document.querySelectorAll('#All-tabpanel .social-share--component-link.ga');
      
      promoCards.forEach(card => {
        let promoPeriod = 'Not found';
        let promoDetails = 'More details in the link';
        const relativeLink = card.getAttribute('href');
        if (relativeLink) {
          const periodContainer = card.parentElement.parentElement.previousElementSibling.querySelector('.tab-date-cont');
          const detailsContainer = card.previousElementSibling;
          if (periodContainer){
            promoPeriod = periodContainer.textContent.trim();
          }
          if (detailsContainer){
            promoDetails = detailsContainer.textContent.trim();
          }
          promos.push({
            link: `${baseUrl}${relativeLink}`,
            promoPeriod: promoPeriod,
            details: promoDetails
          })

        }

      });
      return promos;
    }, baseUrl);

    console.log(`Found ${promoLinks.length} promo links.`);
    return promoLinks;
  } catch (err){
    console.error(err);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}

async function savePromosToDB(promoDataArray) {
  if (!promoDataArray || promoDataArray.length === 0) {
    console.log('No new promo details to save.');
    return;
  }
  
  console.log('Connecting to the database to save promos...');
  await mongoose.connect(process.env.MONGO_URI);

  if (!Promo || typeof Promo.findOneAndUpdate !== 'function') {
    console.error('Promo model is invalid:', Promo);
    throw new Error('Promo model is not a valid Mongoose model');
  }

  let newPromos = 0;
  let updatedPromos = 0;

  for (const promoData of promoDataArray) {
    const result = await Promo.findOneAndUpdate(
      { link: promoData.link },
      promoData,
      { new: true, upsert: true }
    );

    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      newPromos++;
    } else {
      updatedPromos++;
    }
  }

  console.log(`Database update complete. Added: ${newPromos}. Updated: ${updatedPromos}.`);
}

// IMPROVED: Extract promo period and clean up spacing issues
function extractPromoPeriod(bodyText) {
  // First, normalize the text by removing excess whitespace
  const normalizedText = bodyText.replace(/\s+/g, ' ').trim();
  
  let promoPeriod = getPromoPeriod(normalizedText)
  if (promoPeriod){
    return promoPeriod
  }
  else {
  return 'Ongoing'; 
  }
}

// Extract ONLY credit cards with strict validation
function extractCreditCards($, body) {
  const creditCards = [];
  const validCardPrefixes = ['bpi', 'robinsons', 'visa', 'mastercard', 'petron', 'dos', 'amore', 'simple', 'pru'];
  
  // UNIFIED CONSTANTS: Define these once to use everywhere for consistency.
  const excludePatterns = [
    'valid for', 'only from', 'mondays to', "father's day", 'fridays',
    'saturdays', 'sundays', 'dine-in', 'website and search', 'search for',
    'shop anywhere', 'mastercard shop'
  ];
  const genericTerms = [
    'cards', 'credit cards', 'debit cards', 'prepaid cards',
    'mastercard credit card', 'visa credit card', 'bpi credit cards',
    'robinsons bank credit cards'
  ];

  const mechanicsMarker = body.find('h3').filter((i, el) => {
    return $(el).text().toLowerCase().includes('mechanics');
  });

  if (mechanicsMarker.length > 0) {
    // Check UL lists
    const cardLists = mechanicsMarker.nextAll('ul').slice(0, 3);
    
    const nonBoldItems = cardLists.filter((i, el) => {
      return $(el).find('b, strong').length === 0;
    })

    nonBoldItems.each((i, ul) => {
      $(ul).find('li').each((j, li) => {
        const $li = $(li);
        
        if ($li.is('b, strong') || $li.children().first().is('b, strong')) return;
        
        const htmlContent = $li.html();
        if (htmlContent && (htmlContent.startsWith('<b>') || htmlContent.startsWith('<strong>'))) return;

        let cardNameClean = $li.clone().children('ul').remove().end().text().trim();
        
        if (!cardNameClean) return;
        
        cardNameClean = cardNameClean.replace(/\s+/g, ' ').trim();
        const lowerText = cardNameClean.toLowerCase();
        
        if (lowerText.includes(' or ') || lowerText.includes(' and ')) return;
        
        // Use the unified heading rule
        if (lowerText.endsWith('cards') && cardNameClean.split(' ').length <= 4) return;
        
        // Use the unified generic terms
        if (genericTerms.includes(lowerText)) return;
        if (!lowerText.includes('card')) return;
        
        // Use the unified exclude patterns
        if (excludePatterns.some(pattern => lowerText.includes(pattern))) return;
        
        const hasValidPrefix = validCardPrefixes.some(prefix => lowerText.includes(prefix));
        if (!hasValidPrefix) return;
        
        cardNameClean = cardNameClean.replace(/[*]+$/g, '').trim();
        
        if (cardNameClean.length < 12 || cardNameClean.length > 40) return;
        
        const wordCount = cardNameClean.split(/\s+/).length;
        if (wordCount < 2 || wordCount > 6) return;
        
        const normalized = cardNameClean.toLowerCase().replace(/\s+/g, '');
        const isDuplicate = creditCards.some(existingCard => {
          const normalizedExisting = existingCard.toLowerCase().replace(/\s+/g, '');
          return normalizedExisting === normalized;
        });
        
        if (!isDuplicate) {
          creditCards.push(cardNameClean);
        }
      });
    });

    // Check <p> tags after mechanics marker
    const cardParagraphs = mechanicsMarker.nextAll('p');

    const nonBoldParagraphs = cardParagraphs.filter((index, element) => {
      return $(element).find('b, strong').length === 0;
    });

    nonBoldParagraphs.each((i, p) => {
      const $p = $(p);
      if ($p.is('b, strong') || $p.children().first().is('b, strong')) return;
      
      const htmlContent = $p.html();
      if (htmlContent && (htmlContent.startsWith('<b>') || htmlContent.startsWith('<strong>'))) return;
      
      let text = $p.text().trim();
      if (!text) return;
      
      text = text.replace(/^[\d]+\.\s*/g, '').trim();
      text = text.replace(/^[•·∙○●◦▪▫■□‣⁃−-]\s*/g, '').trim();
      text = text.replace(/\s+/g, ' ').trim();
      const lowerText = text.toLowerCase();
      
      if (!lowerText.includes('card')) return;
      
      // CHANGE: Replaced the aggressive heading filter with the more nuanced one.
      if (lowerText.endsWith('cards') && text.split(' ').length <= 4) return;
      
      if (lowerText.includes(' or ') || lowerText.includes(' and ')) return;
      
      // Use the unified generic terms
      if (genericTerms.includes(lowerText)) return;
      
      // Use the unified exclude patterns
      if (excludePatterns.some(pattern => lowerText.includes(pattern))) return;
      
      const hasValidPrefix = validCardPrefixes.some(prefix => lowerText.includes(prefix));
      if (!hasValidPrefix) return;
      
      text = text.replace(/[*]+$/g, '').trim();
      
      if (text.length < 12 || text.length > 40) return;
      
      const wordCount = text.split(/\s+/).length;
      if (wordCount < 2 || wordCount > 6) return;
      
      const normalized = text.toLowerCase().replace(/\s+/g, '');
      const isDuplicate = creditCards.some(existingCard => {
        const normalizedExisting = existingCard.toLowerCase().replace(/\s+/g, '');
        return normalizedExisting === normalized;
      });
      
      if (!isDuplicate) {
        creditCards.push(text);
      }
    });
  }

  // Fallback
  if (creditCards.length === 0) {
    body.find('li, p').each((i, elem) => {
      // Use the safer method to get text that ignores nested lists
      let text = $(elem).clone().children('ul').remove().end().text().trim();
      
      text = text.replace(/\s+/g, ' ').trim();
      const lowerText = text.toLowerCase();
      
      if (!text || text.length < 12 || text.length > 40) return;
      if (!lowerText.includes('card')) return;
      if (lowerText.includes(' or ') || lowerText.includes(' and ')) return;
      
      // --- ADDED: All the missing checks to make the fallback safer ---
      if (excludePatterns.some(pattern => lowerText.includes(pattern))) return;
      if (genericTerms.includes(lowerText)) return;
      if (lowerText.endsWith('cards') && text.split(' ').length <= 4) return;
      // --- End of Added Checks ---
      
      const hasValidPrefix = validCardPrefixes.some(prefix => lowerText.includes(prefix));
      if (!hasValidPrefix) return;
      
      const wordCount = text.split(/\s+/).length;
      if (wordCount < 2 || wordCount > 6) return;
      
      const cleanCard = text.replace(/[*]+$/g, '').trim();
      
      const normalized = cleanCard.toLowerCase().replace(/\s+/g, '');
      const isDuplicate = creditCards.some(existingCard => {
        const normalizedExisting = existingCard.toLowerCase().replace(/\s+/g, '');
        return normalizedExisting === normalized;
      });
      
      if (!isDuplicate) {
        creditCards.push(cleanCard);
      }
    });
  }

  return creditCards.length > 0 ? creditCards : ['BPI Credit Card'];
}

async function scrapeBpiPromos(){
  console.log('Starting simplified BPI promo scraper...');
  const allPromoDetails = [];
  
  try {
    const promoLinks = await fetchAllPromoLinks();

    if (!promoLinks || promoLinks.length === 0) {
      console.log('No promo links found.');
      return [];
    }

    const batchSize = 25;
    for (let i = 0; i < promoLinks.length; i += batchSize) {
      const batch = promoLinks.slice(i, i + batchSize);
      
      let browser;
      let page;
      
      try {
        browser = await puppeteer.launch({
          headless: true, 
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        page = await browser.newPage();
        
        for (const promo of batch) {
          try {
            await page.goto(promo.link, { waitUntil: 'domcontentloaded', timeout: 30000});
            await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
            const html = await page.content();
            const $ = cheerio.load(html);

            // Extract title
            const title = $('h1.content__heading').text().trim();
            
            if (!title) {
              console.warn(`Skipped ${promo.link} - no title found`);
              continue;
            }

            // Find body content with fallbacks
            let body = $('.text.aem-GridColumn--default--12 > div[data-cmp-data-layer]');
            if (body.length === 0) {
              body = $('.text.aem-GridColumn--default--12');
            }
            if (body.length === 0) {
              body = $('main .text');
            }

            const bodyText = body.text();

            // Extract only what we need
            const link = promo.link;
            const promoPeriod = promo.promoPeriod;
            const participatingCards = extractCreditCards($, body);
            const promoDetails = promo.details;

            // Build minimal promo object
            allPromoDetails.push({
              title,
              link,
              promoPeriod,
              offer: {
                header: promoDetails,
                details: []
              },
              participatingCards
            });
            
            console.log(`Scraped: ${title} | Period: ${promoPeriod} | Cards: ${participatingCards.length}`);
            
          } catch (linkErr) {
            console.error(`Failed to process link ${promo.link}:`, linkErr.message);
          }
        }
      } catch(batchErr) {
        console.error('Batch error:', batchErr.message);
      } finally {
        if (page) await page.close();
        if (browser) await browser.close();
      }
    }
    
    await savePromosToDB(allPromoDetails);
    console.log(`Successfully scraped ${allPromoDetails.length} promos`);
    return allPromoDetails;
    
  } catch (error) {
    console.error('Error during scraping:', error);
    return [];
  }
}

module.exports = { scrapeBpiPromos };