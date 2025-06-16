// Test MongoDB Connection
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

// Connection URL
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eduFeedback';
console.log('🔄 Attempting to connect to MongoDB at:', mongoURI);

// Connect to MongoDB with retry
async function connectWithRetry(maxRetries = 3, timeout = 5000) {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      console.log(`🔄 Connection attempt ${retries + 1} of ${maxRetries}...`);
      
      await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: timeout,
      });
      
      console.log('✅ Successfully connected to MongoDB!');
      console.log('📊 Connection state:', mongoose.connection.readyState);
      console.log('🔗 Host:', mongoose.connection.host);
      console.log('📁 Database:', mongoose.connection.name);
      
      // Check if we can perform operations
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('📋 Available collections:', collections.map(c => c.name).join(', '));
      
      // Create a test document to verify write access
      const TestModel = mongoose.model('TestConnection', new mongoose.Schema({
        message: String,
        timestamp: { type: Date, default: Date.now }
      }));
      
      const testDoc = new TestModel({ message: 'Connection test successful' });
      await testDoc.save();
      console.log('✅ Successfully wrote test document to database!');
      
      const count = await TestModel.countDocuments();
      console.log(`✅ Found ${count} test documents in database`);
      
      // Cleanup test document
      await TestModel.deleteOne({ _id: testDoc._id });
      console.log('🧹 Cleaned up test document');
      
      break;
    } catch (err) {
      retries++;
      console.error('❌ MongoDB connection error:', err.message);
      
      if (retries < maxRetries) {
        console.log(`⏳ Retrying in ${timeout/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, timeout));
      } else {
        console.error('❌ Failed to connect after maximum retries');
        process.exit(1);
      }
    }
  }
}

// Run the connection test
connectWithRetry()
  .then(() => {
    console.log('✨ MongoDB connection test completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('💥 Fatal error during connection test:', err);
    process.exit(1);
  });
