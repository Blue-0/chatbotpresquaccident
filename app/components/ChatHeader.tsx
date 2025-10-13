import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { SessionId } from '@/app/components/sessionid';

interface ChatHeaderProps {
  userEmail?: string | null;
  onSignOut: () => void;
  headerRef: React.RefObject<HTMLDivElement | null>;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onSignOut,
  headerRef,
}) => {
  return (
    <Card className="mb-2 bg-white/95 shadow-lg border border-gray-200">
      <CardHeader className="pb-3 bg-transparent border-gray-200">
        <div ref={headerRef} className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800">
              E2I AgentSecu
            </CardTitle>
            <CardDescription className="text-gray-600 max-sm:hidden">
              Assistant IA pour vos questions de sécurité
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onSignOut} className="text-xs">
              <SessionId />
            </Button>
          </div>
        </div>
        <CardContent className="text-gray-600 text-sm sm:hidden block p-0">
              Assistant IA pour vos questions de sécurité
        </CardContent>
      </CardHeader>
    </Card>
  );
};
