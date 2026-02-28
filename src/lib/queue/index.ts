import './report-worker'
import './alert-worker'

console.log('JyotishAI workers started')

process.on('SIGTERM', () => {
  console.log('Workers shutting down...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('Workers interrupted, shutting down...')
  process.exit(0)
})
