require('dotenv').config();
const mongoose = require('mongoose');

async function checkSessions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/utm-tracker');
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const sessions = await db.collection('sessions').find({}).limit(10).toArray();
    
    console.log(`\nTotal sessions found: ${sessions.length}`);
    console.log('\nSessions with conversions:');
    
    sessions.forEach(session => {
      if (session.conversions && session.conversions.length > 0) {
        console.log(`- Session ${session.sessionId}:`);
        console.log(`  Source: ${session.utm?.source || 'direct'}`);
        console.log(`  Conversions: ${session.conversions.length}`);
        console.log(`  Value: $${session.conversions.reduce((sum, c) => sum + (c.value || 0), 0)}`);
      }
    });
    
    console.log('\nAll sessions summary:');
    sessions.forEach(session => {
      console.log(`- ${session.sessionId}: ${session.utm?.source || 'direct'}/${session.utm?.medium || 'none'} - ${session.pageViews} views`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSessions();