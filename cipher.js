export const encode = (s) => new TextEncoder().encode(s);
export const decode = (b) => new TextDecoder().decode(b);
export const mod = (n, m = 26) => ((n % m) + m) % m;
export const clean = (s) => s.replace(/[^a-zA-Z]/g, "").toUpperCase();
export function base64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 8192)
    s += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(s);
}
export function unbase64(s) {
  s = s.replace(/\s/g, "");
  if (
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s)
  )
    throw Error(
      "Base64 tidak valid. Salin seluruh hasil tanpa mengubah huruf besar/kecil.",
    );
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}
function keyLetters(key) {
  const k = clean(key);
  if (!k) throw Error("Kunci harus berisi setidaknya satu huruf A–Z.");
  return k;
}
function inverse(a) {
  for (let i = 1; i < 26; i++) if (mod(a * i) === 1) return i;
  throw Error("Kunci tidak memiliki invers modulo 26.");
}
export function square(key) {
  return [
    ...new Set(
      keyLetters(key).replace(/J/g, "I") + "ABCDEFGHIKLMNOPQRSTUVWXYZ",
    ),
  ].join("");
}
export function preparePlayfair(text) {
  text = clean(text).replace(/J/g, "I");
  let result = "";
  for (let i = 0; i < text.length;) {
    const a = text[i++];
    let b = text[i];
    if (!b || a === b) b = a === "X" ? "Q" : "X";
    else i++;
    result += a + b;
  }
  return result;
}
function playfair(text, key, decrypt) {
  const grid = square(key);
  text = decrypt ? text.replace(/J/g, "I") : preparePlayfair(text);
  if (text.length % 2)
    throw Error("Cipherteks Playfair harus memiliki jumlah huruf genap.");
  let out = "";
  const dir = decrypt ? -1 : 1;
  for (let i = 0; i < text.length; i += 2) {
    const a = grid.indexOf(text[i]),
      b = grid.indexOf(text[i + 1]);
    let ar = Math.floor(a / 5),
      ac = a % 5,
      br = Math.floor(b / 5),
      bc = b % 5;
    if (ar === br) {
      ac = mod(ac + dir, 5);
      bc = mod(bc + dir, 5);
    } else if (ac === bc) {
      ar = mod(ar + dir, 5);
      br = mod(br + dir, 5);
    } else [ac, bc] = [bc, ac];
    out += grid[ar * 5 + ac] + grid[br * 5 + bc];
  }
  return out;
}
export function transpose(bytes, key, decrypt = false) {
  if (!key) throw Error("Isi kunci transposisi.");
  const chars = Array.from(key);
  const order = chars
    .map((_, i) => i)
    .sort((a, b) => chars[a].codePointAt(0) - chars[b].codePointAt(0) || a - b);
  const out = new Uint8Array(bytes.length);
  let p = 0;
  for (const col of order)
    for (let i = col; i < bytes.length; i += chars.length) {
      if (decrypt) out[i] = bytes[p++];
      else out[p++] = bytes[i];
    }
  return out;
}
export function transform(bytes, algorithm, options = {}, decrypt = false) {
  const {
    key = "",
    columnKey = "",
    a = 5,
    b = 8,
    matrix = [3, 3, 2, 5],
  } = options;
  if (algorithm === "extended" || algorithm === "super") {
    const k = encode(key);
    if (!k.length) throw Error("Isi kunci terlebih dahulu.");
    let input =
      algorithm === "super" && decrypt
        ? transpose(bytes, columnKey, true)
        : bytes;
    let output = Uint8Array.from(input, (v, i) =>
      mod(v + (decrypt ? -1 : 1) * k[i % k.length], 256),
    );
    return algorithm === "super" && !decrypt
      ? transpose(output, columnKey)
      : output;
  }
  const text = clean(decode(bytes));
  if (!text) throw Error("Pesan tidak mengandung huruf A–Z.");
  if (algorithm === "playfair") return encode(playfair(text, key, decrypt));
  if (algorithm === "hill") {
    if (matrix.length !== 4 || !matrix.every(Number.isSafeInteger))
      throw Error("Isi empat bilangan bulat untuk matriks Hill 2 × 2.");
    let [a, b, c, d] = matrix.map((v) => mod(v));
    const inv = inverse(a * d - b * c);
    if (decrypt)
      [a, b, c, d] = [d * inv, -b * inv, -c * inv, a * inv].map((v) => mod(v));
    if (decrypt && text.length % 2)
      throw Error("Cipherteks Hill harus memiliki jumlah huruf genap.");
    const input = text.length % 2 ? text + "X" : text;
    let out = "";
    for (let i = 0; i < input.length; i += 2) {
      const x = input.charCodeAt(i) - 65,
        y = input.charCodeAt(i + 1) - 65;
      out += String.fromCharCode(
        65 + mod(a * x + b * y),
        65 + mod(c * x + d * y),
      );
    }
    return encode(out);
  }
  if (algorithm === "affine") {
    if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b))
      throw Error("Kunci a dan b harus bilangan bulat.");
    const aa = mod(a),
      bb = mod(b),
      inv = inverse(aa);
    return encode(
      [...text]
        .map((c) =>
          String.fromCharCode(
            65 +
              mod(
                decrypt
                  ? inv * (c.charCodeAt(0) - 65 - bb)
                  : aa * (c.charCodeAt(0) - 65) + bb,
              ),
          ),
        )
        .join(""),
    );
  }
  if (!["vigenere", "autokey"].includes(algorithm))
    throw Error("Cipher tidak dikenal.");
  const stream = [...keyLetters(key)].map((c) => c.charCodeAt(0) - 65);
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const x = text.charCodeAt(i) - 65,
      k = algorithm === "autokey" ? stream[i] : stream[i % stream.length];
    const y = mod(x + (decrypt ? -k : k));
    out += String.fromCharCode(65 + y);
    if (algorithm === "autokey") stream.push(decrypt ? y : x);
  }
  return encode(out);
}
