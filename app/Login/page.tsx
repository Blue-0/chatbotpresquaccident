'use client';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import Particles from "@/src/components/Particles";
import { verifyEmail } from "@/src/lib/emailverification";

export default function LoginPage() {
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const logData = new FormData(e.target as HTMLFormElement);
        const email = logData.get("email") as string;
        const emailExist = await verifyEmail(email);
        if (emailExist) {
            console.log('Email Autorisé');
            window.location.href = `/Chat`;
        } else {
            console.log('Email Non Autorisé');
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
                        </CardDescription>
                        <CardAction>
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="m@example.com"
                                        required
                                    />
                                </div>
                            </div>
                            <Button variant={"outline"} type="submit" className="w-full mt-4">
                                Login
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex-col gap-2">

                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
