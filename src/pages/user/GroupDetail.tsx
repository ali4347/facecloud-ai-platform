import { USE_API } from '../../lib/api/config'
import GroupDetailDemo from './GroupDetailDemo'
import GroupDetailLive from './GroupDetailLive'

/** The live page against the API, the original mock page in the demo build. */
export default function GroupDetail() {
  return USE_API ? <GroupDetailLive /> : <GroupDetailDemo />
}
