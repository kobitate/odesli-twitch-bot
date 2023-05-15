module.exports = (message, level) => {
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const color = level === 'error' ? '\x1b[33m' : ''
  console.log(`[${time}] ${color}${level || 'info'}: ${message}\x1b[0m`)
}
