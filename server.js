const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') })
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const SocketServer = require('./socketServer')
const { ExpressPeerServer } = require('peer')
const { scheduleExpiryChecks, scheduleCleanup } = require('./utils/groupExpiryScheduler')

process.removeAllListeners('warning');

// Allowed origins - add all your frontend URLs here
const allowedOrigins = [
  'https://mern-social-media-vu92.onrender.com', // Your frontend URL
  'http://localhost:3000',                       // Local development
  'http://localhost:5000'                        // If you run frontend on port 5000
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified origin: ${origin}`;
      console.warn(msg);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 3600 // 1 hour
};


const app = express();

// Trust reverse proxy (needed for secure cookies on Render/HTTPS)
app.set('trust proxy', 1);

// Increase payload limit for large image data URLs
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.options("*" , cors(corsOptions));
app.use(cors(corsOptions));
app.use(cookieParser())


//#region // !Socket
const http = require('http').createServer(app);

// Initialize WebSocket server with CORS configuration
const initSocket = require('./socketConfig');
const io = initSocket(http);

// Initialize Socket.IO server
const SocketServer = require('./socketServer');

// Set up socket connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Initialize socket handlers
  SocketServer(socket);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

//#endregion

//#region // !Routes
app.use('/api', require('./routes/authRouter'));
app.use('/api', require('./routes/userRouter'));
app.use('/api', require('./routes/postRouter'));
app.use('/api', require('./routes/commentRouter'));
app.use('/api', require('./routes/adminRouter'));
app.use('/api', require('./routes/notifyRouter'));
app.use('/api', require('./routes/messageRouter'));
app.use('/api', require('./routes/seedRouter'));
app.use('/api', require('./routes/storyRouter'));
app.use('/api/settings', require('./routes/settingsRouter'));
app.use('/api/groups', require('./routes/groupRouter'));
app.use('/api/notifications', require('./routes/notificationRouter'));
//#endregion

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Basic error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ msg: 'Internal server error' });
});

const URI = process.env.MONGODB_URL;
mongoose.connect(URI, {
    useCreateIndex:true,
    useFindAndModify:false,
    useNewUrlParser:true,
    useUnifiedTopology:true
}, err => {
    if(err) throw err;
    console.log("Database Connected!!")
    
    // Start group expiry schedulers after DB connection
    scheduleExpiryChecks();
    scheduleCleanup();
    console.log("🕐 Group expiry schedulers initialized")
    
    // Start notification cleanup jobs
    const NotificationCleanupJob = require('./jobs/notificationCleanupJob');
    NotificationCleanupJob.init();
    console.log("🔔 Notification cleanup jobs initialized")
})

const port = process.env.PORT || 8080;
http.listen(port, () => {
  console.log("Listening on ", port);
});