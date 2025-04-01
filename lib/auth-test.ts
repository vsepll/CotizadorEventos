import bcrypt from "bcryptjs";

// Esta función ayuda a generar hashes para nuevas contraseñas
export function generateHash(password: string): string {
  return bcrypt.hashSync(password, 10);
}

// Esta función verifica si una contraseña coincide con su hash
export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

// Verificar las contraseñas actuales
const adminPassword = "admin123";
const adminHash = "$2a$10$XpZPDv.Z5VQZJsXJmzliI.vBng7JgfHfZbT8PWkiMfEMGtl36xRZS";
console.log(`Verificación admin: ${verifyPassword(adminPassword, adminHash)}`);

const userPassword = "user123";
const userHash = "$2a$10$kMO87gxO/eOjbD/XZJJhKOMtLivYWQDLXhNW5qZGHSKQw3UQo1KNa";
console.log(`Verificación user: ${verifyPassword(userPassword, userHash)}`);

// Generar nuevos hashes para verificar
console.log(`Nuevo hash para admin123: ${generateHash("admin123")}`);
console.log(`Nuevo hash para user123: ${generateHash("user123")}`); 