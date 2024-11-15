import puppeteer from 'puppeteer'; // Use import for ES modules
import fs from 'fs';

const usernames = JSON.parse(fs.readFileSync('usernames.json')).usernames;
const INSTAGRAM_USERNAME = 'prupeshanil';
const INSTAGRAM_PASSWORD = 'R@P@123';

async function scrapeInstagramProfile(username, page) {
  try {
    const profileUrl = `https://www.instagram.com/${username}/`;
    await page.goto(profileUrl, { waitUntil: 'networkidle2' });

    // Wait for the profile page to load
    await page.waitForSelector('header', { timeout: 15000 });

    // Scrape the profile data
    const profilePicUrl = await page.$eval('header img', (img) => img.src);
    const stats = await page.$$eval(
      'header section ul li span',
      (elements) => elements.map((el) => el.getAttribute('title') || el.innerText)
    );
    const [posts, followers, following] = stats;
    const name = await page.$eval('header section h1', (el) => el.innerText).catch(() => "N/A");
    const bio = await page.$eval('header section div.-vDIg span', (el) => el.innerText).catch(() => "No bio available");

    const profileData = {
      username,
      profilePicUrl,
      name,
      bio,
      posts,
      followers,
      following,
    };

    console.log(`Scraped data for ${username}:`, profileData);

    return profileData;
  } catch (error) {
    console.error(`Error scraping profile for ${username}:`, error);
    return null;
  }
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2' });

    // Log in to Instagram
    await page.type('input[name="username"]', INSTAGRAM_USERNAME, { delay: 100 });
    await page.type('input[name="password"]', INSTAGRAM_PASSWORD, { delay: 100 });
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    const scrapedData = [];
    for (const username of usernames) {
      const data = await scrapeInstagramProfile(username, page);
      if (data) {
        scrapedData.push(data);

        // Incremental save
        fs.writeFileSync('scraped_profiles.json', JSON.stringify(scrapedData, null, 2));
      }
    }

    console.log('Scraping completed. Data saved to scraped_profiles.json.');
  } catch (error) {
    console.error('An error occurred during the scraping process:', error);
  } finally {
    await browser.close();
  }
})();
