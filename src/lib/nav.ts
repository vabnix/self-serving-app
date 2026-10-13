// `match` lists the path prefixes that highlight the link in the header.
export const navLinks = [
  { href: "/", label: "Home", footerLabel: "Home", match: [] },
  {
    href: "/catalog",
    label: "Catalog",
    footerLabel: "Resource Catalog",
    match: ["/catalog", "/request"],
  },
  {
    href: "/submissions",
    label: "My Requests",
    footerLabel: "My Requests",
    match: ["/submissions", "/resources"],
  },
];
