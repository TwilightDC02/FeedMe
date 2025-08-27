const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const { segregatePromoText } = require('./bpi-parser.js');
const { listCards } = require('./bpi-parser.js');

async function scrapeBpiPromos() {
  const baseUrl = 'https://www.bpi.com.ph';
  const listUrl = `${baseUrl}/personal/rewards-and-promotions/promos?tab=All&chip=Restaurants`;
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto(listUrl, { waitUntil: 'networkidle2' });
  await page.waitForSelector('.social-share--component-link.ga'); // Wait for promo cards to load
  console.log('Page loaded, starting to scrape...');
  
  
  // Loading all of the promo cards
  const loadMoreButtonSelector = '.btn.tabs-showmore-btn';
  
  console.log('About to start clicking load more button...');
  
  let loadMoreButtonVisible = true;
  while (loadMoreButtonVisible) {
    try {
      loadMoreButtonVisible = false;
      await page.waitForSelector(loadMoreButtonSelector, { visible: true, timeout: 5000 });
      await page.click(loadMoreButtonSelector);
      loadMoreButtonVisible = true;
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for new content to load
    }
    catch (error) {
      // If the button is not found, we assume there are no more promos to load
      loadMoreButtonVisible = false;
      console.log('No more promos to load or button not found.');
      
    }
  }
  console.log('Finished loading all promo cards.');
  
  // Collecting the links from the promo cards
  const promoLinks = await page.evaluate((baseUrl) => {
    let links = [];
    const promoCards = document.querySelectorAll('.social-share--component-link.ga'); // Select all promo cards except the first four
    
    promoCards.forEach(card => {
      const relativeLink = card.getAttribute('href');
      if (relativeLink) {
        links.push(`${baseUrl}${relativeLink}`); // Construct full URL
      }
    });
    links = links.slice(4); // Skip the first four promos
    return links;
  }, baseUrl);
  console.log('Collected promo links:', promoLinks);
  


  const allPromoDetails = [];
  // Getting the details of each promo
  const link = promoLinks[1];
  try{
      await page.goto(link, { waitUntil: 'networkidle2' });
      const html = await page.content();
      const $ = cheerio.load(html);

      const title = $('h1.content__heading').text().trim();
      const body = $('.text.aem-GridColumn--default--12 > div[data-cmp-data-layer]');
      const bodyText = body.text().trim();

      const mechanicsHeader = body.find('h3:contains("Promo Mechanics")');
      const cardText = mechanicsHeader.nextAll('ul').text().trim();

      const structuredDetails = segregatePromoText(bodyText);
      const structuredCards = listCards(cardText);


      allPromoDetails.push({
        title,
        link,
        structuredDetails,
        structuredCards
      });

    }
    catch (error) {
      console.error(`Error processing link ${link}:`, error);
      // continue; // Skip to the next link if there's an error
    }

      await browser.close();
      console.log('Scraped promo details:', JSON.stringify(allPromoDetails));

  }



  // console.log('Scraped promo details:', allPromoDetails);

  // for (const link of promoLinks) {
  //   try{
  //     await page.goto(link, { waitUntil: 'networkidle2' });
  //     const html = await page.content();
  //     const $ = cheerio.load(html);

  //     const title = $('h1.content-heading').text().trim();
  //     const body = $('.text.aem-GridColumn.aem-GridColumn--default--12:first-of-type');
  //     const ulPromo = body.find('ul').text().trim();
  //     const pPromo = body.find('p').text().trim();
  //     const promoDetails1 = ulPromo;
  //     const promoDetails2 = pPromo;

  //     allPromoDetails.push({
  //       title,
  //       link,
  //       promoDetails1,
  //       promoDetails2
  //     });
  //   }
  //   catch (error) {
  //     console.error(`Error processing link ${link}:`, error);
  //     continue; // Skip to the next link if there's an error
  //   }
  // }
  // console.log('Scraped promo details:', allPromoDetails);
  

  // await browser.close();
  // return allPromoDetails;
// }

scrapeBpiPromos()

module.exports = { scrapeBpiPromos };