import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

// 13:05 UTC = 08:05 en America/Bogota (UTC-5 todo el año).
crons.cron('recordatorios de hitos PT', '5 13 * * *', internal.pt.calendar.scheduleDailyReminders, {})

export default crons
