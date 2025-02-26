const { execSync } = require("child_process");
const os = require("os");

// Ambil key dari argumen CLI
const args = process.argv.slice(2);
const keyIndex = args.indexOf("--key");
if (keyIndex === -1 || keyIndex + 1 >= args.length) {
  console.error(
    "Error: Key tidak ditemukan! Gunakan: npm run reencrypt --key <your_key>"
  );
  process.exit(1);
}

const key = args[keyIndex + 1];

// Deteksi OS
const platform = os.platform();
let removeCommand = "";

if (platform === "win32") {
  removeCommand = "del /f .env.enc"; // Perintah Windows (cmd)
} else {
  removeCommand = "rm -f .env.enc"; // Perintah Linux/macOS
}

try {
  // Hapus file .env.enc sesuai OS
  execSync(removeCommand, { stdio: "inherit", shell: true });
  console.log("File .env.enc dihapus.");

  // Jalankan dotenvenc dengan key baru
  execSync(`dotenvenc -e ${key}`, { stdio: "inherit", shell: true });
  console.log("Re-encrypt berhasil dengan key baru.");
} catch (error) {
  console.error("Terjadi kesalahan saat re-encrypt:", error.message);
  process.exit(1);
}
