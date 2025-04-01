import { PrismaClient, UserRole } from '@prisma/client';
import { users } from './activity';

const prisma = new PrismaClient();

async function createHardcodedUsers() {
  try {
    console.log('Iniciando creación de usuarios hardcodeados...');

    // Para cada usuario en la lista hardcodeada
    for (const user of users) {
      // Verificar si el usuario ya existe
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email }
      });

      if (existingUser) {
        console.log(`Usuario ya existe: ${user.email}`);
        
        // Actualizar el usuario existente con los datos correctos
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            id: user.id, // Asegurar que tenga el ID correcto
            name: user.name,
            email: user.email,
            password: user.password,
            role: user.role as UserRole // Conversión de tipo
          }
        });
        console.log(`Usuario actualizado: ${user.email}`);
      } else {
        // Crear el usuario si no existe
        await prisma.user.create({
          data: {
            id: user.id, // Usar el ID hardcodeado
            name: user.name,
            email: user.email,
            password: user.password,
            role: user.role as UserRole // Conversión de tipo
          }
        });
        console.log(`Usuario creado: ${user.email}`);
      }
    }

    console.log('Usuarios hardcodeados creados/actualizados exitosamente.');
  } catch (error) {
    console.error('Error al crear usuarios hardcodeados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
createHardcodedUsers(); 