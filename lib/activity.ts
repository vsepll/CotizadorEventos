// Definimos el enum directamente en lugar de importarlo de Prisma
export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN"
}

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
}

// Usuarios con contraseñas en texto plano
export const users: User[] = [
  {
    id: "clu0t4g0d0000l308lzctjatm",
    name: "Administrador",
    email: "admin@example.com",
    password: "admin123",
    role: "ADMIN"
  },
  {
    id: "clu0t5c0d0001l308k4hqayvn",
    name: "Usuario",
    email: "user@example.com",
    password: "user123",
    role: "USER"
  }
];

export function findUserByEmail(email: string): User | undefined {
  return users.find(user => user.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): User | undefined {
  return users.find(user => user.id === id);
}

export function validatePassword(inputPassword: string, storedPassword: string): boolean {
  // Comparación directa (sin hashing)
  return inputPassword === storedPassword;
} 