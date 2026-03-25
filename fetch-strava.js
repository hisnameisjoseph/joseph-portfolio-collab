const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function fetchStravaLatest() {
    const token = process.env.STRAVA_ACCESS_TOKEN;
    if (!token) {
        throw new Error('STRAVA_ACCESS_TOKEN not set');
    }

    // Fetch latest activity list
    const listResp = await fetch('https://www.strava.com/api/v3/athlete/activities?page=1&per_page=1', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!listResp.ok) throw new Error(`Strava list fetch failed: ${listResp.status}`);

    const listData = await listResp.json();
    if (!Array.isArray(listData) || listData.length === 0) {
        throw new Error('No Strava activities found');
    }

    const latestActivity = listData[0];
    const activityId = latestActivity.id;

    // Fetch detailed activity
    const activityResp = await fetch(`https://www.strava.com/api/v3/activities/${activityId}?include_all_efforts=`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!activityResp.ok) throw new Error(`Strava activity fetch failed: ${activityResp.status}`);

    const activityData = await activityResp.json();
    return activityData;
}

async function main() {
    try {
        const activity = await fetchStravaLatest();
        const scriptPath = path.join(__dirname, 'script.js');
        let scriptContent = fs.readFileSync(scriptPath, 'utf8');

        // Replace the placeholder with the actual data
        const placeholder = 'const latestActivityData = null; // STRAVA_PLACEHOLDER';
        const replacement = `const latestActivityData = ${JSON.stringify(activity)}; // Injected by GitHub Actions`;

        if (!scriptContent.includes(placeholder)) {
            throw new Error('Placeholder not found in script.js');
        }

        scriptContent = scriptContent.replace(placeholder, replacement);
        fs.writeFileSync(scriptPath, scriptContent);

        console.log('Strava data injected successfully');
    } catch (error) {
        console.error('Error fetching Strava data:', error.message);
        process.exit(1);
    }
}

main();