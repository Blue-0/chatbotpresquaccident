import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { z } from 'zod';
import { createIdentifierFilterFormula } from '@/src/lib/airtable-utils';
import { validateOrigin } from '@/src/lib/csrf-protection';

// Schéma de validation - Accepte email OU identifiant simple
const identifierSchema = z.object({
    email: z.string().min(1).max(255).trim()
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
        const validation = identifierSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                error: 'Identifiant invalide'
            }, { status: 400 });
        }

        const { email: identifier } = validation.data;

        // Configuration Airtable
        const base = new Airtable({
            apiKey: process.env.AIRTABLE_API_KEY,
        }).base(process.env.AIRTABLE_BASE_ID);

        // Utiliser le nom de la table depuis l'environnement ou 'Users' par défaut
        const tableName = process.env.AIRTABLE_TABLE_ID || 'Users';
        const table = base(tableName);

        console.log(`Recherche de l'identifiant: ${identifier} dans la table: ${tableName}`);

        // ✅ Utiliser la fonction sécurisée pour chercher dans username OU mail
        const filterFormula = createIdentifierFilterFormula(identifier);

        const records = await table.select({
            filterByFormula: filterFormula,
            maxRecords: 1
        }).firstPage();

        const identifierExists = records.length > 0;

        console.log(`Identifiant ${identifier} trouvé: ${identifierExists}`);

        return NextResponse.json({ exists: identifierExists });
    } catch (error) {
        console.error('Erreur vérification email:', error);
        return NextResponse.json({ 
            error: 'Erreur serveur' 
        }, { status: 500 });
    }
}
