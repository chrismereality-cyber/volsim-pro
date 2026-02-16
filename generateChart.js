function generateChart(prices, width = 50) {
    if (!prices.length) return '';

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    let line = '';
    let prev = prices[0];

    for (let p of prices) {
        const pos = Math.round(((p - min) / range) * (width - 1));
        const color = p > prev ? "\x1b[32m" : p < prev ? "\x1b[31m" : "\x1b[37m";
        line += ' '.repeat(pos - line.length > 0 ? pos - line.length : 0) + color + '*' + "\x1b[0m";
        prev = p;
    }

    return line;
}

module.exports = generateChart;
