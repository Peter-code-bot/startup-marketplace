export const TRUST_LEVELS = {
  nuevo: {
    label: "Nuevo",
    color: "gray",
    minPoints: 0,
    benefits: ["Funcionalidad básica"],
  },
  verificado: {
    label: "Verificado",
    color: "blue",
    minPoints: 50,
    benefits: ["Badge azul"],
  },
  confiable: {
    label: "Confiable",
    color: "green",
    minPoints: 200,
    benefits: ["Prioridad en búsqueda"],
  },
  estrella: {
    label: "Estrella",
    color: "purple",
    minPoints: 500,
    benefits: ["Destacado en home", "Badge morado"],
  },
  elite: {
    label: "Élite",
    color: "gold",
    minPoints: 1000,
    benefits: ["Badge dorado", "Destacado permanente", "Soporte prioritario"],
  },
} as const;

export type TrustLevel = keyof typeof TRUST_LEVELS;

export const TRUST_POINTS = {
  // Seller points
  saleCompletedSeller: 10,
  saleCompletedBuyer: 3,
  review5Stars: 5,
  review4Stars: 3,
  review3Stars: 1,
  review2Stars: 0,
  review1Star: -2,
  leaveReview: 2,
  verifyPhone: 10,
  verifyINE: 30,
  cancelSaleSeller: -5,
  cancelSaleBuyer: -3,
  disputeLost: -20,
} as const;
