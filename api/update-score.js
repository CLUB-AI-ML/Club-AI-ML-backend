const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase (Ensure env vars are set in Vercel Dashboard!)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    // 1. CORS (Allow requests)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

    // Handle Preflight (Browser checks)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 2. Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 3. Security Check (Stop Hackers)
    const secret = req.headers['x-api-secret'];
    if (secret !== process.env.API_SECRET) {
        return res.status(403).json({ error: 'Unauthorized: Wrong Secret' });
    }

    const { username, points } = req.body;

    if (!username || !points) {
        return res.status(400).json({ error: 'Missing username or points' });
    }

    try {
        // --- LOGIC: Check User & Update ---
        const { data: user, error: fetchError } = await supabase
            .from('leaderboard')
            .select('*')
            .eq('username', username)
            .single();

        if (user) {
            // Update existing
            const newScore = (user.points || 0) + points;
            await supabase
                .from('leaderboard')
                .update({ points: newScore })
                .eq('username', username);
            
            return res.status(200).json({ message: `Updated ${username} to ${newScore}` });
        } else {
            // Create new
            await supabase
                .from('leaderboard')
                .insert([{ username, points, role: 'Member' }]);
            
            return res.status(200).json({ message: `Created ${username} with ${points}` });
        }

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
