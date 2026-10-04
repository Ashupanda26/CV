// Placeholder photography from Unsplash (free to use under the Unsplash License).
// Swap these for the client's own project photos before launch.
const u = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`

export const IMAGES = {
  hero: u('1613490493576-7fde63acd811', 2400),
  about: u('1600596542815-ffad4c1539a9', 1600),
  viewerBg: u('1530053969600-caed2596d242', 1600),
  quoteBg: u('1564013799919-ab600027ffc6', 2000),
  pools: [
    u('1576013551627-0cc20b96c2a7'),
    u('1512917774080-9991f1c4c750'),
    u('1582268611958-ebfd161ef9cf'),
    u('1564013799919-ab600027ffc6'),
    u('1600585154340-be6161a56a0c'),
    u('1540541338287-41700207dee6'),
    u('1571896349842-33c89424de2d'),
    u('1566073771259-6a8506099945'),
    u('1575429198097-0414ec08e8cd'),
    u('1580587771525-78b9dba3b914'),
    u('1600047509807-ba8f99d2cdde'),
    u('1613490493576-7fde63acd811'),
  ],
  services: {
    design: u('1600607687939-ce8a6c25118c', 1000),
    construction: u('1600566753190-17f0baa2a6c3', 1000),
    renovation: u('1575429198097-0414ec08e8cd', 1000),
    landscaping: u('1600585154340-be6161a56a0c', 1000),
    maintenance: u('1530053969600-caed2596d242', 1000),
  },
}

export const pool = (i: number) => IMAGES.pools[i % IMAGES.pools.length]!
