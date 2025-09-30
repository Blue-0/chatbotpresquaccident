'use client';
import { Suspense } from 'react'
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import Particles from "@/src/components/Particles";
import { signIn, getSession } from 'next-auth/react'
import { FormEvent, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()

    // Vérifier si l'utilisateur est déjà connecté
    useEffect(() => {
        const checkSession = async () => {
            const session = await getSession()
            if (session) {
                router.push('/Chat')
            }
        }
        checkSession()
    }, [router])

    // Récupérer les erreurs depuis les paramètres URL
    useEffect(() => {
        const errorParam = searchParams.get('error')
        if (errorParam) {
            switch (errorParam) {
                case 'CredentialsSignin':
                    setError('Email non autorisé ou problème de connexion')
                    break
                case 'Configuration':
                    setError('Problème de configuration du serveur')
                    break
                default:
                    setError('Erreur de connexion')
            }
        }
    }, [searchParams])

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(event.currentTarget)
        const email = formData.get('email') as string

        if (!email) {
            setError('Email requis')
            setIsLoading(false)
            return
        }

        try {
            const result = await signIn('credentials', {
                email,
                redirect: false,
            })

            if (result?.error) {
                console.error('Erreur de connexion:', result.error)
                setError('Email non autorisé ou erreur de connexion')
            } else if (result?.ok) {
                router.push('/Chat')
                router.refresh()
            }
        } catch (error) {
            console.error('Erreur lors de la connexion:', error)
            setError('Erreur de connexion inattendue')
        } finally {
            setIsLoading(false)
        }
    };

    return (
        <div className="relative min-h-screen flex justify-center items-center">
            <div className="absolute inset-0 z-0">
                <Particles
                    particleColors={['#43bb8c']}
                    particleCount={500}
                    particleSpread={8}
                    speed={0.1}
                    particleBaseSize={100}
                    moveParticlesOnHover={false}
                    alphaParticles={false}
                    disableRotation={false}
                />
            </div>
            <div className="relative z-10 w-[80vw] h-[30vh] flex justify-center">
                <Card className="flex justify-center border-1 borderlight text-lg font-raleway w-full max-w-sm bg-white/90 shadow-lg shadow-shadowlight">
                    <CardHeader>
                        <CardTitle>E2I AgentSecu</CardTitle>
                        <CardDescription>
                            Connexion par email autorisé
                        </CardDescription>
                        <CardAction>
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-6">
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="votre@email.com"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <Button 
                                variant={"outline"} 
                                type="submit" 
                                className="w-full mt-4" 
                                disabled={isLoading}
                            >
                                {isLoading ? 'Vérification...' : 'Se connecter'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="relative min-h-screen flex justify-center items-center">
                <div className="text-lg">Chargement...</div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}