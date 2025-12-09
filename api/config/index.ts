import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get hotel configuration
      const result = await sql`
        SELECT * FROM hotel_config WHERE id = 1
      `;
      
      if (result.rows.length === 0) {
        // Return default config if not exists
        return res.status(200).json({
          minStay: 2,
          contactEmail: 'reserva@hotelsolar.tur.br',
          aiKnowledgeBase: ''
        });
      }

      const row = result.rows[0];
      const config = {
        minStay: row.min_stay,
        contactEmail: row.contact_email,
        aiKnowledgeBase: row.ai_knowledge_base || ''
      };

      return res.status(200).json(config);
    }

    if (req.method === 'PUT') {
      // Update hotel configuration
      const { minStay, contactEmail, aiKnowledgeBase } = req.body;

      // Check if config exists
      const existing = await sql`
        SELECT id FROM hotel_config WHERE id = 1
      `;

      if (existing.rows.length === 0) {
        // Insert new config
        await sql`
          INSERT INTO hotel_config (id, min_stay, contact_email, ai_knowledge_base)
          VALUES (1, ${minStay}, ${contactEmail}, ${aiKnowledgeBase || ''})
        `;
      } else {
        // Update existing config
        await sql`
          UPDATE hotel_config 
          SET min_stay = ${minStay},
              contact_email = ${contactEmail},
              ai_knowledge_base = ${aiKnowledgeBase || ''},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = 1
        `;
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in config API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
