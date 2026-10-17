import { USE_API } from '../../lib/api/config'
import ActivityLogsDemo from './ActivityLogsDemo'
import ActivityLogsLive from './ActivityLogsLive'

/** The real thing against the API; the original mock page in the demo build. */
export default function ActivityLogs() {
  return USE_API ? <ActivityLogsLive /> : <ActivityLogsDemo />
}
