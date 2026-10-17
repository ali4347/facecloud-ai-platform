import { USE_API } from '../../lib/api/config'
import UploadZipDemo from './UploadZipDemo'
import UploadZipLive from './UploadZipLive'

/** The real upload against the API; the original simulated screen in the demo build. */
export default function UploadZip() {
  return USE_API ? <UploadZipLive /> : <UploadZipDemo />
}
