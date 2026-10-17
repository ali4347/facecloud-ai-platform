import { USE_API } from '../../lib/api/config'
import DownloadsDemo from './DownloadsDemo'
import DownloadsLive from './DownloadsLive'

/** The real download history against the API; the original mock page in the demo build. */
export default function Downloads() {
  return USE_API ? <DownloadsLive /> : <DownloadsDemo />
}
