import aisBitField from 'masohi-aisparser/lib/AisBitField.js'
const { default: AisBitField } = aisBitField

class MsgBase {
  constructor (aisStr, padBit, channel) {
    this.bitField = new AisBitField(aisStr, padBit)
    this.aisType = this.bitField.getInt(0, 6, true)
    this.channel = channel
    this.fields = []
    this.keys = []
  }

  sanitizeFields () {
    this.fields = this.fields.map(f => {
      if (typeof f === 'string') {
        let [key, newKey] = f.split(':')
        if (!newKey) newKey = key
        return { key, newKey }
      }
      if (!f.newKey) f.newKey = f.key
      return f
    })
    this.keys = this.fields.map(f => f.key)
  }

  postProcess (rec) {
    if (rec.valid !== 'VALID') throw new Error(`Invalid sentence: ${rec.errMsg}`)
    const result = {}
    const keys = this.keys.length > 0 ? this.keys : Object.keys(rec.supportedValues)
    for (const key of keys) {
      const field = this.fields.find(f => f.key === key)
      if (!field) {
        result[key] = rec[key]
        continue
      }
      const args = [rec[key], rec]
      if (field.opts) args.push(field.opts)
      let val = field.handler ? field.handler(...args) : rec[key]
      val = typeof val === 'string' ? val.trim() : val
      if (typeof val === 'string') {
        if (val === '') val = null
      } else if (isNaN(val)) val = null
      result[field.newKey] = val
    }
    return result
  }

  kn2Kmh (val, rec) {
    return parseFloat((val * 1.852).toFixed(2))
  }

  fixFloat (val, rec, prec = 5) {
    return parseFloat(val.toFixed(prec))
  }

  getEta (val, rec) {
    const month = ((rec.etaMonth || 0) + '').padStart(2, '0')
    const day = ((rec.etaDay || 0) + '').padStart(2, '0')
    const hour = ((rec.etaHour || 0) + '').padStart(2, '0')
    const min = ((rec.etaMinute || 0) + '').padStart(2, '0')
    return `${month}-${day} ${hour}:${min}`
  }
}

export default MsgBase
