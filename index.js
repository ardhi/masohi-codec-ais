import Ais from './src/ais.js'

async function factory (pkgName) {
  const me = this

  return class MasohiCodecAis extends this.lib.BajoPlugin {
    constructor () {
      super(pkgName, me.app)
      this.alias = 'codec-ais'
      this.dependencies = ['masohi']
    }

    init = async () => {
    }

    createDecoder = () => {
      return new Ais()
    }
  }
}

export default factory
