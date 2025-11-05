export const NAV_LINKS = [
  {
    title: "Products",
    sublinks: [
      {
        title: "Hisabiq - Accounting",
        href: "#accounting",
      },
      {
        title: "Kanz - HR & Payroll",
        href: "#hr",
      },
      {
        title: "Nisbah - CRM",
        href: "#crm",
      },
      {
        title: "All Features",
        href: "#features",
      },
    ],
  },
  {
    title: "Solutions",
    sublinks: [
      {
        title: "For SMEs",
        href: "#sme",
      },
      {
        title: "For Enterprises",
        href: "#enterprise",
      },
      {
        title: "MENA Compliance",
        href: "#compliance",
      },
    ],
  },
  {
    title: "Resources",
    sublinks: [
      {
        title: "Documentation",
        href: "#docs",
      },
      {
        title: "API Reference",
        href: "#api",
      },
      {
        title: "Support",
        href: "#support",
      },
    ],
  },
  {
    title: "Pricing",
    sublinks: [
      {
        title: "View Plans",
        href: "#pricing",
      },
      {
        title: "Request Demo",
        href: "#demo",
      },
    ],
  },
];

export type LinkType = {
  title: string;
  sublinks: { title: string; href: string }[];
};
