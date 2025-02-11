import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await addUserAdmin();
  await prisma.$disconnect(); // Pastikan koneksi ditutup setelah selesai
}

async function addUserAdmin() {
  try {
    const hashedPassword = await bcrypt.hash("admin", 10);
    const admin = await prisma.user.findFirst({
      where: { email: "admin@markseek.com" },
    });

    if (admin) {
      console.log("User admin already exists. Updating...");
      await prisma.user.update({
        where: { id: admin.id },
        data: {
          name: "Admin",
          password: hashedPassword,
          role: "admin",
        },
      });
      console.log("User admin updated...");
    } else {
      console.log("Creating new admin user...");
      await prisma.user.create({
        data: {
          name: "Admin",
          email: "admin@markseek.com",
          password: hashedPassword,
          role: "admin",
        },
      });
      console.log("User admin added...");
    }
  } catch (error) {
    console.error("Error managing user admin:", error);
  }
}

main().catch((error) => {
  console.error("Error in main execution:", error);
  prisma.$disconnect();
});
