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

// Allow your hosted frontend origin (Render) and localhost during development
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      'https://mysocial-frontend-nm3u.onrender.com', // your Render frontend
    ]
  : [
      'http://localhost:3000'
    ];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
const io = require('socket.io')(http, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});



io.on('connection', socket => {
    SocketServer(socket);
})

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
})

const port = process.env.PORT || 8080;
http.listen(port, () => {
  console.log("Listening on ", port);
});