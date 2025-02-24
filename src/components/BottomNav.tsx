
import { Home, Bell, User, Plus, Search, Menu } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, TouchEvent } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import LupaUsuario from "./lupausuario";
import MenuConfig from "./menuconfig";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: config } = useSiteConfig();
  const [session, setSession] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [touchStart, setTouchStart] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const difference = touchStart - touchEnd;

    // Se o usuário deslizar da direita para a esquerda (difference > 0)
    // ou da esquerda para a direita (difference < 0)
    if (Math.abs(difference) > 50) {
      if (difference > 0) {
        setShowMenu(false); // Fecha o menu
      } else {
        setShowMenu(true); // Abre o menu
      }
    }
  };

  const { data: unreadCount } = useQuery({
    queryKey: ["unreadNotifications"],
    queryFn: async () => {
      if (!session) return 0;
      
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: 'exact', head: true })
        .eq("read", false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!session,
    refetchInterval: 30000,
  });

  const handleNavigation = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error("Você precisa fazer login para acessar esta área");
      navigate("/login");
      return;
    }
    navigate(path);
  };

  const handleNavigateToProfile = (username: string) => {
    navigate(`/perfil/${username}`);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navStyle = {
    background: `linear-gradient(to right, ${config?.bottom_nav_primary_color || '#1A1F2C'}, ${config?.bottom_nav_secondary_color || '#D6BCFA'})`,
    borderTop: `1px solid ${config?.bottom_nav_primary_color}20 || '#1A1F2C20'`,
  };

  const getItemStyle = (active: boolean) => ({
    color: active ? config?.bottom_nav_icon_color : config?.bottom_nav_text_color,
    background: active ? `${config?.bottom_nav_primary_color}15` : 'transparent',
  });

  return (
    <>
      <nav 
        className="fixed bottom-0 left-0 right-0 shadow-lg transition-all duration-300 md:hidden"
        style={navStyle}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-around items-center py-2">
            <Link
              to="/"
              className="flex items-center p-2 rounded-xl transition-all duration-300 hover:scale-105"
              style={getItemStyle(isActive("/"))}
            >
              <Home className="h-6 w-6" strokeWidth={2} />
            </Link>

            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center p-2 rounded-xl transition-all duration-300 hover:scale-105"
              style={getItemStyle(showSearch)}
            >
              <Search className="h-6 w-6" strokeWidth={2} />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center p-2 rounded-xl transition-all duration-300 hover:scale-105"
                  style={{
                    color: config?.bottom_nav_icon_color,
                    background: `${config?.primary_color}15`,
                    opacity: session ? 1 : 0.5,
                  }}
                >
                  <Plus 
                    className="h-6 w-6" 
                    strokeWidth={2.5}
                    style={{
                      filter: `drop-shadow(0 2px 4px ${config?.primary_color}40)`
                    }}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="mb-2"
                style={{
                  background: config?.bottom_nav_primary_color,
                  borderColor: `${config?.bottom_nav_primary_color}40`,
                }}
              >
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(e) => handleNavigation("/products/new", e)}
                >
                  Adicionar Produto
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(e) => handleNavigation("/posts/new", e)}
                >
                  Criar Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={(e) => handleNavigation("/notify", e)}
              className="flex items-center p-2 rounded-xl transition-all duration-300 hover:scale-105 relative"
              style={getItemStyle(isActive("/notify"))}
            >
              <Bell className="h-6 w-6" strokeWidth={2} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="flex items-center space-x-2">
              <Link
                to={session ? "/perfil" : "/login"}
                className="flex items-center p-2 rounded-xl transition-all duration-300 hover:scale-105"
                style={getItemStyle(isActive("/perfil") || isActive("/login"))}
              >
                <User className="h-6 w-6" strokeWidth={2} />
              </Link>
              <button
                onClick={() => setShowMenu(true)}
                className="flex items-center p-2 rounded-xl transition-all duration-300 hover:scale-105"
              >
                <Menu className="h-6 w-6" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {showSearch && (
        <LupaUsuario 
          onClose={() => setShowSearch(false)}
          onSelectUser={handleNavigateToProfile}
        />
      )}

      {showMenu && <MenuConfig />}
    </>
  );
};

export default BottomNav;
