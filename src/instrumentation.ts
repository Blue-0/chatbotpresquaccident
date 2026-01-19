
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Intercepter les erreurs non gérées au niveau du processus
        process.on('uncaughtException', (err: any) => {
            // Ignorer les erreurs "returnNaN" spécifiques connues pour être liées à des attaques/bugs sans impact critique
            if (err.toString().includes('returnNaN is not defined')) {
                console.error('🛡️ [SECURITY] Tentative d\'exploitation détectée et bloquée (returnNaN).');
                return;
            }

            // Log détaillé pour les autres erreurs
            console.error('🚨 [CRITICAL] Exception non gérée interceptée :', {
                message: err.message,
                stack: err.stack,
                code: err.code,
                syscall: err.syscall,
            });

            // Ne PAS quitter le processus pour maintenir le service en vie si possible
            // (Next.js redémarre généralement le worker, mais cela évite le crash complet immédiat des autres requêtes)
        });

        process.on('unhandledRejection', (reason: any, promise) => {
            console.error('🚨 [CRITICAL] Promesse rejetée non gérée :', reason);
        });

        console.log('✅ [System] Instrumentation de sécurité active.');
    }
}
