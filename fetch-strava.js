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

    console.log('Attempting to refresh Strava token...');
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
        const errorText = await resp.text();
        console.log('Refresh response status:', resp.status);
        console.log('Refresh response body:', errorText);
        throw new Error(`Token refresh failed: ${resp.status} - ${errorText}`);
    }

    const data = await resp.json();
    console.log('Token refresh response:', JSON.stringify(data, null, 2));
    if (!data.access_token) {
        throw new Error('No access_token in refresh response');
    }
    console.log('Token refresh successful, got new access token');
    return data.access_token;
}

async function fetchStravaLatest() {
    // Always try to get a fresh token first
    let token;
    try {
        token = await refreshStravaToken();
        console.log('Using refreshed token');
    } catch (refreshError) {
        console.log('Refresh failed, trying stored access token:', refreshError.message);
        token = process.env.STRAVA_ACCESS_TOKEN;
        if (!token) {
            throw new Error('No valid token available');
        }
    }

    // Fetch latest activity list
    console.log('Fetching activities with token...');
    const listResp = await fetch('https://www.strava.com/api/v3/athlete/activities?page=1&per_page=1', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!listResp.ok) {
        const errorText = await listResp.text();
        console.log('Activities API response status:', listResp.status);
        console.log('Activities API response body:', errorText);
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