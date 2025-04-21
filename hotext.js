const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

let fetch;

async function loadFetch() {
    const module = await import('node-fetch');
    fetch = module.default;
}

function extractApiKeys(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const keyMatches = content.match(/Key\s*:\s*([a-zA-Z0-9]+)/g);
        if (!keyMatches) return [];
        return keyMatches.map(match => match.split(':')[1].trim());
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
}

async function generateAuthToken(refreshToken, clientId) {
    const url = "https://login.live.com/oauth20_token.srf";
    const payload = new URLSearchParams({
        client_id: clientId,
        grant_type: "refresh_token",
        refresh_token: refreshToken
    });

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: payload
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.access_token || "";
    } catch (error) {
        console.error(`    Error generating auth token: ${error.message}`);
        return "";
    }
}

async function getCredentialsFromHistory(key) {
    const historyUrl = `https://sv7.api999.com/hotmail/history.php?key_value=${key}`;

    for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`  Checking history page...`);

        try {
            const response = await axios.get(historyUrl, { timeout: 10000 });
            const $ = cheerio.load(response.data);

            const creds = [];

            $('table tr').slice(1).each((i, row) => {
                const cells = $(row).find('td');
                if (cells.length === 5) {
                    const email = $(cells[1]).text().trim();
                    const password = $(cells[2]).text().trim();
                    const refreshToken = $(cells[3]).text().trim();
                    const clientId = $(cells[4]).text().trim();

                    creds.push({ email, password, refreshToken, clientId });

                    console.log(`    Found new credential: ${email}:${password}:${refreshToken}:::${clientId}`);
                }
            });

            if (creds.length > 0) return creds;

            if (attempt < 3) {
                console.log(`    No credentials found. Retry ${attempt}/3...`);
                await new Promise(r => setTimeout(r, 5000));
            }
        } catch (err) {
            console.error(`    Error checking history: ${err.message}`);
        }
    }

    return [];
}


async function processApiKeys(apiKeys) {
    const outputFile = "hotmails.txt";
    const existingEntries = new Set();

    if (fs.existsSync(outputFile)) {
        const lines = fs.readFileSync(outputFile, 'utf8').split('\n');
        for (const line of lines) {
            if (line.trim()) existingEntries.add(line.trim());
        }
    }

    for (const key of apiKeys) {
        console.log(`\nProcessing key: ${key}`);

        try {
            console.log(`  Accessing API URL...`);
            await axios.get(`http://sv7.api999.com/hotmail/api.php?key_value=${key}`, { timeout: 10000 });

            await new Promise(r => setTimeout(r, 5000)); // Wait 5 seconds before checking history

            const credentials = await getCredentialsFromHistory(key);

            if (credentials.length === 0) {
                console.log(`    No credentials found after 3 attempts. Skipping key.`);
                continue;
            }

            for (const { email, password, refreshToken, clientId } of credentials) {
                console.log(`Processing: ${email}`);
                const accessToken = await generateAuthToken(refreshToken, clientId);

                const final = `${email}:${password}:${refreshToken}:${accessToken}:${clientId}`;

                if (!existingEntries.has(final)) {
                    fs.appendFileSync(outputFile, final + '\n');
                    existingEntries.add(final);
                    if (accessToken) {
                        console.log(`  Successfully generated auth token for ${email}`);
                    } else {
                        console.log(`  Failed to generate auth token for ${email}`);
                    }
                }
                await new Promise(r => setTimeout(r, 1000)); // Short delay between tokens
            }

        } catch (err) {
            console.error(`  Error processing key ${key}: ${err.message}`);
        }
    }

    console.log(`\n✅ Done. Results saved to hotmails.txt`);
}

(async () => {
    await loadFetch();
    const keys = extractApiKeys("user.txt");

    if (!keys.length) {
        console.log("No API keys found in the input file.");
    } else {
        console.log(`Found ${keys.length} API keys. Starting processing...`);
        await processApiKeys(keys);
    }
})();
