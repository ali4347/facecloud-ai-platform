import { USE_API } from '../../lib/api/config'
import NotificationsDemo from './NotificationsDemo'
import NotificationsLive from './NotificationsLive'

/** The real thing against the API; the original mock page in the demo build. */
export default function Notifications() {
  return USE_API ? <NotificationsLive /> : <NotificationsDemo />
}
