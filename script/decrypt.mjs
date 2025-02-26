const { execSync } = require("child_process");

// Ambil key dari argumen CLI
const args = process.argv.slice(2);
const keyIndex = args.indexOf("--key");
if (keyIndex === -1 || keyIndex + 1 >= args.length) {
  console.error(
    "Error: Key tidak ditemukan! Gunakan: npm run decrypt --key <your_key>"
  );
  process.exit(1);
}

const key = args[keyIndex + 1];

try {
  // Jalankan dotenvenc untuk decrypt
  execSync(`dotenvenc -d ${key}`, { stdio: "inherit", shell: true });
  console.log("Decrypt berhasil!");
} catch (error) {
  console.error("Terjadi kesalahan saat decrypt:", error.message);
  process.exit(1);
}
