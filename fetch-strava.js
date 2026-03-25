const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function refreshStravaToken() {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    const refreshToken = process.env.STRAVA_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, and STRAVA_REFRESH_TOKEN must be set');
    }

    const resp = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
        })
    });

    if (!resp.ok) {
        throw new Error(`Token refresh failed: ${resp.status}`);
    }

    const data = await resp.json();
    return data.access_token;
}

async function fetchStravaLatest() {
    let token = process.env.STRAVA_ACCESS_TOKEN;

    // If no access token provided, try to refresh using refresh token
    if (!token) {
        token = await refreshStravaToken();
    }

    // Fetch latest activity list
    const listResp = await fetch('https://www.strava.com/api/v3/athlete/activities?page=1&per_page=1', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (listResp.status === 401) {
        // Token might be expired, try refreshing
        console.log('Access token expired, refreshing...');
        token = await refreshStravaToken();
        const retryResp = await fetch('https://www.strava.com/api/v3/athlete/activities?page=1&per_page=1', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!retryResp.ok) throw new Error(`Strava list fetch failed after refresh: ${retryResp.status}`);
        listResp = retryResp;
    } else if (!listResp.ok) {
        throw new Error(`Strava list fetch failed: ${listResp.status}`);
    }

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