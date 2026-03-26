const db = require('../config/database');
const axios = require('axios');

// AI Service URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const roommateController = {
    // Get current user's profile
    getMyProfile: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const [rows] = await db.execute('SELECT * FROM roommate_profiles WHERE user_id = ?', [userId]);
            if (rows.length === 0) {
                return res.json({ profile: null });
            }
            res.json({ profile: rows[0] });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    },

    // Update or Create Profile
    updateProfile: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const { budget_min, budget_max, lifestyle_vector, locations } = req.body;
            // locations is stored in lifestyle_vector or separate? 
            // The DB schema has lifestyle_vector as JSON. We can store locations there too or strict schema?
            // Schema has `lifestyle_vector JSON`. 
            // We will store { vector: [...], locations: [...] } inside this JSON column for flexibility 
            // OR we should have used a separate column. 
            // Let's pack everything into `lifestyle_vector` column for now as per schema or just update schema?
            // Schema: `lifestyle_vector JSON`.
            // Let's store: { "traits": [0,1,...], "locations": [{"lat":...}] } in the JSON column.

            // Check if exists
            const [rows] = await db.execute('SELECT profile_id FROM roommate_profiles WHERE user_id = ?', [userId]);

            if (rows.length > 0) {
                await db.execute(
                    'UPDATE roommate_profiles SET budget_min = ?, budget_max = ?, lifestyle_vector = ? WHERE user_id = ?',
                    [budget_min, budget_max, JSON.stringify(lifestyle_vector), userId]
                );
            } else {
                await db.execute(
                    'INSERT INTO roommate_profiles (user_id, budget_min, budget_max, lifestyle_vector) VALUES (?, ?, ?, ?)',
                    [userId, budget_min, budget_max, JSON.stringify(lifestyle_vector)]
                );
            }

            res.json({ message: 'Profile updated' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    },

    // Find Matches
    findMatches: async (req, res) => {
        try {
            const userId = req.user.user_id;

            // 1. Get my profile
            const [myRows] = await db.execute('SELECT * FROM roommate_profiles WHERE user_id = ?', [userId]);
            if (myRows.length === 0) {
                return res.status(400).json({ message: 'Please create a profile first' });
            }
            const myProfile = myRows[0];
            const myData = typeof myProfile.lifestyle_vector === 'string' ? JSON.parse(myProfile.lifestyle_vector) : myProfile.lifestyle_vector;

            // 2. Get other active profiles
            // Filter by budget overlap ideally, but for now get all active except self
            const [others] = await db.execute(
                `SELECT p.*, u.full_name, u.avatar_url, u.date_of_birth 
                 FROM roommate_profiles p 
                 JOIN users u ON p.user_id = u.user_id 
                 WHERE p.user_id != ? AND p.status = 'active'`,
                [userId]
            );

            // 3. Call AI Service for each candidate
            const matches = [];

            for (const candidate of others) {
                const candidateData = typeof candidate.lifestyle_vector === 'string' ? JSON.parse(candidate.lifestyle_vector) : candidate.lifestyle_vector;

                // Construct payload
                const payload = {
                    user1_id: userId,
                    user2_id: candidate.user_id,
                    user1_vector: myData.traits || [], // [smoking, pets, ...]
                    user2_vector: candidateData.traits || [],
                    user1_locations: myData.locations || [],
                    user2_locations: candidateData.locations || [],
                    weights: { lifestyle: 0.6, location: 0.4 } // Configurable
                };

                try {
                    const aiRes = await axios.post(`${AI_SERVICE_URL}/matchmaking`, payload);

                    // Only add if score is reasonable (e.g., > 0.4)
                    if (aiRes.data.total_score > 0.4) {
                        matches.push({
                            ...candidate,
                            match_score: aiRes.data.total_score,
                            match_details: aiRes.data.details,
                            match_reasoning: aiRes.data.reasoning
                        });
                    }
                } catch (err) {
                    console.error("AI Match Error for user " + candidate.user_id, err.message);
                }
            }

            // 4. Sort by score
            matches.sort((a, b) => b.match_score - a.match_score);

            res.json(matches);

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }
};

module.exports = roommateController;
