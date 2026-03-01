const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Load Vault from Disk or Start at 0
let vaultData = { balance: 0 };
if (fs.existsSync('./vault.json')) {
    vaultData = JSON.parse(fs.readFileSync('./vault.json'));
}

let terminalState = {
    account: { equity: "19.69", profit: "0.00", vault: vaultData.balance },
    trades: [],
    version: "v5.9.5"
};

app.get('/', (req, res) => res.status(200).send(`TITAN ${terminalState.version}: VAULT ACTIVE`));

app.get('/api/trade/status', (req, res) => {
    terminalState.account.vault = vaultData.balance; // Sync vault
    res.json(terminalState);
});

app.post('/api/trade/status', (req, res) => {
    const { account, trades } = req.body;
    
    // VAULT LOGIC: If profit is positive, secure 15%
    let currentProfit = parseFloat(account.profit || 0);
    if (currentProfit > 0) {
        let secureAmount = currentProfit * 0.15;
        vaultData.balance += secureAmount;
        // Save to disk immediately
        fs.writeFileSync('./vault.json', JSON.stringify(vaultData));
    }

    terminalState.account = account || terminalState.account;
    terminalState.account.vault = vaultData.balance;
    terminalState.trades = trades || [];
    
    res.json({ status: "success", vault_secured: vaultData.balance });
});

app.listen(PORT, () => console.log(`TITAN Node Server running on port ${PORT}`));
