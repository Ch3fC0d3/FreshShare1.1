const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    await mongoose.connect('mongodb://127.0.0.1:27017/bezkoder_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('MongoDB connection successful!');
    
    // Create a simple test collection
    const Test = mongoose.model('Test', new mongoose.Schema({ name: String }));
    
    // Try to write something
    await new Test({ name: 'test' }).save();
    console.log('Successfully wrote to database');
    
    // Try to read something
    const result = await Test.findOne({ name: 'test' });
    console.log('Successfully read from database:', result);
    
    await mongoose.connection.close();
    console.log('Connection closed successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

testConnection();
