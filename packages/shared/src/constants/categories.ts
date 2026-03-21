export const CATEGORIES = [
  { id: "comida", name: "Comida", slug: "comida", icon: "UtensilsCrossed" },
  { id: "ropa", name: "Ropa", slug: "ropa", icon: "Shirt" },
  { id: "tecnologia", name: "Tecnología", slug: "tecnologia", icon: "Laptop" },
  { id: "hogar", name: "Hogar", slug: "hogar", icon: "Home" },
  { id: "belleza", name: "Belleza", slug: "belleza", icon: "Sparkles" },
  { id: "salud", name: "Salud", slug: "salud", icon: "Heart" },
  { id: "educacion", name: "Educación", slug: "educacion", icon: "GraduationCap" },
  { id: "transporte", name: "Transporte", slug: "transporte", icon: "Car" },
  { id: "eventos", name: "Eventos", slug: "eventos", icon: "PartyPopper" },
  { id: "mascotas", name: "Mascotas", slug: "mascotas", icon: "PawPrint" },
  { id: "servicios-profesionales", name: "Servicios Profesionales", slug: "servicios-profesionales", icon: "Briefcase" },
  { id: "otros", name: "Otros", slug: "otros", icon: "MoreHorizontal" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
