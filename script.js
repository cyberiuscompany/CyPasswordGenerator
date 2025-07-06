const passwordField = document.getElementById("password");
const lengthSlider = document.getElementById("length");
const lengthValue = document.getElementById("lengthValue");
const copyBtn = document.getElementById("copyBtn");
const generateBtn = document.getElementById("generateBtn");
const entropyValue = document.getElementById("entropyValue");
const entropyFill = document.getElementById("entropyFill");
const alertBox = document.getElementById("alertBox");
const crackEstimate = document.getElementById("crackEstimate");
const canvas = document.getElementById("radarCanvas");
const ctx = canvas.getContext("2d");

lengthSlider.addEventListener("input", () => {
  lengthValue.textContent = lengthSlider.value;
});

copyBtn.addEventListener("click", () => {
  if (!passwordField.value) return;
  passwordField.select();
  document.execCommand("copy");
  showAlert();
});

generateBtn.addEventListener("click", generatePassword);

function generatePassword() {
  const length = +lengthSlider.value;
  const useUpper = document.getElementById("uppercase").checked;
  const useLower = document.getElementById("lowercase").checked;
  const useNumbers = document.getElementById("numbers").checked;
  const useSymbols = document.getElementById("symbols").checked;
  const noAmbiguous = document.getElementById("noAmbiguous").checked;
  const noRepeats = document.getElementById("noRepeats").checked;
  const ultraSecure = document.getElementById("ultraSecure").checked;

  let upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let lower = "abcdefghijkmnopqrstuvwxyz";
  let numbers = "23456789";
  let symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  if (!useUpper && !useLower && !useNumbers && !useSymbols) {
    passwordField.value = "Selecciona al menos una opción";
    return;
  }

  let charSet = "";
  if (useUpper) charSet += upper + (noAmbiguous ? "" : "IO");
  if (useLower) charSet += lower + (noAmbiguous ? "" : "l");
  if (useNumbers) charSet += numbers + (noAmbiguous ? "" : "01");
  if (useSymbols) charSet += symbols;

  let password = "";

  if (ultraSecure) {
    const seed = crypto.getRandomValues(new Uint8Array(length));
    for (let i = 0; i < length; i++) {
      password += charSet[seed[i] % charSet.length];
    }
  } else {
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      let nextChar;
      let tries = 0;
      do {
        nextChar = charSet[array[i + tries] % charSet.length];
        tries++;
      } while (noRepeats && password[i - 1] === nextChar && tries < 10);
      password += nextChar;
    }
  }

  passwordField.value = password;
  const entropy = updateEntropy(password, charSet.length);
  updateCrackTime(entropy);
  updateRadar(password, charSet.length, entropy);
}

function updateEntropy(password, poolSize) {
  const entropy = (Math.log2(poolSize) * password.length).toFixed(2);
  entropyValue.textContent = entropy;

  let percent = Math.min(100, entropy / 2);
  entropyFill.style.width = percent + "%";

  if (entropy < 40) {
    entropyFill.style.background = "crimson";
  } else if (entropy < 60) {
    entropyFill.style.background = "orange";
  } else {
    entropyFill.style.background = "limegreen";
  }

  return parseFloat(entropy);
}

function updateCrackTime(entropy) {
  const attemptsPerSecond = 1e9; // 1 billion guesses/second
  const seconds = Math.pow(2, entropy) / attemptsPerSecond;

  let result = "";

  if (seconds < 1) result = "menos de 1 segundo";
  else if (seconds < 60) result = `${seconds.toFixed(2)} segundos`;
  else if (seconds < 3600) result = `${(seconds / 60).toFixed(2)} minutos`;
  else if (seconds < 86400) result = `${(seconds / 3600).toFixed(2)} horas`;
  else if (seconds < 31536000) result = `${(seconds / 86400).toFixed(2)} días`;
  else result = `${(seconds / 31536000).toFixed(2)} años`;

  crackEstimate.textContent = result;
}

function showAlert() {
  alertBox.classList.remove("hidden");
  setTimeout(() => alertBox.classList.add("hidden"), 2000);
}

function updateRadar(password, charsetLength, entropy) {
  const lengthScore = Math.min(password.length / 64, 1);
  const entropyScore = Math.min(entropy / 128, 1);
  const charsetScore = Math.min(charsetLength / 100, 1);
  const bruteRes = Math.min(Math.log2(charsetLength * password.length) / 10, 1);
  const crackScore = entropyScore;

  const metrics = [lengthScore, entropyScore, charsetScore, bruteRes, crackScore];

  const labels = ["Longitud", "Entropía", "Variedad", "Brute Force", "Crack Time"];
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 100;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw web
  for (let i = 1; i <= 5; i++) {
    ctx.beginPath();
    for (let j = 0; j < 5; j++) {
      const angle = (j * 2 * Math.PI) / 5;
      const x = centerX + Math.cos(angle) * (radius * i / 5);
      const y = centerY + Math.sin(angle) * (radius * i / 5);
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = "#555";
    ctx.stroke();
  }

  // Draw axes
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#666";
    ctx.stroke();

    // Labels
    ctx.fillStyle = "#83f1e8";
    ctx.font = "12px monospace";
    ctx.fillText(labels[i], x - 30, y);
  }

  // Draw data polygon
  ctx.beginPath();
  metrics.forEach((val, i) => {
    const angle = (i * 2 * Math.PI) / 5;
    const x = centerX + Math.cos(angle) * radius * val;
    const y = centerY + Math.sin(angle) * radius * val;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = "rgba(131, 241, 232, 0.4)";
  ctx.fill();
  ctx.strokeStyle = "#83f1e8";
  ctx.stroke();
}
