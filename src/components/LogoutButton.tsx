import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";

export default function LogoutButton({ showLabel = true }: { showLabel?: boolean }) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logout realizado",
        description: "Você saiu do sistema.",
      });
      navigate("/auth");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className={`w-full ${showLabel ? 'justify-start' : 'justify-center'}`}
    >
      <LogOut className="h-4 w-4" />
      {showLabel && <span className="ml-2">Sair</span>}
    </Button>
  );
}
