// XP-to-Level quadratic curve
// Level 1: 0 XP, Level 2: 100 XP, Level 3: 400 XP, Level 4: 900 XP

export function getLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function xpForLevel(level: number): number {
  return 100 * (level - 1) ** 2;
}

export function xpForNextLevel(currentXp: number): number {
  const currentLevel = getLevel(currentXp);
  return xpForLevel(currentLevel + 1);
}

export function xpProgress(currentXp: number): number {
  const currentLevel = getLevel(currentXp);
  const currentLevelXp = xpForLevel(currentLevel);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  const range = nextLevelXp - currentLevelXp;
  if (range === 0) return 100;
  return Math.round(((currentXp - currentLevelXp) / range) * 100);
}
