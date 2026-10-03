const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const app = express();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.use(cors());
app.use(express.json());

// Configuration IBAN par pays
const IBAN_CONFIG = {
  FR: { code: '27', length: 27 },
  DE: { code: '22', length: 22 },
  ES: { code: '24', length: 24 },
  IT: { code: '27', length: 27 },
  GB: { code: '22', length: 22 },
  NL: { code: '18', length: 18 },
  BE: { code: '16', length: 16 },
  AT: { code: '20', length: 20 },
  DK: { code: '18', length: 18 },
  FI: { code: '18', length: 18 },
  GR: { code: '27', length: 27 },
  HU: { code: '28', length: 28 },
  IE: { code: '22', length: 22 },
  LT: { code: '20', length: 20 },
  LV: { code: '21', length: 21 },
  LU: { code: '20', length: 20 },
  MT: { code: '31', length: 31 },
  NO: { code: '15', length: 15 },
  PL: { code: '28', length: 28 },
  PT: { code: '25', length: 25 },
  SE: { code: '24', length: 24 },
  CH: { code: '21', length: 21 },
  CZ: { code: '24', length: 24 },
  EE: { code: '20', length: 20 },
  HR: { code: '21', length: 21 },
  RO: { code: '24', length: 24 },
  SI: { code: '19', length: 19 },
  SK: { code: '24', length: 24 },
  BG: { code: '22', length: 22 },
  CY: { code: '28', length: 28 },
  US: { code: '34', length: 34 },
  CA: { code: '29', length: 29 },
  AU: { code: '23', length: 23 },
  BR: { code: '29', length: 29 },
};

// Fonction de génération IBAN avec BigInt
function generateIBAN(countryCode, retries = 0) {
  const MAX_RETRIES = 3;
  const config = IBAN_CONFIG[countryCode];
  
  if (!config) {
    throw new Error(`Pays non supporté: ${countryCode}`);
  }

  if (retries >= MAX_RETRIES) {
    throw new Error('Impossible de générer un IBAN valide après 3 tentatives');
  }

  // Générer le numéro de compte (partie variable)
  const accountLength = config.length - 8;
  const part1Length = Math.ceil(accountLength / 2);
  const part2Length = accountLength - part1Length;

  const part1 = Math.floor(Math.random() * Math.pow(10, part1Length))
    .toString()
    .padStart(part1Length, '0');
  const part2 = Math.floor(Math.random() * Math.pow(10, part2Length))
    .toString()
    .padStart(part2Length, '0');
  const accountNumber = part1 + part2;

  // Banque: 5 chiffres aléatoires
  const bankCode = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');

  // Construire IBAN sans checksum
  const ibanWithoutCheck = countryCode + '00' + bankCode + accountNumber;

  // Calculer le checksum mod-97
  let numeric = '';
  for (let char of ibanWithoutCheck) {
    if (isNaN(char)) {
      numeric += (char.charCodeAt(0) - 55).toString();
    } else {
      numeric += char;
    }
  }

  // Utiliser BigInt pour éviter les débordements numériques
  let remainder = BigInt(0);
  for (let digit of numeric) {
    remainder = (remainder * BigInt(10) + BigInt(digit)) % BigInt(97);
  }

  const checksum = (98 - remainder).toString().padStart(2, '0');
  const iban = countryCode + checksum + bankCode + accountNumber;

  // Valider l'IBAN
  if (!validateIBAN(iban)) {
    return generateIBAN(countryCode, retries + 1);
  }

  return iban;
}

function validateIBAN(iban) {
  iban = iban.replace(/\s/g, '').toUpperCase();
  
  if (iban.length < 15 || iban.length > 34) return false;
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban)) return false;

  let numeric = '';
  for (let char of iban) {
    if (isNaN(char)) {
      numeric += (char.charCodeAt(0) - 55).toString();
    } else {
      numeric += char;
    }
  }

  let remainder = BigInt(0);
  for (let digit of numeric) {
    remainder = (remainder * BigInt(10) + BigInt(digit)) % BigInt(97);
  }

  return remainder === BigInt(1);
}

// Routes API
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Serveur en ligne' });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    const { data, error } = await supabase.auth.signUpWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const user = data.user;
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret');

    res.json({
      user: { id: user.id, email: user.email },
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/accounts/create', async (req, res) => {
  try {
    const { userId, country } = req.body;

    if (!userId || !country) {
      return res.status(400).json({ message: 'userId et country requis' });
    }

    const iban = generateIBAN(country);

    const { error } = await supabase
      .from('accounts')
      .insert({
        user_id: userId,
        country,
        iban,
        balance: 0
      });

    if (error) {
      console.error('Erreur Supabase:', error);
      return res.status(400).json({ message: error.message });
    }

    res.json({ iban, country });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/users/:userId/ibans', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId);

    if (accountsError) {
      return res.status(400).json({ message: accountsError.message });
    }

    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(10);

    if (transactionsError) {
      return res.status(400).json({ message: transactionsError.message });
    }

    res.json({
      accounts: accounts || [],
      transactions: transactions || []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/iban/validate', async (req, res) => {
  try {
    const { iban } = req.body;

    if (!iban) {
      return res.status(400).json({ valid: false, message: 'IBAN requis' });
    }

    const valid = validateIBAN(iban);
    res.json({ valid, iban });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/iban/generate', async (req, res) => {
  try {
    const { country } = req.body;

    if (!country) {
      return res.status(400).json({ message: 'Pays requis' });
    }

    const iban = generateIBAN(country);
    res.json({ iban });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
});
