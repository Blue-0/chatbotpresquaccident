import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

export async function POST(request: NextRequest) {
    try {
        // Vérifier les variables d'environnement
        if (!process.env.AIRTABLE_API_KEY) {
            console.error('AIRTABLE_API_KEY manquante');
            return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 });
        }

        if (!process.env.AIRTABLE_BASE_ID) {
            console.error('AIRTABLE_BASE_ID manquante');
            return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 });
        }

        const { email } = await request.json();
        
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Configuration Airtable
        const base = new Airtable({
            apiKey: process.env.AIRTABLE_API_KEY,
        }).base(process.env.AIRTABLE_BASE_ID);

        // Utiliser le nom de la table depuis l'environnement ou 'Users' par défaut
        const tableName = process.env.AIRTABLE_TABLE_ID || 'Users';
        const table = base(tableName);

        console.log(`Recherche de l'email: ${email} dans la table: ${tableName}`);

        const records = await table.select({
            filterByFormula: `{mail} = "${email}"`,
            maxRecords: 1
        }).firstPage();

        const emailExists = records.length > 0;
        
        console.log(`Email ${email} trouvé: ${emailExists}`);
        
        return NextResponse.json({ exists: emailExists });
    } catch (error) {
        console.error('Erreur détaillée lors de la vérification email:', error);
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error instanceof Error ? error.message : 'Erreur inconnue'
        }, { status: 500 });
    }
}
