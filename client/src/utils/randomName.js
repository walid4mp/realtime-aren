const ANIMALS = ['Tiger','Phoenix','Falcon','Wolf','Otter','Panda','Bear','Lynx','Orca','Hawk','Dolphin','Cobra'];
const ADJ = ['Swift','Brave','Lucky','Cosmic','Neon','Pixel','Royal','Mystic','Frosty','Sunny','Shadow','Crystal'];
export function randomName() {
  return ADJ[Math.floor(Math.random() * ADJ.length)] + ANIMALS[Math.floor(Math.random() * ANIMALS.length)] + (Math.floor(Math.random() * 90 + 10));
}
