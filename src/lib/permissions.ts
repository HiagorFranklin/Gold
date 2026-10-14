export const ROLES = ["admin", "editor", "leitura"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  editor: "Editor de conteúdo",
  leitura: "Somente leitura",
};

export type Actor = { id: number | null; email: string; name?: string; role: Role };

export type Permission =
  | "panel:view"
  | "products:edit"
  | "products:price"
  | "products:regulatory"
  | "categories:edit"
  | "health:edit"
  | "health:publish"
  | "settings:edit"
  | "messages:view"
  | "audit:view"
  | "users:manage";

const MATRIX: Record<Role, Permission[]> = {
  admin: [
    "panel:view",
    "products:edit",
    "products:price",
    "products:regulatory",
    "categories:edit",
    "health:edit",
    "health:publish",
    "settings:edit",
    "messages:view",
    "audit:view",
    "users:manage",
  ],
  editor: ["panel:view", "products:edit", "categories:edit", "health:edit", "messages:view"],
  leitura: ["panel:view"],
};

export function can(actor: Actor | null | undefined, permission: Permission): boolean {
  if (!actor) return false;
  return MATRIX[actor.role]?.includes(permission) ?? false;
}
