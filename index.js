import Ais from './src/ais.js'

async function factory (pkgName) {
  const me = this

  class MasohiCodecAis extends this.lib.Plugin {
    static alias = 'codec-ais'
    static dependencies = ['masohi']

    constructor () {
      super(pkgName, me.app)
    }

    init = async () => {
    }

    createDecoder = () => {
      return new Ais()
    }
  }

  return MasohiCodecAis
}

export default factory
