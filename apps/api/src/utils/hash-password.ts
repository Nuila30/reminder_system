import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("Debes proporcionar una contraseña.");
  console.error("Ejemplo:");
  console.error("pnpm hash AdminSys2026!");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);

console.log("");
console.log("HASH GENERADO:");
console.log("");
console.log(hash);
console.log("");