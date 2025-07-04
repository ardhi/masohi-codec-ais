import aisBitField from 'masohi-aisparser/lib/AisBitField.js'
import msg123 from './ais/msg-123.js'
import msg04 from './ais/msg-04.js'
import msg05 from './ais/msg-05.js'
import msg18 from './ais/msg-18.js'
import msg19 from './ais/msg-19.js'
import msg21 from './ais/msg-21.js'
import msg24 from './ais/msg-24.js'
import msg27 from './ais/msg-27.js'
import fs from 'fs'

const { default: AisBitField } = aisBitField
const prefixes = ['!AIVDO', '!AIVDM', '!ABVDO', '!ABVDM']
const dsTypes = [1, 2, 3, 18, 19]

class Ais {
  constructor (opts = {}) {
    this.dsWindow = opts.downsamplingWindow ?? 1
    if (opts.downsamplingTmpDir && fs.existsSync(opts.downsamplingTmpDir)) {
      this.dsTmpDir = opts.downsamplingTmpDir
    }
    this._context = {}
    this._ds = {}
  }

  _postProcess (rec) {
    const result = {}
    if (rec.valid !== 'VALID') throw new Error(`Invalid sentence: ${rec.errMsg}`)
    for (const field in rec.supportedValues) {
      result[field] = rec[field]
    }
    return result
  }

  isValidChecksum (sentence) {
    const idx = sentence.indexOf('*')
    if ((idx === -1) || (idx < 2)) return false

    let chkSum = 0
    for (let i = 1; i < idx; i++) {
      chkSum ^= sentence.charCodeAt(i) & 0xFF
    }

    let chkSumStr = chkSum.toString(16).toUpperCase()
    if (chkSumStr.length < 2) chkSumStr = '0' + chkSumStr
    return chkSumStr === sentence.substr(idx + 1)
  }

  parse (params) {
    if (typeof params === 'string') params = { payload: params, checksum: true }
    const { payload: sentence, checksum = true } = params
    if (!sentence) throw new Error('Empty sentence')
    const [prefix] = sentence.split(',')
    if (!prefixes.includes(prefix)) throw new Error(`Invalid type: ${prefix}`)
    if (checksum && !this.isValidChecksum(sentence)) throw new Error(`Invalid checksum: ${sentence}`)

    const part = sentence.split(',')
    if (part.length !== 7) throw new Error(`Invalid length: ${sentence}`)
    const msgCount = Number(part[1])
    const msgIdx = Number(part[2])
    const msgId = part[3]
    const padBit = Number(part[6].substr(0, 1))
    let aisStr = part[5]
    if (msgCount > 1) {
      if (msgIdx === msgCount) {
        const msgParts = this._context[msgId]
        if (!msgParts) throw new Error(`Invalid prior message: ${sentence}`)
        if (msgIdx !== (msgParts.idx + 1)) {
          delete this._context[msgId]
          throw new Error(`Invalid sequence: ${sentence}`)
        }
        aisStr = msgParts.aisStr + aisStr
        delete this._context[msgId]
      } else {
        if (padBit !== 0) throw new Error(`Invalid pad bit: ${sentence}`)
        const msgParts = this._context[msgId]
        if (msgIdx === 1) {
          if (typeof msgParts !== 'undefined') {
            delete this._context[msgId]
            throw new Error(`Invalid sequence index: ${sentence}`)
          }
          this._context[msgId] = { idx: msgIdx, aisStr }
          throw new Error('Incomplete sentence')
        } else {
          if (!msgParts) throw new Error(`Invalid prior message: ${sentence}`)
          if (msgIdx !== (msgParts.idx + 1)) {
            delete this._context[msgId]
            throw new Error(`Invalid sequence: ${sentence}`)
          }
          msgParts.idx = msgIdx
          msgParts.aisStr += aisStr
          throw new Error('Incomplete sentence')
        }
      }
    } else {
      if (msgIdx !== 1) throw new Error(`Invalid sequence index: ${sentence}`)
    }

    try {
      const bitField = new AisBitField(aisStr, padBit)
      const aisType = bitField.getInt(0, 6, true)
      if (this.dsWindow > 0 && dsTypes.includes(aisType) && bitField && (bitField.bits >= 38)) {
        const mmsi = bitField.getInt(8, 30, true)
        const key = `${mmsi}_${aisType}`
        const now = Math.floor(Date.now() / 1000)
        if (this.dsTmpDir) {
          const file = `${this.dsTmpDir}/${key}.txt`
          if (fs.existsSync(file)) {
            const content = parseInt(fs.readFileSync(file, 'utf8')) ?? now
            const delta = now - content
            if (delta < this.dsWindow) throw new Error(`Downsampling, MMSI: ${mmsi}, Type: ${aisType}, Delta: ${delta}`)
          }
          fs.writeFileSync(file, now + '', 'utf8')
        } else {
          if (this._ds[key]) {
            const delta = now - this._ds[key]
            if (delta < this.dsWindow) throw new Error(`Downsampling, MMSI: ${mmsi}, Type: ${aisType}, Delta: ${delta}`)
          }
          this._ds[key] = now
        }
      }
      let decoded
      switch (aisType) {
        case 1:
        case 2:
        case 3: decoded = msg123(aisStr, padBit, part[4]); break
        case 4: decoded = msg04(aisStr, padBit, part[4]); break
        case 5: decoded = msg05(aisStr, padBit, part[4]); break
        case 18: decoded = msg18(aisStr, padBit, part[4]); break
        case 19: decoded = msg19(aisStr, padBit, part[4]); break
        case 21: decoded = msg21(aisStr, padBit, part[4]); break
        case 24: decoded = msg24(aisStr, padBit, part[4]); break
        case 27: decoded = msg27(aisStr, padBit, part[4]); break
        default:
          throw new Error(`Unsupported AIS type: ${aisType}`)
      }
      params.payload = decoded
      return decoded
    } catch (err) {
      throw new Error(err.message)
    }
  }
}

export default Ais
