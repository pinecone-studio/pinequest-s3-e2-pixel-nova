import type { AuthUser } from './types';

export const availableStudentUsers: AuthUser[] = [
  {
    id: 'student-1',
    code: 'S-2001',
    fullName: 'Anu Erdene',
    role: 'student',
    xp: 120,
    level: 3,
  },
  {
    id: 'student-2',
    code: 'S-2002',
    fullName: 'Temuulen Bat',
    role: 'student',
    xp: 220,
    level: 5,
  },
  {
    id: 'student-3',
    code: 'S-2003',
    fullName: 'Nomin Sukh',
    role: 'student',
    xp: 85,
    level: 2,
  },
];

export const defaultStudentUser = availableStudentUsers[0];
