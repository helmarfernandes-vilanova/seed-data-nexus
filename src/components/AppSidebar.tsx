import { Building2, Package, FileSpreadsheet, Lightbulb, ShoppingCart } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const nivItems = [
  { title: "Importação", url: "/importacao", icon: FileSpreadsheet },
  { title: "Empresa 501", url: "/niv/501", empresa: "501", icon: Building2 },
  { title: "Empresa 502", url: "/niv/502", empresa: "502", icon: Building2 },
  { title: "Empresa 1", url: "/niv/1", empresa: "1", icon: Building2 },
];

const sugestaoItems = [
  { title: "501 - HC", url: "/sugestao/501-hc", icon: Lightbulb },
];

const pedidoItems = [
  { title: "501 - HC", url: "/pedido/501-hc", icon: ShoppingCart },
];

export function AppSidebar() {
  const { open } = useSidebar();

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Menu Estoque */}
        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/estoque" end className={getNavCls}>
                    <Package className="h-4 w-4" />
                    {open && <span>Estoque</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Menu NIV */}
        <SidebarGroup>
          <SidebarGroupLabel>NIV - Condições Comerciais</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nivItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Menu Sugestão */}
        <SidebarGroup>
          <SidebarGroupLabel>Sugestão</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sugestaoItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Menu Pedido */}
        <SidebarGroup>
          <SidebarGroupLabel>Pedido</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {pedidoItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
