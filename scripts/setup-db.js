const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const dbUrl = process.env.DATABASE_URL || '';

let schema = fs.readFileSync(schemaPath, 'utf8');

if (dbUrl.startsWith('postgresql://')) {
  console.log('🔧 PostgreSQL detected - switching schema provider...');
  
  // Replace SQLite provider with PostgreSQL
  schema = schema.replace(
    /provider = "sqlite"/,
    'provider = "postgresql"'
  );
  
  // Replace the url line to use DIRECT_URL for connection pooling
  if (!schema.includes('directUrl')) {
    schema = schema.replace(
      /url\s+= env\("DATABASE_URL"\)/,
      'url       = env("DIRECT_URL")\n  directUrl = env("DATABASE_URL")'
    );
  }
  
  fs.writeFileSync(schemaPath, schema);
  console.log('✅ Schema switched to PostgreSQL');
} else {
  console.log('🔧 SQLite/local detected - keeping SQLite provider');
}

// Generate Prisma client
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');
} catch (error) {
  console.error('❌ Prisma generate failed:', error.message);
  process.exit(1);
}
