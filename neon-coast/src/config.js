// Neon Coast – global tunables. Units are metres and seconds.
export const CITY = {
  gridX: 10,        // number of road lines along X (blocks = gridX-1)
  gridZ: 8,         // number of road lines along Z
  block: 64,        // building area between two roads
  road: 14,         // road width (4 lanes of 3.5m)
  sidewalk: 3,      // sidewalk width inside a block
  lane: 3.5,
  beachWidth: 46,
};
CITY.pitch = CITY.block + CITY.road;                 // 78 m between road centre lines
CITY.roadX = i => (i - CITY.gridX / 2) * CITY.pitch;   // x of road line i (0..gridX)
CITY.roadZ = j => (j - CITY.gridZ / 2) * CITY.pitch;   // z of road line j (0..gridZ)
CITY.minX = CITY.roadX(0) - CITY.road / 2;
CITY.maxX = CITY.roadX(CITY.gridX) + CITY.road / 2;
CITY.minZ = CITY.roadZ(0) - CITY.road / 2;
CITY.maxZ = CITY.roadZ(CITY.gridZ) + CITY.road / 2;
CITY.beachX = CITY.maxX;                               // sand starts here
CITY.oceanX = CITY.maxX + CITY.beachWidth;             // water starts here

export const PLAYER = {
  walk: 2.6, run: 6.2, sprint: 8.4, jump: 5.2, gravity: 16,
  radius: 0.38, height: 1.8, maxHealth: 100, maxArmor: 100,
  enterRange: 3.6,
};

export const TRAFFIC = { cars: 34, peds: 44, spawnMin: 90, spawnMax: 220, despawn: 280, pedSpawnMin: 45, pedSpawnMax: 140, pedDespawn: 190 };

export const TIME = { start: 14 * 60, minutesPerSecond: 0.5, lampOn: 18.4, lampOff: 6.2 };

export const WEAPONS = [
  { id: 'fist',    dmg: 12,  rate: 0.45, spread: 0,     clip: 0,  auto: false, range: 1.8,  price: 0,    melee: true },
  { id: 'pistol',  dmg: 24,  rate: 0.28, spread: 0.012, clip: 12, auto: false, range: 90,   price: 600,  ammoPrice: 60,  ammoPack: 36 },
  { id: 'smg',     dmg: 14,  rate: 0.085, spread: 0.035, clip: 30, auto: true,  range: 70,  price: 1800, ammoPrice: 120, ammoPack: 90 },
  { id: 'shotgun', dmg: 11,  rate: 0.8,  spread: 0.07,  clip: 6,  auto: false, range: 28,   price: 2400, ammoPrice: 90,  ammoPack: 24, pellets: 8 },
  { id: 'rifle',   dmg: 30,  rate: 0.11, spread: 0.02,  clip: 30, auto: true,  range: 140,  price: 4200, ammoPrice: 160, ammoPack: 90 },
];

export const VEHICLES = {
  sedan:  { name: 'sedan',  maxSpeed: 40, accel: 10, brake: 22, grip: 8.5, mass: 1.0, steer: 0.55, len: 4.5, wid: 1.9, price: 3500,  hp: 100 },
  sport:  { name: 'sport',  maxSpeed: 56, accel: 16, brake: 26, grip: 9.5, mass: 1.0, steer: 0.5,  len: 4.5, wid: 1.95, price: 14000, hp: 90 },
  suv:    { name: 'suv',    maxSpeed: 38, accel: 9,  brake: 20, grip: 7.5, mass: 1.4, steer: 0.55, len: 4.8, wid: 2.05, price: 6500,  hp: 140 },
  truck:  { name: 'truck',  maxSpeed: 30, accel: 6,  brake: 16, grip: 7,   mass: 2.6, steer: 0.5,  len: 6.6, wid: 2.3, price: 9000,  hp: 220 },
  taxi:   { name: 'taxi',   maxSpeed: 40, accel: 10, brake: 22, grip: 8.5, mass: 1.0, steer: 0.55, len: 4.5, wid: 1.9, price: 4000,  hp: 100 },
  police: { name: 'police', maxSpeed: 48, accel: 13, brake: 24, grip: 9,   mass: 1.15, steer: 0.55, len: 4.7, wid: 1.95, price: 0,    hp: 120 },
  swat:   { name: 'swat',   maxSpeed: 40, accel: 10, brake: 20, grip: 8,   mass: 2.2, steer: 0.5,  len: 5.6, wid: 2.2, price: 0,    hp: 300 },
  muscle: { name: 'muscle', maxSpeed: 50, accel: 14, brake: 22, grip: 7.5, mass: 1.2, steer: 0.5,  len: 4.9, wid: 2.0, price: 9500,  hp: 110 },
};

export const CAR_COLORS = [0xd8d8dc, 0x1c1e26, 0x9b2335, 0x1f4e9b, 0xe8b830, 0x2e8b57, 0x7a4a2a, 0xc0c0c8, 0xff6f91, 0x3cc4d1, 0x5b3a8c, 0xf0f0f0, 0xf58a2a, 0x2f2f2f];
