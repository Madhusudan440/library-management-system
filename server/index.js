import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  CloudLib Pro Backend API Server Started!          `);
  console.log(`  URL: http://localhost:${PORT}                     `);
  console.log(`  Health Check: http://localhost:${PORT}/api/health `);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`====================================================`);
});
