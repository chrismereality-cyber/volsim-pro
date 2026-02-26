import { onPriceUpdate } from './engine-hook.js';

// Simulation settings
let basePrice = 88500;
const volatility = 500; // max random swing

function getRandomPrice() {
  // Random price between basePrice - volatility and basePrice + volatility
  return (basePrice - volatility + Math.random() * (2 * volatility)).toFixed(2);
}

// Update engine every 2 seconds
setInterval(() => {
  const price = parseFloat(getRandomPrice());
  onPriceUpdate(price);
}, 2000);

console.log('🟢 Simulated Engine Running...');
