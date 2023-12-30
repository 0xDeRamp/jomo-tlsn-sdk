const SECOND = 1000;

export function getTimeDescriptionFromTimestamp(timestamp) {
  const now = Date.now()
  const difference = now - timestamp
  if (difference < 60 * SECOND) {
    return `Just now`
  }
  if (difference < 60 * 60 * SECOND) {
    const num = parseInt(difference / (60 * SECOND))
    return `${num} min${num > 1 ? "s" : ""} ago`
  }
  if (difference < 24 * 60 * 60 * SECOND) {
    const num = parseInt(difference / (60 * 60 * SECOND))
    return `${num} hr${num > 1 ? "s" : ""} ago`
  }
  const num = parseInt(difference / (24 * 60 * 60 * SECOND))
  return `${num} day${num > 1 ? "s" : ""} ago`
}