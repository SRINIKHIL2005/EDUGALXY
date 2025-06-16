// JWT Token Fix Script
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

console.log('🔄 JWT Token Fix Script');
console.log('============================');

// Check if JWT_SECRET is set
const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
console.log(`📄 JWT_SECRET is ${process.env.JWT_SECRET ? 'set in env vars' : 'using default'}`);

// Generate a test token
const testUser = {
  id: "test123",
  name: "Test User",
  email: "test@example.com",
  role: "hod",
  department: "Engineering"
};

// Token generation
console.log('🔑 Generating test token...');
const token = jwt.sign(testUser, jwtSecret, { expiresIn: '1h' });
console.log('✅ Token generated successfully');
console.log('📝 Token:', token);

// Token verification test
console.log('\n🔍 Testing token verification...');
try {
  const decoded = jwt.verify(token, jwtSecret);
  console.log('✅ Token verification successful');
  console.log('📄 Decoded token payload:', decoded);
} catch (error) {
  console.error('❌ Token verification failed:', error.message);
}

// Try to create a .env file with the secret if it doesn't exist
const envPath = './.env';
if (!fs.existsSync(envPath)) {
  console.log('\n📝 Creating .env file with JWT_SECRET...');
  fs.writeFileSync(envPath, `JWT_SECRET=${jwtSecret}\n`, 'utf8');
  console.log('✅ .env file created');
} else {
  console.log('\n📝 .env file already exists');
  // Check if it contains JWT_SECRET
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (!envContent.includes('JWT_SECRET=')) {
    console.log('📝 Adding JWT_SECRET to .env file...');
    fs.appendFileSync(envPath, `\nJWT_SECRET=${jwtSecret}\n`, 'utf8');
    console.log('✅ JWT_SECRET added to .env file');
  } else {
    console.log('✅ .env file already contains JWT_SECRET');
  }
}

console.log('\n🔄 JWT token configuration check complete');
console.log('============================');

// Print information for frontend
console.log('\n📱 For frontend testing:');
console.log('1. Copy this token for manual testing:');
console.log(token);
console.log('\n2. Add this to localStorage in your browser console:');
console.log(`localStorage.setItem('eduToken', '${token}');`);
console.log(`localStorage.setItem('eduUser', '${JSON.stringify(testUser)}');`);
console.log('\n3. Then refresh the page');
