import { load } from 'cheerio';
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const SECTIONS = ['world','business','politics','stocks','crypto','tech','sports','entertainment']; 

async function fetchNewsFromClaude(section: string) {
  try {
    console.log(`[AXIS] Asking Claude to brainstorm news for ${section}...`);
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Brainstorm 5 realistic, high-quality, and recent-sounding news headlines for the ${section} section of a news portal. 
        Return JSON only: { "articles": [{ "title": "string", "source": { "name": "string" }, "publishedAt": "string" }] }`
      }]
    });
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const data = JSON.parse(text.trim());
    return data.articles || [];
  } catch (err) {
    console.error('Claude news brainstorming failed:', err);
    return [];
  }
}

async function fetchGoogleNewsRSS(category: string) {
  try {
    const url = `https://news.google.com/rss/search?q=${category}&hl=en-US&gl=US&ceid=US:en`;
    const res = await fetch(url);
    const data = await res.text();
    console.log(`[AXIS] RSS data received (${data.length} bytes) for ${category}`);
    const $ = load(data, { xmlMode: true });
    const articles: any[] = [];
    
    $('item').each((i, el) => {
      if (i >= 8) return;
      articles.push({
        title: $(el).find('title').text(),
        url: $(el).find('link').text(),
        source: { name: $(el).find('source').text() },
        publishedAt: $(el).find('pubDate').text(),
      });
    });
    console.log(`[AXIS] RSS parsed ${articles.length} articles for ${category}`);
    return articles;
  } catch (err) {
    console.error('Google News RSS fallback failed:', err);
    return [];
  }
}

async function fetchAlphaVantageNews(topics: string) {
  try {
    // Get date string for today (YYYYMMDDTHHMM)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const timeFrom = yesterday.toISOString().replace(/[-:]/g, '').split('.')[0].slice(0, 13);
    
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=${topics}&time_from=${timeFrom}&limit=10&apikey=${process.env.ALPHA_VANTAGE_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.feed) {
      return data.feed.map((item: any) => ({
        title: item.title,
        url: item.url,
        source: { name: item.source },
        publishedAt: item.time_published,
        summary: item.summary,
        tag: item.overall_sentiment_label
      }));
    }
    return [];
  } catch (err) {
    console.error('Alpha Vantage news failed:', err);
    return [];
  }
}

async function tailorNews(section: string, articles: any[]) {
  try {
    const now = new Date().toLocaleString();
    console.log(`[AXIS] Tailoring top stories for ${section} (Current Time: ${now})...`);
    const msg = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are a world-class news editor for AXIS News. Today is ${now}.
        I will provide a list of raw news articles for the "${section}" section.
        
        Your task:
        1. Select the most significant and RECENT "Top Story".
        2. Select 4 high-quality and RECENT "Supporting Stories".
        3. Prioritize stories published in the last 24 hours. If stories look old, prioritize the most recent ones.
        4. For the Top Story, provide a "headline" and a "lead" (2-3 sentences).
        5. For all stories, provide a relative "time" (e.g. "2h ago", "5m ago", "Today").
        
        Articles: ${JSON.stringify(articles.slice(0, 15))}
        
        Return JSON only:
        {
          "headline": "compelling top story headline",
          "lead": "engaging lead paragraph",
          "stories": [
            { "title": "string", "src": "string", "time": "e.g. 2h ago", "tag": "BREAKING|ALERT|LIVE|LATEST|ANALYSIS|TECH|FINANCE", "views": "e.g. 1.2M", "hasClip": boolean }
          ]
        }`
      }]
    });
    
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const result = JSON.parse(text.replace(/```json|```/g, '').trim());
    return result;
  } catch (err) {
    console.error('Tailoring failed, using raw articles:', err);
    // Fallback to raw articles if tailoring fails
    return {
      headline: articles[0]?.title || "Breaking News",
      lead: articles[0]?.summary || "Fetching the latest updates for you.",
      stories: articles.slice(0, 5).map(a => ({
        title: a.title,
        src: a.source.name,
        time: "LATEST",
        tag: a.tag || "LATEST",
        views: "1.1M",
        hasClip: false
      }))
    };
  }
}

export async function fetchSection(section: string) {
  const categoryMap: Record<string, string> = {
    world: 'general', business: 'business', politics: 'general',
    tech: 'technology', sports: 'sports', entertainment: 'entertainment',
    stocks: 'business', crypto: 'technology'
  };

  const avTopicMap: Record<string, string> = {
    business: 'economy_macro,finance,retail_wholesale',
    stocks: 'financial_markets,earnings,ipo,mergers_and_acquisitions',
    crypto: 'blockchain',
    tech: 'technology,manufacturing'
  };

  console.log(`[AXIS] Fetching real news for ${section}...`);
  
  try {
    let combinedArticles: any[] = [];

    // 1. Fetch from NewsAPI
    // For politics, we add a query to narrow down the 'general' category
    const q = section === 'politics' ? '&q=politics' : '';
    const newsApiUrl = `https://newsapi.org/v2/top-headlines?category=${categoryMap[section]}${q}&pageSize=12&language=en&apiKey=${process.env.NEWS_API_KEY}`;
    const newsApiRes = await fetch(newsApiUrl);
    const newsApiData = await newsApiRes.json();
    if (newsApiData.status === 'ok' && newsApiData.articles) {
      combinedArticles.push(...newsApiData.articles);
    }

    // 2. Fetch from Alpha Vantage if applicable (primarily for financial/tech categories)
    if (avTopicMap[section]) {
      const avArticles = await fetchAlphaVantageNews(avTopicMap[section]);
      combinedArticles.push(...avArticles);
    }

    if (combinedArticles.length === 0) {
      throw new Error('No articles found from primary sources');
    }

    // 3. Tailor the news
    const tailored = await tailorNews(section, combinedArticles);
    
    // 4. Augment with prices if applicable
    const augmented = await augmentWithPrices(section, tailored.stories);
    return { ...tailored, prices: augmented.prices, generatedAt: new Date().toISOString() };

  } catch (error) {
    console.warn(`[AXIS] Primary news fetch failed for ${section}, trying fallbacks...`);
    try {
      // 2. Try Google News RSS
      const rssArticles = await fetchGoogleNewsRSS(section);
      if (rssArticles.length > 0) {
        const tailored = await tailorNews(section, rssArticles);
        const augmented = await augmentWithPrices(section, tailored.stories);
        return { ...tailored, prices: augmented.prices, generatedAt: new Date().toISOString() };
      }
    } catch (e) {
      console.warn(`[AXIS] RSS failed for ${section}, trying Claude Brainstorm...`);
    }

    try {
      // 3. Try Claude Brainstorming
      const claudeArticles = await fetchNewsFromClaude(section);
      if (claudeArticles.length > 0) {
        const tailored = await tailorNews(section, claudeArticles);
        const augmented = await augmentWithPrices(section, tailored.stories);
        return { ...tailored, prices: augmented.prices, generatedAt: new Date().toISOString() };
      }
    } catch (e) {
      console.warn(`[AXIS] Claude brainstorming failed for ${section}, using final mock fallback.`);
    }

    // 4. Final Mock Fallback
    const mock = getMockArticles(section);
    const tailored = await tailorNews(section, mock);
    const augmented = await augmentWithPrices(section, tailored.stories);
    return { ...tailored, prices: augmented.prices, generatedAt: new Date().toISOString() };
  }
}

async function augmentWithPrices(section: string, stories: any[]) {
  if (section === 'crypto') {
    const prices = await fetchCryptoPrices();
    return { stories, prices };
  }
  if (section === 'stocks') {
    const prices = await fetchStockPrices();
    return { stories, prices };
  }
  return { stories };
}

async function fetchCryptoPrices() {
  try {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true';
    const res = await fetch(url);
    return await res.json();
  } catch (error) {
    return { bitcoin: { usd: 102450, usd_24h_change: 5.4 }, ethereum: { usd: 3850, usd_24h_change: 2.1 } };
  }
}

async function fetchStockPrices() {
  try {
    const symbols = ['AAPL', 'MSFT', 'NVDA', 'TSLA'];
    const prices: Record<string, any> = {};
    for (const symbol of symbols) {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      prices[symbol] = data['Global Quote'];
    }
    return prices;
  } catch (error) {
    return { AAPL: { "05. price": "235.40", "09. change": "2.10" }, NVDA: { "05. price": "145.20", "09. change": "4.50" } };
  }
}

function getMockArticles(section: string) {
  const mock: Record<string, any[]> = {
    world: [{ title: "Global Summit Reaches Historic Climate Agreement", source: { name: "Axis Global" } }],
    business: [{ title: "Major Tech Merger Shakes Up Silicon Valley", source: { name: "Market Watch" } }],
    politics: [{ title: "Bipartisan Infrastructure Bill Passes Senate Vote", source: { name: "Capitol Report" } }],
    stocks: [{ title: "NVIDIA Hits New All-Time High on AI Demand", source: { name: "Wall Street" } }],
    crypto: [{ title: "Bitcoin Surges Above $100k for the First Time", source: { name: "Coin News" } }],
    tech: [{ title: "Quantum Computing Prototype Solves Complex Equation", source: { name: "Tech Pulse" } }],
    sports: [{ title: "Underdog Team Secures Championship in Final Minute", source: { name: "Sports Central" } }],
    entertainment: [{ title: "Indie Film Sweeps Major Award Ceremony Categories", source: { name: "Studio News" } }]
  };
  return mock[section] || mock.world;
}
