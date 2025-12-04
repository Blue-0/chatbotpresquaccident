import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'


const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        CredentialsProvider({
            id: 'credentials',
            name: 'First Name Login',
            credentials: {
                name: { label: 'Prénom', type: 'text', placeholder: 'Votre prénom' }
            },
            async authorize(credentials) {
                try {
                    if (!credentials?.name) {
                        throw new Error('Prénom requis')
                    }

                    // Plus de vérification Airtable, on accepte tout prénom
                    const user = {
                        id: Date.now().toString(), // ID temporaire unique basé sur le timestamp
                        name: credentials.name,
                        email: `${credentials.name.toLowerCase().replace(/\s+/g, '.')}@guest.local` // Email fictif pour NextAuth
                    }

                    return user
                } catch (error) {
                    console.error('Erreur Auth:', error)
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
