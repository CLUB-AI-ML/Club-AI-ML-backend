const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
    // Enable CORS so your website can talk to this backend
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // Fetch top 50 users sorted by points
    const { data, error } = await supabase
        .from('leaderboard')
        .select('username, points, role')
        .order('points', { ascending: false })
        .limit(50);

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json(data);
}
