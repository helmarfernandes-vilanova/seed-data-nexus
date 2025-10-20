import { Building2, Package, Lightbulb, ShoppingCart, ChevronDown } from "lucide-react";
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import LogoutButton from "@/components/LogoutButton";
import { useIsMobile } from "@/hooks/use-mobile";

const nivItems = [
  { title: "NIV", url: "/niv", icon: Building2 },
];

const comprasItems = [
  { title: "Sugestão", url: "/sugestao", icon: Lightbulb },
];

const pedidoSubItems = [
  { title: "Rascunho", url: "/pedido/501-hc" },
  { title: "ERP", url: "/pedido/erp" },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const isMobile = useIsMobile();
  const showLabels = open || isMobile;

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm" 
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-all duration-200";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="pt-6">
        {showLabels && (
          <div className="px-4 pb-4 mb-2">
            <h2 className="text-lg font-bold text-sidebar-foreground">FlyWheel</h2>
            <p className="text-xs text-sidebar-foreground/60 mt-1">Compras</p>
          </div>
        )}
        
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="rounded-lg">
                  <NavLink to="/estoque" end className={getNavCls}>
                    <Package className="h-5 w-5" />
                    {showLabels && <span>Estoque</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {nivItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild className="rounded-lg">
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-5 w-5" />
                      {showLabels && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {comprasItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild className="rounded-lg">
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-5 w-5" />
                      {showLabels && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              <Collapsible className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="rounded-lg hover:bg-sidebar-accent/50 transition-all duration-200">
                      <ShoppingCart className="h-5 w-5" />
                      {showLabels && <span>Pedido</span>}
                      {showLabels && <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-300 group-data-[state=open]/collapsible:rotate-180" />}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="transition-all duration-300">
                    <SidebarMenuSub className="ml-3 mt-1 space-y-1 border-l-2 border-sidebar-border pl-3">
                      {pedidoSubItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.url}>
                          <SidebarMenuSubButton asChild className="rounded-md">
                            <NavLink to={subItem.url} end className={getNavCls}>
                              {showLabels && <span className="text-sm">{subItem.title}</span>}
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border mt-auto">
        <div className="px-3 py-3">
          <LogoutButton showLabel={showLabels} />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
