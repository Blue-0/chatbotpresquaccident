export async function verifyEmail(email: string): Promise<boolean> {
    try {
        const response = await fetch('/api/verify-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la vérification');
        }

        const data = await response.json();
        return data.exists;
    } catch (error) {
        console.error("Erreur lors de la vérification email:", error);
        return false;
    }
}

