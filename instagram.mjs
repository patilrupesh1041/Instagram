import puppeteer from 'puppeteer'; // Use import for ES modules
import fs from 'fs';

// Read usernames from JSON file
const usernames = JSON.parse(fs.readFileSync('usernames.json')).usernames;

// Replace these with your Instagram login credentials
const INSTAGRAM_USERNAME = 'prupeshanil';
const INSTAGRAM_PASSWORD = 'R@P@123';

async function scrapeInstagramProfile(username, page) {
  try {
    // Go to the Instagram profile search URL
    await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle2' });
    
    // Wait for the search bar to appear and type the username
    await page.waitForSelector('input[placeholder="Search"]');
    await page.type('input[placeholder="Search"]', username, { delay: 100 });
    
    // Wait for search suggestions to appear
    await page.waitForSelector('div.-qQT3');  // Wait for the suggestions dropdown
    
    // Select the first profile suggestion by pressing "ArrowDown" and "Enter"
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Wait for the profile page to load
    await page.waitForSelector('header');

    // Scrape the profile data
    const profilePicUrl = await page.$eval('header img', (img) => img.src);
    const stats = await page.$$eval(
      'header section ul li span',
      (elements) => elements.map((el) => el.getAttribute('title') || el.innerText)
    );
    const [posts, followers, following] = stats;
    const name = await page.$eval('header section h1', (el) => el.innerText);
    const bio = await page.$eval('header section div.-vDIg span', (el) => el.innerText);

    return {
      username,
      profilePicUrl,
      name,
      bio,
      posts,
      followers,
      following,
    };
  } catch (error) {
    console.error(`Error scraping profile for ${username}:`, error);
    return null;
  }
}

(async () => {
  // Launch Puppeteer and create a new browser instance
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate to Instagram login page
  await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2' });
  
  // Log in to Instagram
  await page.type('input[name="username"]', INSTAGRAM_USERNAME, { delay: 100 });
  await page.type('input[name="password"]', INSTAGRAM_PASSWORD, { delay: 100 });
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  const scrapedData = [];

  // Iterate over each username and scrape data
  for (const username of usernames) {
    const data = await scrapeInstagramProfile(username, page);
    if (data) {
      scrapedData.push(data);
    }
  }

  // Write scraped data to a JSON file
  fs.writeFileSync('scraped_profiles.json', JSON.stringify(scrapedData, null, 2));
  console.log('Scraping completed. Data saved to scraped_profiles.json.');

  await browser.close();
})();
