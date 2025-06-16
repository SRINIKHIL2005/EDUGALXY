// JWT Test Token Generator
import jwt from 'jsonwebtoken';

// Test user data
const testUser = {
  id: '12345',
  name: 'Test HOD',
  email: 'hod@test.com',
  role: 'hod',
  department: 'Engineering'
};

// Generate token with default secret
const secret = 'your_jwt_secret';
const token = jwt.sign(testUser, secret, { expiresIn: '24h' });

console.log('TEST TOKEN GENERATED');
console.log('--------------------------');
console.log('Token:', token);
console.log('--------------------------');
console.log('To use this token in your browser:');
console.log(`localStorage.setItem('eduToken', '${token}');`);
console.log(`localStorage.setItem('eduUser', '${JSON.stringify(testUser)}');`);
console.log('--------------------------');
