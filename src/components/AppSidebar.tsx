import { Building2, Package, Lightbulb, ShoppingCart } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import LogoutButton from "@/components/LogoutButton";
import { useIsMobile } from "@/hooks/use-mobile";

const nivItems = [
  { title: "NIV", url: "/niv", icon: Building2 },
];

const comprasItems = [
  { title: "Sugestão", url: "/sugestao", icon: Lightbulb },
  { title: "Pedido", url: "/pedido/501-hc", icon: ShoppingCart },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const isMobile = useIsMobile();
  const showLabels = open || isMobile;

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/estoque" end className={getNavCls}>
                    <Package className="h-4 w-4" />
                    {showLabels && <span>Estoque</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {nivItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {showLabels && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {comprasItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {showLabels && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-3 py-2">
          <LogoutButton showLabel={showLabels} />
        </div>
        {showLabels && (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            Sistema de Gestão v1.0
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
