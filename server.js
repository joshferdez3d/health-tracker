// server.js
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files

// Handle service account for both development and production
let serviceAccount;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  // Production: use environment variable
  serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
} else {
  // Development: use local file (only when running locally)
  try {
    serviceAccount = require('./config/serviceAccountKey.json');
  } catch (error) {
    console.error('Missing Firebase credentials. Set GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable.');
    process.exit(1);
  }
}
// UPDATED CODE
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

// Helper function to validate required fields
const validateRequiredFields = (data, requiredFields) => {
  const missingFields = requiredFields.filter(field => !data[field]);
  return missingFields.length === 0 ? null : missingFields;
};

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Health Tracker API is running' });
});

// === WEIGHT ENDPOINTS ===

// Add weight measurement
app.post('/api/weight', async (req, res) => {
  try {
    const { time, value, date = getTodayDate() } = req.body;
    
    const missingFields = validateRequiredFields(req.body, ['time', 'value']);
    if (missingFields) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missingFields 
      });
    }

    const weightData = {
      type: 'weight',
      time,
      value: parseFloat(value),
      date,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('healthData').add(weightData);
    
    res.status(201).json({ 
      id: docRef.id, 
      message: 'Weight measurement added successfully',
      data: weightData
    });
  } catch (error) {
    console.error('Error adding weight:', error);
    res.status(500).json({ error: 'Failed to add weight measurement' });
  }
});

// Get weight measurements
app.get('/api/weight', async (req, res) => {
  try {
    const { date, limit = 50 } = req.query;
    
    let query = db.collection('healthData').where('type', '==', 'weight');
    
    if (date) {
      query = query.where('date', '==', date);
    }
    
    query = query.orderBy('createdAt', 'desc').limit(parseInt(limit));
    
    const snapshot = await query.get();
    const weights = [];
    
    snapshot.forEach(doc => {
      weights.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(weights);
  } catch (error) {
    console.error('Error fetching weights:', error);
    res.status(500).json({ error: 'Failed to fetch weight measurements' });
  }
});

// === GLUCOSE ENDPOINTS ===

// Add glucose measurement
app.post('/api/glucose', async (req, res) => {
  try {
    const { time, value, date = getTodayDate() } = req.body;
    
    const missingFields = validateRequiredFields(req.body, ['time', 'value']);
    if (missingFields) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missingFields 
      });
    }

    const glucoseData = {
      type: 'glucose',
      time,
      value: parseFloat(value),
      date,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('healthData').add(glucoseData);
    
    res.status(201).json({ 
      id: docRef.id, 
      message: 'Glucose measurement added successfully',
      data: glucoseData
    });
  } catch (error) {
    console.error('Error adding glucose:', error);
    res.status(500).json({ error: 'Failed to add glucose measurement' });
  }
});

// Get glucose measurements
app.get('/api/glucose', async (req, res) => {
  try {
    const { date, limit = 50 } = req.query;
    
    let query = db.collection('healthData').where('type', '==', 'glucose');
    
    if (date) {
      query = query.where('date', '==', date);
    }
    
    query = query.orderBy('createdAt', 'desc').limit(parseInt(limit));
    
    const snapshot = await query.get();
    const glucose = [];
    
    snapshot.forEach(doc => {
      glucose.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(glucose);
  } catch (error) {
    console.error('Error fetching glucose:', error);
    res.status(500).json({ error: 'Failed to fetch glucose measurements' });
  }
});

// === BLOOD PRESSURE ENDPOINTS ===

// Add blood pressure measurement
app.post('/api/blood-pressure', async (req, res) => {
  try {
    const { time, systolic, diastolic, date = getTodayDate() } = req.body;
    
    const missingFields = validateRequiredFields(req.body, ['time', 'systolic', 'diastolic']);
    if (missingFields) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missingFields 
      });
    }

    const bpData = {
      type: 'blood-pressure',
      time,
      systolic: parseFloat(systolic),
      diastolic: parseFloat(diastolic),
      value: `${systolic}/${diastolic}`,
      date,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('healthData').add(bpData);
    
    res.status(201).json({ 
      id: docRef.id, 
      message: 'Blood pressure measurement added successfully',
      data: bpData
    });
  } catch (error) {
    console.error('Error adding blood pressure:', error);
    res.status(500).json({ error: 'Failed to add blood pressure measurement' });
  }
});

// Get blood pressure measurements
app.get('/api/blood-pressure', async (req, res) => {
  try {
    const { date, limit = 50 } = req.query;
    
    let query = db.collection('healthData').where('type', '==', 'blood-pressure');
    
    if (date) {
      query = query.where('date', '==', date);
    }
    
    query = query.orderBy('createdAt', 'desc').limit(parseInt(limit));
    
    const snapshot = await query.get();
    const bloodPressure = [];
    
    snapshot.forEach(doc => {
      bloodPressure.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(bloodPressure);
  } catch (error) {
    console.error('Error fetching blood pressure:', error);
    res.status(500).json({ error: 'Failed to fetch blood pressure measurements' });
  }
});

// === FLUID INTAKE ENDPOINTS ===

// Add fluid intake
app.post('/api/fluid', async (req, res) => {
  try {
    const { type, amount, time, date = getTodayDate() } = req.body;
    
    const missingFields = validateRequiredFields(req.body, ['type', 'amount', 'time']);
    if (missingFields) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missingFields 
      });
    }

    const fluidData = {
      type,
      amount: parseFloat(amount),
      time,
      date,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('fluidIntake').add(fluidData);
    
    res.status(201).json({ 
      id: docRef.id, 
      message: 'Fluid intake added successfully',
      data: fluidData
    });
  } catch (error) {
    console.error('Error adding fluid:', error);
    res.status(500).json({ error: 'Failed to add fluid intake' });
  }
});

// Get fluid intake
app.get('/api/fluid', async (req, res) => {
  try {
    const { date = getTodayDate(), limit = 100 } = req.query;
    
    let query = db.collection('fluidIntake');
    
    if (date) {
      query = query.where('date', '==', date);
    }
    
    query = query.orderBy('time', 'asc').limit(parseInt(limit));
    
    const snapshot = await query.get();
    const fluids = [];
    let totalAmount = 0;
    
    snapshot.forEach(doc => {
      const data = { id: doc.id, ...doc.data() };
      fluids.push(data);
      totalAmount += data.amount;
    });
    
    res.json({ 
      fluids, 
      totalAmount,
      remainingAmount: Math.max(0, 1500 - totalAmount),
      percentageConsumed: Math.round((totalAmount / 1500) * 100)
    });
  } catch (error) {
    console.error('Error fetching fluid intake:', error);
    res.status(500).json({ error: 'Failed to fetch fluid intake' });
  }
});

// Delete fluid intake
app.delete('/api/fluid/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.collection('fluidIntake').doc(id).delete();
    
    res.json({ message: 'Fluid intake deleted successfully' });
  } catch (error) {
    console.error('Error deleting fluid:', error);
    res.status(500).json({ error: 'Failed to delete fluid intake' });
  }
});

// === REMINDERS ENDPOINTS ===

// Add reminder
app.post('/api/reminders', async (req, res) => {
  try {
    const { type, time, frequency } = req.body;
    
    const missingFields = validateRequiredFields(req.body, ['type', 'time', 'frequency']);
    if (missingFields) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missingFields 
      });
    }

    const reminderData = {
      type,
      time,
      frequency,
      active: true,
      createdAt: new Date().toISOString(),
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('reminders').add(reminderData);
    
    res.status(201).json({ 
      id: docRef.id, 
      message: 'Reminder added successfully',
      data: reminderData
    });
  } catch (error) {
    console.error('Error adding reminder:', error);
    res.status(500).json({ error: 'Failed to add reminder' });
  }
});

// Get reminders
app.get('/api/reminders', async (req, res) => {
  try {
    const { active = true } = req.query;
    
    let query = db.collection('reminders');
    
    if (active !== undefined) {
      query = query.where('active', '==', active === 'true');
    }
    
    query = query.orderBy('time', 'asc');
    
    const snapshot = await query.get();
    const reminders = [];
    
    snapshot.forEach(doc => {
      reminders.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// Delete reminder
app.delete('/api/reminders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.collection('reminders').doc(id).delete();
    
    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

// === COMBINED DATA ENDPOINTS ===

// Get all health data for history
app.get('/api/health-data', async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;
    
    let query = db.collection('healthData');
    
    if (startDate) {
      query = query.where('date', '>=', startDate);
    }
    
    if (endDate) {
      query = query.where('date', '<=', endDate);
    }
    
    query = query.orderBy('date', 'desc').orderBy('createdAt', 'desc').limit(parseInt(limit));
    
    const snapshot = await query.get();
    const healthData = [];
    
    snapshot.forEach(doc => {
      healthData.push({ id: doc.id, ...doc.data() });
    });
    
    // Group by date and type
    const groupedData = {};
    healthData.forEach(item => {
      if (!groupedData[item.date]) {
        groupedData[item.date] = {
          weight: [],
          glucose: [],
          'blood-pressure': []
        };
      }
      groupedData[item.date][item.type].push(item);
    });
    
    res.json({ healthData, groupedData });
  } catch (error) {
    console.error('Error fetching health data:', error);
    res.status(500).json({ error: 'Failed to fetch health data' });
  }
});

// Get daily summary
app.get('/api/daily-summary', async (req, res) => {
  try {
    const { date = getTodayDate() } = req.query;
    
    // Get health data for the date
    const healthSnapshot = await db.collection('healthData')
      .where('date', '==', date)
      .get();
    
    // Get fluid intake for the date
    const fluidSnapshot = await db.collection('fluidIntake')
      .where('date', '==', date)
      .get();
    
    const healthData = [];
    const fluidData = [];
    let totalFluidIntake = 0;
    
    healthSnapshot.forEach(doc => {
      healthData.push({ id: doc.id, ...doc.data() });
    });
    
    fluidSnapshot.forEach(doc => {
      const data = { id: doc.id, ...doc.data() };
      fluidData.push(data);
      totalFluidIntake += data.amount;
    });
    
    // Group health data by type
    const groupedHealthData = {
      weight: healthData.filter(item => item.type === 'weight'),
      glucose: healthData.filter(item => item.type === 'glucose'),
      'blood-pressure': healthData.filter(item => item.type === 'blood-pressure')
    };
    
    res.json({
      date,
      healthData: groupedHealthData,
      fluidIntake: {
        entries: fluidData,
        totalAmount: totalFluidIntake,
        remainingAmount: Math.max(0, 1500 - totalFluidIntake),
        percentageConsumed: Math.round((totalFluidIntake / 1500) * 100)
      }
    });
  } catch (error) {
    console.error('Error fetching daily summary:', error);
    res.status(500).json({ error: 'Failed to fetch daily summary' });
  }
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🏥 Health Tracker API running on port ${PORT}`);
  console.log(`📊 Access the application at http://localhost:${PORT}`);
});

module.exports = app;