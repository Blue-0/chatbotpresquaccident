import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import Airtable from 'airtable'

const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        CredentialsProvider({
            id: 'credentials',
            name: 'Email Verification',
            credentials: {
                email: { label: 'Email', type: 'email', placeholder: 'votre@email.com' }
            },
            async authorize(credentials) {
                try {
                    if (!credentials?.email) {
                        throw new Error('Email requis')
                    }

                    // Configuration Airtable
                    const base = new Airtable({
                        apiKey: process.env.AIRTABLE_API_KEY,
                    }).base(process.env.AIRTABLE_BASE_ID || '')

                    const tableName = process.env.AIRTABLE_TABLE_ID || 'Users'
                    const table = base(tableName)

                    // Vérifier si l'email existe dans Airtable
                    const records = await table.select({
                        filterByFormula: `{mail} = "${credentials.email}"`,
                        maxRecords: 1
                    }).firstPage()

                    if (records.length > 0) {
                        const user = {
                            id: records[0].id,
                            email: credentials.email,
                            name: records[0].fields.name as string || credentials.email
                        }
                        return user
                    }

                    throw new Error('Email non autorisé')
                } catch (error) {
                    console.error('Erreur Airtable:', error)
                    return null
                }
            }
        })
    ],
    pages: {
        signIn: '/Login',
        error: '/Login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 24 heures
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id
            }
            return session
        },
    },
    debug: false,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
