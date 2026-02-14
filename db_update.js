import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ user: 'postgres', host: '127.0.0.1', database: 'volsim', password: 'password123', port: 5432 });

async function update() {
    try {
        await pool.query("ALTER TABLE simulations ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
        console.log("? SUCCESS: Timestamp column added.");
    } catch (err) {
        console.log("? NOTE: Column might already exist or: " + err.message);
    }
    process.exit();
}
update();
