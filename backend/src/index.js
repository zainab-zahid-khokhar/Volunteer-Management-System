require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const db = require('./db');
const notificationService = require('./services/notificationService');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Swagger ─────────────────────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'VMS API', version: '1.0.0', description: 'Volunteer Management System API' },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── Error Handlers ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Cron: Event Reminders (runs daily at 8am) ────────────────────────────────
cron.schedule('0 8 * * *', async () => {
  logger.info('Running event reminder cron job...');
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const upcomingEvents = await db('events')
      .where({ event_date: dateStr, status: 'active' });

    for (const event of upcomingEvents) {
      const acceptedVolunteers = await db('applications')
        .join('users', 'users.id', 'applications.volunteer_id')
        .where({ event_id: event.id, status: 'accepted' })
        .select('applications.volunteer_id', 'users.email');

      for (const v of acceptedVolunteers) {
        await notificationService.dispatch({
          userId: v.volunteer_id,
          type: 'event_reminder',
          referenceId: event.id,
          title: `Reminder: ${event.name} is tomorrow`,
          body: `Don't forget you have "${event.name}" tomorrow at ${event.start_time}.`,
          email: v.email,
          emailData: { eventName: event.name, eventDate: event.event_date },
        });
      }
      logger.info(`Sent reminders for event: ${event.name} (${acceptedVolunteers.length} volunteers)`);
    }
  } catch (err) {
    logger.error('Cron job error:', err);
  }
});

// ─── Auto-complete past events (runs daily at midnight) ───────────────────────
cron.schedule('0 0 * * *', async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const updated = await db('events')
      .where('event_date', '<', today)
      .where('status', 'active')
      .update({ status: 'completed', updated_at: new Date() });
    if (updated > 0) logger.info(`Auto-completed ${updated} past events`);
  } catch (err) {
    logger.error('Auto-complete cron error:', err);
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  logger.info(`🚀 VMS Backend running on port ${PORT}`);
  logger.info(`📖 API docs: http://localhost:${PORT}/api/docs`);
  try {
    await db.raw('SELECT 1');
    logger.info('✅ Database connected');
  } catch (err) {
    logger.error('❌ Database connection failed:', err.message);
  }
});

module.exports = app;
