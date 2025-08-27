const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const { getPromoPeriod } = require('./bpi-parser.js');

async function scrapeBpiPromos() {
  let browser;
  try {
    // STAGE 1: Browser initialization and page navigation
    const baseUrl = 'https://www.bpi.com.ph';
    const listUrl = `${baseUrl}/personal/rewards-and-promotions/promos?tab=All&chip=Restaurants`;
    
    browser = await puppeteer.launch({ headless: true });
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
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for new content to load
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

    // STAGE 4: Visiting each promo link and extracting detailed info
    const allPromoDetails = [];
    // FULL SCRAPING: Processing all links
    for (const link of promoLinks) {
      try {
        await page.goto(link, { waitUntil: 'networkidle2' });
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
              structuredCards.push(cardNameClean);
            }
          });
        });

        allPromoDetails.push({
          title,
          link,
          promoPeriod,
          offerHeader,
          offerDetails,
          structuredCards
        });
        console.log('Scraped --> ', title);
      } catch (linkError) {
        console.error('Failed to process link:', link, linkError);
      }
    }
    console.log(allPromoDetails);
    return allPromoDetails;

  } catch (error) {
    console.error('Error during scraping:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

}
scrapeBpiPromos()

module.exports = { scrapeBpiPromos };



    // TESTING: Only processing a single link
    // const link = promoLinks[1];
    // try{
    //     await page.goto(link, { waitUntil: 'networkidle2' });
    //     const html = await page.content();
    //     const $ = cheerio.load(html);

    //     const title = $('h1.content__heading').text().trim();
    //     const body = $('.text.aem-GridColumn--default--12 > div[data-cmp-data-layer]');

    //     const bodyText = body.text();
    //     const promoPeriod = getPromoPeriod(bodyText).promoPeriod;

    //     const offerMarker = body.find('h3:contains("Promo Offer")');
    //     const offerHeader = offerMarker.next('p').text().trim();
    //     const offerUl = offerMarker.nextAll('ul').first();
    //     const offerDetails = [];

    //     offerUl.find('li').each((i, elem) => {
    //       // Iterates through each <li> element within the <ul>. Clones it, and removes nested <ul> element.

    //       const listItemClone = $(elem).clone();
    //       listItemClone.children('ul').remove(); // Remove any nested <ul> elements
    //       const cleanedListItem = listItemClone.text().trim();
          
    //       offerDetails.push(cleanedListItem);
    //     });

    //     const cardMarker = body.find('h3:contains("Promo Mechanics")');
    //     const cardText = cardMarker.nextAll('ul').text().trim();

    //     const structuredCards = listCards(cardText);

    //     allPromoDetails.push({
    //       title,
    //       link,
    //       promoPeriod,
    //       offerHeader,
    //       offerDetails,
    //       structuredCards
    //     });

    //   }
    //   catch (error) {
    //     console.error(`Error processing link ${link}:`, error);
    //   }
