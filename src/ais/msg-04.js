import MsgBase from './msg-base.js'
import ais04Msg from 'masohi-aisparser/lib/Ais04Msg.js'
const AisMsg = ais04Msg.default

class Msg extends MsgBase {
  constructor (...args) {
    super(...args)
    this.fields = [
      'aisType:msgType',
      'channel',
      'mmsi',
      { key: 'latitude', newKey: 'lat', handler: this.fixFloat },
      { key: 'longitude', newKey: 'lng', handler: this.fixFloat },
      'utcYear',
      'utcMonth',
      'utcDay',
      'utcHour',
      'utcMinute:utcMin',
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
