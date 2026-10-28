import fs from 'fs';

async function getLiveWeather() {
    try {
        // Dallas-Fort Worth coordinates via Open-Meteo (No key required)
        const url = 'https://api.open-meteo.com/v1/forecast?latitude=32.7767&longitude=-96.7970&daily=temperature_2m_max,temperature_2m_min,weathercode&current_weather=true&temperature_unit=fahrenheit&timezone=America%2FChicago';
        const res = await fetch(url);
        const data = await res.json();
        return {
            temp: Math.round(data.current_weather.temperature),
            wind: data.current_weather.windspeed,
            daily: data.daily
        };
    } catch (e) {
        return { temp: 72, wind: 5 };
    }
}

async function getRssHeadlines(feedUrl, limit = 3) {
    try {
        // Use free public RSS-to-JSON endpoint or feed parser
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`);
        const data = await res.json();
        return data.items.slice(0, limit).map(item => ({
            title: item.title,
            snippet: item.description.replace(/<[^>]*>?/gm, '').slice(0, 180) + '...',
            author: item.author || 'Staff Wire'
        }));
    } catch (e) {
        return [];
    }
}

async function getSportsScores() {
    try {
        // ESPN free public scoreboard for NBA
        const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard');
        const data = await res.json();
        const mavsGame = data.events?.find(e => e.name.includes('Mavericks'));
        if (mavsGame) {
            return {
                title: mavsGame.name,
                status: mavsGame.status.type.detail
            };
        }
        return { title: "Dallas Mavericks Season Update", status: "Off-day" };
    } catch (e) {
        return { title: "Scores Pending", status: "N/A" };
    }
}

async function buildEdition() {
    console.log("Fetching today's broadsheet feeds...");

    const [weather, worldNews, dallasNews, sports] = await Promise.all([
        getLiveWeather(),
        getRssHeadlines('https://feeds.bbci.co.uk/news/world/rss.xml', 3), // Wire News
        getRssHeadlines('https://www.dallasobserver.com/news.rss', 3),     // Metro News
        getSportsScores()
    ]);

    const edition = {
        date: new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            timeZone: 'America/Chicago'
        }),
        weather,
        worldNews,
        dallasNews,
        sports
    };

    fs.writeFileSync('news-data.json', JSON.stringify(edition, null, 2));
    console.log("news-data.json updated successfully.");
}

buildEdition();