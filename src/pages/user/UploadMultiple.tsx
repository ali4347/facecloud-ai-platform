import { USE_API } from '../../lib/api/config'
import UploadMultipleDemo from './UploadMultipleDemo'
import UploadMultipleLive from './UploadMultipleLive'

/** The real upload against the API; the original simulated screen in the demo build. */
export default function UploadMultiple({ embedded = false }: { embedded?: boolean }) {
  return USE_API ? <UploadMultipleLive embedded={embedded} /> : <UploadMultipleDemo embedded={embedded} />
}
