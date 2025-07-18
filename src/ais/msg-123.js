import MsgBase from './msg-base.js'
import aisCNBMsg from 'masohi-aisparser/lib/AisCNBMsg.js'

const AisMsg = aisCNBMsg.default

class Msg extends MsgBase {
  constructor (...args) {
    super(...args)
    this.fields = [
      'aisType:msgType',
      'channel',
      'mmsi',
      { key: 'latitude', newKey: 'lat', handler: this.fixFloat },
      { key: 'longitude', newKey: 'lng', handler: this.fixFloat },
      'heading',
      { key: 'sog', newKey: 'speed', handler: this.kn2Kmh },
      'cog:course',
      { key: 'rot', handler: this.fixFloat, opts: 2 },
      'navStatus:navStat',
      'maneuver',
      'class',
      'utcTsSec:utcSec',
      'posAccuracy',
      'midCountryIso:country',
      'epfd'
    ]
    this.sanitizeFields()
  }

  format () {
    return this.postProcess(new AisMsg(this.aisType, this.bitField, this.channel))
  }
}

function msg (aisStr, padBit, channel) {
  const msg = new Msg(aisStr, padBit, channel)
  return msg.format()
}

export default msg
