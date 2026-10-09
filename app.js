import {
  encode,
  decode,
  clean,
  base64,
  unbase64,
  transform,
} from "./cipher.js";
const $ = (id) => document.getElementById(id);
let decrypt = false,
  source = "text",
  result = null,
  resultName = "";
const descriptions = {
  vigenere: "Kunci diulang sepanjang pesan.",
  autokey: "Kunci dilanjutkan dengan huruf plainteks.",
  extended: "Kunci UTF-8 dijumlahkan pada setiap byte modulo 256.",
  playfair: "Kunci membentuk tabel huruf 5 × 5.",
  affine:
    "a harus relatif prima terhadap 26: 1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, atau 25.",
  hill: "Determinan matriks harus memiliki invers modulo 26.",
  super:
    "Extended Vigenere, lalu transposisi kolom. Kunci kolom diurutkan menurut nilai Unicode; huruf sama dibaca dari kiri.",
};
function status(text, kind = "") {
  $("status").textContent = text;
  $("status").className = kind;
}
function clearResult() {
  result = null;
  $("output").value = "";
  $("output-info").textContent = "Belum ada hasil";
  $("download-row").hidden = true;
  for (const id of ["copy", "reuse"]) $(id).disabled = true;
  status("Siap memproses pesan.");
}
function setMode(value) {
  decrypt = value;
  $("encrypt").classList.toggle("active", !value);
  $("decrypt").classList.toggle("active", value);
  $("encrypt").setAttribute("aria-pressed", !value);
  $("decrypt").setAttribute("aria-pressed", value);
  $("run").textContent = value ? "Dekripsi" : "Enkripsi";
  $("input-title").textContent = value ? "Cipherteks" : "Pesan";
  clearResult();
}
function setSource(value) {
  source = value;
  $("text-source").hidden = value !== "text";
  $("file-source").hidden = value !== "file";
  for (const kind of ["text", "file"]) {
    $(kind + "-tab").classList.toggle("selected", value === kind);
    $(kind + "-tab").setAttribute("aria-pressed", value === kind);
  }
  clearResult();
  updateCount();
}
function updateCount() {
  $("input-info").textContent =
    source === "text"
      ? `${$("input").value.length.toLocaleString("id-ID")} karakter`
      : $("file").files[0]
        ? `${$("file").files[0].size.toLocaleString("id-ID")} byte`
        : "Belum ada file dipilih";
}
function updateAlgorithm() {
  const a = $("algorithm").value;
  $("word-key").hidden = ["affine", "hill"].includes(a);
  $("column-field").hidden = a !== "super";
  $("affine-fields").hidden = a !== "affine";
  $("hill-fields").hidden = a !== "hill";
  $("key-hint").textContent = descriptions[a];
  $("algorithm-note").textContent = ["extended", "super"].includes(a)
    ? "Semua byte diproses, termasuk header file. Mendukung teks UTF-8 dan seluruh jenis file."
    : a === "playfair"
      ? "Hanya A–Z. J digabung ke I; pasangan huruf diberi sisipan X (atau Q). Sisipan tetap ada saat dekripsi."
      : a === "hill"
        ? "Hanya A–Z. Pesan dengan jumlah huruf ganjil ditambah X; huruf ini tetap ada saat dekripsi."
        : "Hanya huruf A–Z yang diproses. Spasi, angka, dan tanda baca dihapus.";
  clearResult();
}
function showResult() {
  if (!result) return;
  const limit = 100000,
    bytes = result.subarray(0, limit),
    format = $("output-format").value;
  $("output").value =
    format === "base64"
      ? base64(bytes)
      : format === "hex"
        ? Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(" ")
        : decode(bytes);
  $("output-info").textContent =
    `${result.length.toLocaleString("id-ID")} byte · ${format === "base64" ? "Base64" : format === "hex" ? "Hex" : "Teks UTF-8"}${result.length > limit ? " · Pratinjau 100.000 byte pertama" : ""}`;
}
$("encrypt").onclick = () => setMode(false);
$("decrypt").onclick = () => setMode(true);
$("text-tab").onclick = () => setSource("text");
$("file-tab").onclick = () => setSource("file");
$("algorithm").onchange = updateAlgorithm;
$("input").oninput = () => {
  clearResult();
  updateCount();
};
for (const id of ["key", "column-key", "affine-a", "affine-b", "input-format"])
  $(id).addEventListener("input", clearResult);
document
  .querySelectorAll(".matrix input")
  .forEach((el) => (el.oninput = clearResult));
$("file").onchange = () => {
  const file = $("file").files[0];
  $("file-name").textContent = file?.name || "Pilih file dari perangkat";
  $("file-detail").textContent = file
    ? `${(file.size / 1024).toLocaleString("id-ID", { maximumFractionDigits: 1 })} KB`
    : "Teks, gambar, database, audio, atau video";
  clearResult();
  updateCount();
};
$("example").onclick = () => {
  setMode(false);
  $("input-format").value = "text";
  $("input").value = "TEMUI SAYA DI TAMAN PUKUL LIMA";
  $("key").value = "RAHASIA";
  $("column-key").value = "KAMPUS";
  updateCount();
};
$("output-format").onchange = showResult;
$("workspace").onsubmit = async (event) => {
  event.preventDefault();
  clearResult();
  $("run").disabled = true;
  status("Memproses…");
  try {
    const algorithm = $("algorithm").value,
      binary = ["extended", "super"].includes(algorithm),
      file = $("file").files[0];
    let bytes;
    if (source === "file") {
      if (!file) throw Error("Pilih file terlebih dahulu.");
      if (file.size > 20 * 1024 * 1024)
        throw Error("Ukuran file melebihi batas 20 MB.");
      bytes = new Uint8Array(await file.arrayBuffer());
      if (!binary) {
        try {
          new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        } catch {
          throw Error(
            "File biner memerlukan Extended Vigenere atau Super Enkripsi agar dapat dipulihkan utuh.",
          );
        }
        if (bytes.includes(0))
          throw Error(
            "File ini tampak biner. Pilih Extended Vigenere atau Super Enkripsi.",
          );
      }
    } else {
      if (!$("input").value) throw Error("Isi pesan terlebih dahulu.");
      bytes =
        $("input-format").value === "base64"
          ? unbase64($("input").value)
          : encode($("input").value);
      if (bytes.length > 20 * 1024 * 1024)
        throw Error("Pesan melebihi batas 20 MB.");
    }
    const number = (id) =>
      $(id).value.trim() === "" ? NaN : Number($(id).value);
    const options = {
      key: $("key").value,
      columnKey: $("column-key").value,
      a: number("affine-a"),
      b: number("affine-b"),
      matrix: [...document.querySelectorAll(".matrix input")].map((el) =>
        el.value.trim() === "" ? NaN : Number(el.value),
      ),
    };
    const start = performance.now();
    result = transform(bytes, algorithm, options, decrypt);
    resultName =
      source === "file"
        ? decrypt
          ? binary
            ? file.name.replace(/\.dat$/i, "")
            : "plainteks.txt"
          : file.name + ".dat"
        : decrypt
          ? "plainteks.txt"
          : "cipherteks.dat";
    if (decrypt && resultName === file?.name)
      resultName = "hasil-" + resultName;
    $("download-name").value = resultName;
    $("download-row").hidden = false;
    $("copy").disabled = false;
    $("reuse").disabled = false;
    showResult();
    const note = binary
      ? ""
      : ` ${clean(decode(bytes)).length} huruf A–Z diproses.`;
    status(
      `${decrypt ? "Dekripsi" : "Enkripsi"} selesai dalam ${(performance.now() - start).toFixed(1)} ms.${note}`,
      "success",
    );
  } catch (error) {
    clearResult();
    status(error.message, "error");
  } finally {
    $("run").disabled = false;
  }
};
$("copy").onclick = async () => {
  if (!result) return;
  try {
    const format = $("output-format").value;
    await navigator.clipboard.writeText(
      format === "base64"
        ? base64(result)
        : format === "hex"
          ? Array.from(result, (b) => b.toString(16).padStart(2, "0")).join(" ")
          : decode(result),
    );
    status("Seluruh hasil disalin.", "success");
  } catch {
    status(
      "Tidak dapat mengakses clipboard. Pilih teks hasil lalu salin manual.",
      "error",
    );
  }
};
$("reuse").onclick = () => {
  if (!result) return;
  const value = base64(result);
  setMode(!decrypt);
  setSource("text");
  $("input-format").value = "base64";
  $("input").value = value;
  updateCount();
  status("Hasil dipindahkan. Kunci tetap sama; jalankan proses berikutnya.");
};
$("download").onclick = () => {
  if (!result) return;
  const name = $("download-name").value.trim();
  if (!name || /[\\/:*?"<>|]/.test(name)) {
    status("Isi nama file yang valid, beserta ekstensinya.", "error");
    return;
  }
  const url = URL.createObjectURL(
    new Blob([result], { type: "application/octet-stream" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status("File hasil siap diunduh.", "success");
};
updateAlgorithm();
