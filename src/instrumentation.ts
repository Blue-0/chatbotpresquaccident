
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Intercepter les erreurs non gérées au niveau du processus
        process.on('uncaughtException', (err: unknown) => {
            // Ignorer les erreurs "returnNaN" spécifiques connues pour être liées à des attaques/bugs sans impact critique
            if (err instanceof Error && err.message.includes('returnNaN is not defined')) {
                console.error('🛡️ [SECURITY] Tentative d\'exploitation détectée et bloquée (returnNaN).');
                return;
            }

            // Fallback pour les erreurs qui ne sont pas des instances de Error
            const errorMessage = err instanceof Error ? err.message : String(err);
            const errorStack = err instanceof Error ? err.stack : undefined;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errorCode = (err as any).code; // Cast safe ici pour l'accès aux propriétés dynamiques
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errorSyscall = (err as any).syscall;

            // Log détaillé pour les autres erreurs
            console.error('🚨 [CRITICAL] Exception non gérée interceptée :', {
                message: errorMessage,
                stack: errorStack,
                code: errorCode,
                syscall: errorSyscall,
            });

            // Ne PAS quitter le processus pour maintenir le service en vie si possible
        });

        process.on('unhandledRejection', (reason: unknown) => {
            console.error('🚨 [CRITICAL] Promesse rejetée non gérée :', reason);
        });
        console.log('✅ [System] Instrumentation de sécurité active.');
    }
}
