import puppeteer from 'puppeteer'; // Use import for ES modules
import fs from 'fs';

// Read usernames from JSON file
const usernames = JSON.parse(fs.readFileSync('usernames.json')).usernames;

// Replace these with your Instagram login credentials
const INSTAGRAM_USERNAME = 'prupeshanil';
const INSTAGRAM_PASSWORD = 'R@P@123';

// Function to scrape an Instagram profile
async function scrapeInstagramProfile(username, page) {
  try {
    const profileUrl = `https://www.instagram.com/${username}/`;
    console.log(`Navigating to profile: ${profileUrl}`);
    await page.goto(profileUrl, { waitUntil: 'networkidle2' });

    // Wait for the profile page to load
    await page.waitForSelector('header', { timeout: 15000 });

    // Scrape profile data
    const profilePicUrl = await page.$eval('header img', (img) => img.src).catch(() => "N/A");
    const stats = await page.$$eval('header section ul li', (elements) =>
      elements.map((el) => el.innerText.split(' ')[0].replace(',', '').trim())
    );
    const [posts = "0", followers = "0", following = "0"] = stats;

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
  // Launch Puppeteer
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate to Instagram login page
  console.log("Logging in to Instagram...");
  await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2' });

  // Perform login
  await page.type('input[name="username"]', INSTAGRAM_USERNAME, { delay: 100 });
  await page.type('input[name="password"]', INSTAGRAM_PASSWORD, { delay: 100 });
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  console.log("Login successful!");

  const scrapedData = [];

  // Iterate over usernames and scrape their profiles
  for (const username of usernames) {
    console.log(`Scraping profile: ${username}`);
    const data = await scrapeInstagramProfile(username, page);
    if (data) {
      scrapedData.push(data);
    }

    // Save data incrementally
    fs.writeFileSync('scraped_profiles.json', JSON.stringify(scrapedData, null, 2));
  }

  console.log("Scraping completed. Data saved to scraped_profiles.json.");

  // Close browser
  await browser.close();
})();
