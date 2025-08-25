import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserProfileProps {
  user: any;
  onSignOut: () => void;
}

export const UserProfile = ({ user, onSignOut }: UserProfileProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Déconnecté",
        description: "À bientôt sur FASTQC Agent !",
      });
      
      onSignOut();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    return user?.email?.split('@')[0] || 'Utilisateur';
  };

  const getProviderBadge = () => {
    const provider = user?.app_metadata?.provider;
    switch (provider) {
      case 'google':
        return <Badge variant="secondary" className="text-xs">Google</Badge>;
      case 'github':
        return <Badge variant="secondary" className="text-xs">GitHub</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Email</Badge>;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture} 
              alt={getUserDisplayName()} 
            />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(getUserDisplayName())}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium leading-none">
                {getUserDisplayName()}
              </p>
              {getProviderBadge()}
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <User className="mr-2 h-4 w-4" />
          <span>Profil</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <History className="mr-2 h-4 w-4" />
          <span>Mes analyses</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Settings className="mr-2 h-4 w-4" />
          <span>Paramètres</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={loading}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{loading ? "Déconnexion..." : "Se déconnecter"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};