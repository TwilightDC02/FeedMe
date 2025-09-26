require('dotenv').config({ path: '../../.env' });
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const Promo = require('../models/Promo.js');


const { getPromoPeriod } = require('./bpi-parser.js');

async function fetchAllPromoLinks() {
  let browser;
  try {
    // STAGE 1: Browser initialization and page navigation
    const baseUrl = 'https://www.bpi.com.ph';
    const listUrl = `${baseUrl}/personal/rewards-and-promotions/promos?tab=All&chip=Restaurants`;
    
    browser = await puppeteer.launch({
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    await page.goto(listUrl, { waitUntil: 'networkidle2' });
    console.log('Now waiting for filter');
    
    await page.waitForSelector('#All-tabpanel #Restaurants-chippanel.article-chip.active'); // Ensures the filter is selected
    console.log('Filter active');
    await page.waitForSelector('.social-share--component-link.ga'); // Ensures at least one promo card is loaded
    console.log('Page loaded, starting to scrape...');
    
    // STAGE 2: Loading all of the promo cards by clicking "Load More" button    
    const loadMoreButtonSelector = '#All-tabpanel .btn.tabs-showmore-btn';
    let loadMoreButtonVisible = true;
    while (loadMoreButtonVisible) {
      try {
        await page.waitForSelector(loadMoreButtonSelector, { visible: true, timeout: 5000 });
        console.log('Clicking "Load More"');
        await page.click(loadMoreButtonSelector);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for new content to load
      }
      catch (error) {
        // If the button is not found, we assume there are no more promos to load
        loadMoreButtonVisible = false;
        console.error('No more "Load More" buttons found.');
      }
    }    

    // STAGE 3: Extracting promo links and details
    let promoLinks = await page.evaluate((baseUrl) => {
      const links = [];
      const promoCards = document.querySelectorAll('#All-tabpanel .social-share--component-link.ga'); // Select all promo cards
      
      promoCards.forEach(card => {
        const relativeLink = card.getAttribute('href');
        if (relativeLink) {
          links.push(`${baseUrl}${relativeLink}`); // Construct full URL
        }
      });
      return links;
    }, baseUrl);

    console.log(`Found ${promoLinks.length} promo links.`);
    return promoLinks
  } catch (err){
    console.error(err);
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
  console.log('Imported Promo:', Promo);
console.log('Type:', typeof Promo);
console.log('Keys:', Object.keys(Promo || {}));
console.log('Registered models:', mongoose.modelNames());


    // ✅ Validation check
  if (!Promo || typeof Promo.findOneAndUpdate !== 'function') {
    console.error('❌ Promo model is invalid:', Promo);
    throw new Error('Promo model is not a valid Mongoose model');
  } else {
    console.log('✅ Promo model loaded correctly.');
  }

  let newPromos = 0;
  let updatedPromos = 0;

  for (const promoData of promoDataArray) {
    const result = await Promo.findOneAndUpdate(
      { link: promoData.link }, // Find by the unique link
      promoData, // The new/updated data
      { new: true, upsert: true } // Options
    );

    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      newPromos++;
    } else {
      updatedPromos++;
    }
  }

  console.log(`Database update complete. Added: ${newPromos}. Updated: ${updatedPromos}.`);
  await mongoose.connection.close();
}

async function scrapeBpiPromos(){
  console.log('test');
  console.log('📦 Promo import right after require:', Promo);
    const allPromoDetails = [];
    try {
      // STAGE 1: Get the full list of links
      const promoLinks = await fetchAllPromoLinks();

      // STAGE 2: Process links in batches
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
            for (const link of batch) {
              try {
                await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000});
                await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
                const html = await page.content();
                const $ = cheerio.load(html);

                const title = $('h1.content__heading').text().trim();
                const body = $('.text.aem-GridColumn--default--12 > div[data-cmp-data-layer]');

                const bodyText = body.text();
                const promoPeriod = getPromoPeriod(bodyText).promoPeriod;
                
                const offerMarker = body.find('h3').filter((i, el) => { // Handles inconsistent casing and formatting of the header "Promo Offer/Offer"
                  return $(el).text().toLowerCase().includes('offer');
                });
                const cardMarker = body.find('h3').filter((i, el) => {  // Handles inconsistent casing and formatting of the header "Promo Mechanics/Mechanics"
                  return $(el).text().toLowerCase().includes('mechanics');
                });

                const offerHeader = offerMarker.next('p').text().trim();
                const offerDetails = [];

                // Find the first UL after the offer header
                const potentialOfferUl = offerMarker.nextAll('ul').first();

                // Check if a potential UL was found AND if it appears before the mechanics section
                // The .is() method checks if an element matches a selector.
                // .prevAll() finds all preceding siblings.
                if (potentialOfferUl.length && cardMarker.prevAll().is(potentialOfferUl)) {
                  potentialOfferUl.find('li').each((i, elem) => {
                    const listItemClone = $(elem).clone();
                    listItemClone.children('ul').remove();
                    const cleanedListItem = listItemClone.text().trim();
                    offerDetails.push(cleanedListItem);
                  });
                }
                
                const cardLists = cardMarker.nextAll('ul').slice(0,3);
                const cardPrefixes = ['bpi', 'robinsons', 'visa', 'mastercard', 'dos', 'petron'];
                const structuredCards = [];

                cardLists.each((i, ul) => {
                  $(ul).find('li').each((j, li) => {
                    const cardClone =  $(li).clone();
                    cardClone.children('ul').remove();
                    const cardNameClean = cardClone.text().trim();
                    if (cardNameClean) {
                      if (cardNameClean.toLowerCase().includes('cards')) {
                        return;
                      }
                      if (cardNameClean.toLowerCase().includes('card') && cardPrefixes.some(prefix => cardNameClean.toLowerCase.includes(prefix))) {
                        const finalCard = cardNameClean.trim().replace(/[*]$/, '') // Removes asterisk
                        structuredCards.push(finalCard);
                      }
                    }
                  });
                });
                allPromoDetails.push({
                title,
                link,
                promoPeriod,
                offer: {
                  header: offerHeader,
                  details: offerDetails
                },
                participatingCards: structuredCards
                });
                console.log('Scraped --> ', title);
              } catch (linkErr) {
                console.error(`Failed to process link ${link}:`, linkErr.message);
              }
            }
          } catch(batchErr) {
            console.error(batchErr.message);
          } finally {
            if (page) await page.close()
            if (browser) await browser.close()
          }
        }
      await savePromosToDB(allPromoDetails);
      console.log(allPromoDetails);
      return allPromoDetails;
    } catch (error) {
      console.error('Error during scraping:', error);
    }
}
module.exports = { scrapeBpiPromos };