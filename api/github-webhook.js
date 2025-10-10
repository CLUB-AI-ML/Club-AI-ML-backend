const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

module.exports = async (req, res) => {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).send({ message: 'Only POST requests allowed' });
    }

    const eventType = req.headers['x-github-event'];
    const payload = req.body;

    try {
        let points = 0;
        let username = null;

        // --- Logic for Project Submission (PR Merged) ---
        if (eventType === 'pull_request' && payload.action === 'closed' && payload.pull_request.merged) {
            points = 50; // Points for a merged PR
            username = payload.pull_request.user.login;
        }

        // --- Logic for Closing an Issue ---
        if (eventType === 'issues' && payload.action === 'closed') {
            username = payload.issue.user.login; // The user who opened the issue
            const closer = payload.sender.login; // The user who closed it

            // Award points only if someone else fixed the issue
            if (username !== closer) {
                points = 10; // Points for opening a valid issue that gets fixed
            }
        }

        // If points were awarded, update the database
        if (username && points > 0) {
            // Upsert operation: Update user's points or create them if they don't exist.
            const { data, error } = await supabase.rpc('upsert_member_points', {
                p_github_username: username,
                p_points_to_add: points
            });

            if (error) throw error;
        }

        res.status(200).send({ message: 'Webhook received successfully.' });

    } catch (error) {
        console.error('Error processing webhook:', error.message);
        res.status(500).send({ message: 'Internal Server Error' });
    }
};