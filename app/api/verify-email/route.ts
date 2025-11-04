import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { z } from 'zod';
import { createEmailFilterFormula } from '@/src/lib/airtable-utils';
import { validateOrigin } from '@/src/lib/csrf-protection';

// Schéma de validation
const emailSchema = z.object({
    email: z.string().email().max(255)
});

export async function POST(request: NextRequest) {
    try {
        // ✅ Protection CSRF - Valider l'origine
        const csrfError = validateOrigin(request);
        if (csrfError) {
            return csrfError;
        }

        // Vérifier les variables d'environnement
        if (!process.env.AIRTABLE_API_KEY) {
            console.error('AIRTABLE_API_KEY manquante');
            return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 });
        }

        if (!process.env.AIRTABLE_BASE_ID) {
            console.error('AIRTABLE_BASE_ID manquante');
            return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 });
        }

        const body = await request.json();
        
        // ✅ Valider avec Zod
        const validation = emailSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json({ 
                error: 'Email invalide' 
            }, { status: 400 });
        }

        const { email } = validation.data;

        // Configuration Airtable
        const base = new Airtable({
            apiKey: process.env.AIRTABLE_API_KEY,
        }).base(process.env.AIRTABLE_BASE_ID);

        // Utiliser le nom de la table depuis l'environnement ou 'Users' par défaut
        const tableName = process.env.AIRTABLE_TABLE_ID || 'Users';
        const table = base(tableName);

        console.log(`Recherche de l'email: ${email} dans la table: ${tableName}`);

        // ✅ Utiliser la fonction sécurisée pour créer le filtre
        const filterFormula = createEmailFilterFormula(email);

        const records = await table.select({
            filterByFormula: filterFormula,
            maxRecords: 1
        }).firstPage();

        const emailExists = records.length > 0;
        
        console.log(`Email ${email} trouvé: ${emailExists}`);
        
        return NextResponse.json({ exists: emailExists });
    } catch (error) {
        console.error('Erreur vérification email:', error);
        return NextResponse.json({ 
            error: 'Erreur serveur' 
        }, { status: 500 });
    }
}
